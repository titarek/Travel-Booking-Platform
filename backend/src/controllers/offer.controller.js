import mongoose from 'mongoose';
import { Offer } from '../models/offer.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { memoryStore } from '../utils/memoryStore.js';

const logAudit = async ({
  adminEmail,
  action,
  targetType,
  targetName,
  reason,
  ipAddress,
}) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const logEntry = {
      adminEmail: adminEmail || 'admin@travel.test',
      action,
      targetType,
      targetName: targetName || 'N/A',
      reason: reason || 'Admin operation executed',
      ipAddress: ipAddress || '127.0.0.1',
      createdAt: new Date(),
    };
    if (isDbConnected) {
      await AuditLog.create(logEntry);
    } else {
      memoryStore.auditLogs.unshift(logEntry);
    }
  } catch {
    // Fail-safe
  }
};

/**
 * Public: Get active offers for customer homepage
 */
export const getPublicOffers = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const dbOffers = await Offer.find({ active: true }).sort({ order: 1, createdAt: -1 });
      if (dbOffers && dbOffers.length > 0) {
        return res.status(200).json({ success: true, count: dbOffers.length, data: dbOffers });
      }
    }

    const activeFallback = memoryStore.offers.filter((o) => o.active !== false);
    return res.status(200).json({ success: true, count: activeFallback.length, data: activeFallback });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Get all offers (active and inactive)
 */
export const getAdminOffers = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      const dbOffers = await Offer.find().sort({ order: 1, createdAt: -1 });
      if (dbOffers && dbOffers.length > 0) {
        return res.status(200).json({ success: true, count: dbOffers.length, data: dbOffers });
      }
    }

    return res.status(200).json({
      success: true,
      count: memoryStore.offers.length,
      data: memoryStore.offers,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Create a new offer
 */
export const createOffer = async (req, res, next) => {
  try {
    const {
      title,
      subtitle,
      tag,
      category,
      discount,
      promoCode,
      buttonText,
      link,
      gradient,
      features,
      validUntil,
      active,
      order,
    } = req.body;

    const offerData = {
      title,
      subtitle,
      tag: tag || 'Special Deal',
      category: category || 'special_offer',
      discount: discount || '',
      promoCode: promoCode || '',
      buttonText: buttonText || 'View Deal',
      link: link || '/flights',
      gradient: gradient || 'from-brand-600 to-sky-700',
      features: Array.isArray(features) ? features : [],
      validUntil: validUntil || 'Valid until Dec 2026',
      active: active !== undefined ? active : true,
      order: order !== undefined ? Number(order) : 0,
    };

    let createdOffer = null;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      createdOffer = await Offer.create(offerData);
    } else {
      const id = `off-${Date.now()}`;
      createdOffer = {
        _id: id,
        id,
        ...offerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.offers.unshift(createdOffer);
    }

    await logAudit({
      adminEmail: req.user?.email || 'admin@travel.test',
      action: 'CREATE_OFFER',
      targetType: 'Offer',
      targetName: createdOffer.title,
      reason: `Created offer: ${createdOffer.title} (${createdOffer.discount || 'Special'})`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(201).json({
      success: true,
      message: 'Offer created successfully.',
      data: createdOffer,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Update an existing offer
 */
export const updateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const isDbConnected = mongoose.connection.readyState === 1;

    let updated = null;

    if (isDbConnected && mongoose.isValidObjectId(id)) {
      updated = await Offer.findByIdAndUpdate(id, updates, { new: true });
    }

    if (!updated) {
      const idx = memoryStore.offers.findIndex((o) => (o._id || o.id).toString() === id);
      if (idx !== -1) {
        memoryStore.offers[idx] = {
          ...memoryStore.offers[idx],
          ...updates,
          updatedAt: new Date(),
        };
        updated = memoryStore.offers[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    await logAudit({
      adminEmail: req.user?.email || 'admin@travel.test',
      action: 'UPDATE_OFFER',
      targetType: 'Offer',
      targetName: updated.title,
      reason: `Updated offer details for ${updated.title}`,
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(200).json({
      success: true,
      message: 'Offer updated successfully.',
      data: updated,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Delete an offer
 */
export const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const isDbConnected = mongoose.connection.readyState === 1;

    let deleted = null;

    if (isDbConnected && mongoose.isValidObjectId(id)) {
      deleted = await Offer.findByIdAndDelete(id);
    }

    if (!deleted) {
      const idx = memoryStore.offers.findIndex((o) => (o._id || o.id).toString() === id);
      if (idx !== -1) {
        [deleted] = memoryStore.offers.splice(idx, 1);
      }
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Offer not found.' });
    }

    await logAudit({
      adminEmail: req.user?.email || 'admin@travel.test',
      action: 'DELETE_OFFER',
      targetType: 'Offer',
      targetName: deleted.title,
      reason: reason || 'Deleted by admin from portal',
      ipAddress: req.ip || '127.0.0.1',
    });

    return res.status(200).json({
      success: true,
      message: 'Offer deleted successfully.',
      data: deleted,
    });
  } catch (error) {
    return next(error);
  }
};
