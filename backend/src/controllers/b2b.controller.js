import crypto from 'crypto';
import mongoose from 'mongoose';
import { B2BPartner } from '../models/b2bPartner.model.js';
import { memoryStore } from '../utils/memoryStore.js';
import { notifyAdminClients } from '../utils/realtime.js';

/**
 * Generate a cryptographically secure B2B API Key
 */
const generateApiKey = (companyName = 'client') => {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  const randomHex = crypto.randomBytes(8).toString('hex');
  return `trav_live_b2b_${slug}_${randomHex}`;
};

/**
 * Middleware: Authenticate programmatic B2B requests via API Key
 */
export const authenticateB2BKey = async (req, res, next) => {
  try {
    const rawKey = req.headers['x-api-key']
      || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null)
      || req.query.apiKey;

    if (!rawKey) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED_B2B_ACCESS',
        message: 'Missing B2B API Key. Provide key via x-api-key header or Authorization: Bearer <key>',
      });
    }

    const b2bSettings = memoryStore.settings?.b2bSettings || { enabled: true };
    if (!b2bSettings.enabled) {
      return res.status(503).json({
        success: false,
        error: 'B2B_GATEWAY_MAINTENANCE',
        message: 'The B2B Wholesale API Gateway is currently offline for scheduled maintenance.',
      });
    }

    let partner = null;

    if (mongoose.connection.readyState === 1) {
      partner = await B2BPartner.findOne({ apiKey: rawKey });
      if (partner) {
        partner.totalRequests = (partner.totalRequests || 0) + 1;
        await partner.save();
      }
    } else {
      partner = (memoryStore.b2bPartners || []).find((p) => p.apiKey === rawKey);
      if (partner) {
        partner.totalRequests = (partner.totalRequests || 0) + 1;
      }
    }

    if (!partner) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_API_KEY',
        message: 'The provided B2B API Key is invalid or has been revoked.',
      });
    }

    if (partner.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'PARTNER_ACCOUNT_SUSPENDED',
        message: 'Your B2B integration partner account is currently suspended. Please contact platform administration.',
      });
    }

    req.b2bPartner = partner;
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Public B2B Endpoint: Get partner integration status & telemetry
 */
export const getB2BStatus = async (req, res) => {
  const partner = req.b2bPartner;
  return res.status(200).json({
    success: true,
    data: {
      partnerName: partner.name,
      contactEmail: partner.contactEmail,
      tier: partner.tier,
      wholesaleDiscountPercent: partner.commissionDiscount,
      rateLimitPerHour: partner.rateLimit,
      totalRequestsProcessed: partner.totalRequests,
      status: partner.status,
      apiVersion: memoryStore.settings?.b2bSettings?.publicApiVersion || 'v1.0.4',
      serverTime: new Date().toISOString(),
    },
  });
};

/**
 * Public B2B Endpoint: Search flights with partner wholesale discount
 */
export const searchFlightsB2B = async (req, res, next) => {
  try {
    const partner = req.b2bPartner;
    const { origin, destination } = req.query;
    const discount = Number(partner.commissionDiscount || 0);

    let flights = memoryStore.flights || [];
    if (origin) {
      flights = flights.filter((f) => (f.origin?.code || f.originCode || '').toUpperCase().includes(origin.toUpperCase()));
    }
    if (destination) {
      flights = flights.filter((f) => (f.destination?.code || f.destinationCode || '').toUpperCase().includes(destination.toUpperCase()));
    }

    const discountedFlights = flights.map((f) => {
      const retailPrice = Number(f.price || 350);
      const wholesalePrice = Math.round(retailPrice * (1 - discount / 100));
      return {
        id: f.id || f._id,
        flightNumber: f.flightNumber,
        airline: f.airline,
        origin: f.origin,
        destination: f.destination,
        departureTime: f.departureTime,
        arrivalTime: f.arrivalTime,
        duration: f.duration,
        stops: f.stops,
        retailPrice,
        wholesalePrice,
        currency: 'USD',
        partnerDiscountPercent: discount,
        availableSeats: f.availableSeats || 9,
      };
    });

    return res.status(200).json({
      success: true,
      partner: partner.name,
      count: discountedFlights.length,
      data: discountedFlights,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Public B2B Endpoint: Search hotels with partner wholesale discount
 */
export const searchHotelsB2B = async (req, res, next) => {
  try {
    const partner = req.b2bPartner;
    const { city } = req.query;
    const discount = Number(partner.commissionDiscount || 0);

    let hotels = memoryStore.hotels || [];
    if (city) {
      hotels = hotels.filter((h) => (h.location?.city || h.city || '').toLowerCase().includes(city.toLowerCase()));
    }

    const discountedHotels = hotels.map((h) => {
      const retailPrice = Number(h.pricePerNight || 120);
      const wholesalePrice = Math.round(retailPrice * (1 - discount / 100));
      return {
        id: h.id || h._id,
        name: h.name,
        city: h.location?.city || h.city,
        country: h.location?.country || h.country,
        rating: h.rating,
        retailPricePerNight: retailPrice,
        wholesalePricePerNight: wholesalePrice,
        currency: 'USD',
        partnerDiscountPercent: discount,
        amenities: h.amenities,
      };
    });

    return res.status(200).json({
      success: true,
      partner: partner.name,
      count: discountedHotels.length,
      data: discountedHotels,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Public B2B Endpoint: Create reservation programmatically
 */
export const createBookingB2B = async (req, res, next) => {
  try {
    const partner = req.b2bPartner;
    const {
      serviceType,
      itemId,
      travelers,
      customerEmail,
      customerPhone,
      retailPrice,
    } = req.body;

    if (!travelers || !travelers.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one passenger / guest is required for programmatic booking.',
      });
    }

    const discount = Number(partner.commissionDiscount || 0);
    const baseRetail = Number(retailPrice || 300);
    const wholesaleNet = Math.round(baseRetail * (1 - discount / 100));

    const pnr = `B2B-${Math.floor(100000 + Math.random() * 900000)}`;
    const booking = {
      _id: `bk-b2b-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      bookingReference: pnr,
      type: serviceType || 'flight',
      source: 'B2B_PARTNER_API',
      partnerName: partner.name,
      partnerId: partner.id || partner._id,
      itemDetails: { itemId, serviceType },
      travelers,
      contactInfo: { email: customerEmail, phone: customerPhone },
      totalPrice: wholesaleNet,
      retailPrice: baseRetail,
      currency: 'USD',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      payment: {
        method: 'B2B Wholesale Account Billing',
        transactionId: `TXN-B2B-${Date.now()}`,
        status: 'PAID',
        paidAt: new Date().toISOString(),
      },
      createdAt: new Date(),
    };

    partner.totalRevenue = (partner.totalRevenue || 0) + wholesaleNet;
    memoryStore.bookings.unshift(booking);
    notifyAdminClients('booking_created', booking);

    return res.status(201).json({
      success: true,
      message: 'B2B programmatic booking successfully confirmed.',
      data: {
        bookingReference: pnr,
        partner: partner.name,
        serviceType: booking.type,
        status: booking.status,
        wholesaleNetPaid: wholesaleNet,
        retailListedPrice: baseRetail,
        savings: baseRetail - wholesaleNet,
        eTicketUrl: `/api/bookings/${booking._id}`,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * ADMIN: Get all B2B partners and wholesale settings
 */
export const getAdminB2BPartners = async (req, res, next) => {
  try {
    let partners = [];
    if (mongoose.connection.readyState === 1) {
      partners = await B2BPartner.find().sort({ createdAt: -1 });
    } else {
      partners = memoryStore.b2bPartners || [];
    }

    const settings = memoryStore.settings?.b2bSettings || {
      enabled: true,
      defaultDiscount: 8.5,
      publicApiVersion: 'v1.0.4',
      sandboxMode: false,
    };

    return res.status(200).json({
      success: true,
      data: {
        partners,
        settings,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * ADMIN: Register new B2B Partner & Issue Live API Key
 */
export const createAdminB2BPartner = async (req, res, next) => {
  try {
    const {
      name,
      contactEmail,
      tier = 'GROWTH',
      commissionDiscount = 8.5,
      rateLimit = 5000,
      webhookUrl = '',
    } = req.body;

    if (!name || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Partner company name and contact email are required.',
      });
    }

    const apiKey = generateApiKey(name);

    if (mongoose.connection.readyState === 1) {
      const partner = await B2BPartner.create({
        name,
        contactEmail,
        apiKey,
        tier,
        commissionDiscount: Number(commissionDiscount),
        rateLimit: Number(rateLimit),
        status: 'ACTIVE',
        webhookUrl,
      });

      return res.status(201).json({
        success: true,
        message: 'B2B Partner created successfully and API Key generated.',
        data: partner,
      });
    }

    const partner = {
      _id: `b2b-${Date.now()}`,
      id: `b2b-${Date.now()}`,
      name,
      contactEmail,
      apiKey,
      tier,
      commissionDiscount: Number(commissionDiscount),
      rateLimit: Number(rateLimit),
      totalRequests: 0,
      totalRevenue: 0,
      status: 'ACTIVE',
      webhookUrl,
      createdAt: new Date(),
    };

    if (!memoryStore.b2bPartners) {
      memoryStore.b2bPartners = [];
    }
    memoryStore.b2bPartners.unshift(partner);

    return res.status(201).json({
      success: true,
      message: 'B2B Partner created successfully and API Key generated.',
      data: partner,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * ADMIN: Update B2B Partner (Tier, discount, rate limit, status)
 */
export const updateAdminB2BPartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      tier,
      commissionDiscount,
      rateLimit,
      status,
      webhookUrl,
    } = req.body;

    if (mongoose.connection.readyState === 1) {
      const partner = await B2BPartner.findById(id);
      if (!partner) {
        return res.status(404).json({ success: false, message: 'B2B Partner not found.' });
      }

      if (tier !== undefined) partner.tier = tier;
      if (commissionDiscount !== undefined) partner.commissionDiscount = Number(commissionDiscount);
      if (rateLimit !== undefined) partner.rateLimit = Number(rateLimit);
      if (status !== undefined) partner.status = status;
      if (webhookUrl !== undefined) partner.webhookUrl = webhookUrl;

      await partner.save();
      return res.status(200).json({ success: true, message: 'B2B Partner updated.', data: partner });
    }

    const partner = (memoryStore.b2bPartners || []).find(
      (p) => (p.id || p._id || '').toString() === id.toString(),
    );
    if (!partner) {
      return res.status(404).json({ success: false, message: 'B2B Partner not found.' });
    }

    if (tier !== undefined) partner.tier = tier;
    if (commissionDiscount !== undefined) partner.commissionDiscount = Number(commissionDiscount);
    if (rateLimit !== undefined) partner.rateLimit = Number(rateLimit);
    if (status !== undefined) partner.status = status;
    if (webhookUrl !== undefined) partner.webhookUrl = webhookUrl;

    return res.status(200).json({ success: true, message: 'B2B Partner updated.', data: partner });
  } catch (err) {
    return next(err);
  }
};

/**
 * ADMIN: Regenerate API Key for B2B Partner
 */
export const regenerateAdminB2BKey = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const partner = await B2BPartner.findById(id);
      if (!partner) {
        return res.status(404).json({ success: false, message: 'B2B Partner not found.' });
      }
      partner.apiKey = generateApiKey(partner.name);
      await partner.save();
      return res.status(200).json({
        success: true,
        message: 'API Key regenerated successfully.',
        data: partner,
      });
    }

    const partner = (memoryStore.b2bPartners || []).find(
      (p) => (p.id || p._id || '').toString() === id.toString(),
    );
    if (!partner) {
      return res.status(404).json({ success: false, message: 'B2B Partner not found.' });
    }

    partner.apiKey = generateApiKey(partner.name);
    return res.status(200).json({
      success: true,
      message: 'API Key regenerated successfully.',
      data: partner,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * ADMIN: Delete / Revoke B2B Partner
 */
export const deleteAdminB2BPartner = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      await B2BPartner.findByIdAndDelete(id);
      return res.status(200).json({ success: true, message: 'B2B Partner revoked.' });
    }

    memoryStore.b2bPartners = (memoryStore.b2bPartners || []).filter(
      (p) => (p.id || p._id || '').toString() !== id.toString(),
    );

    return res.status(200).json({ success: true, message: 'B2B Partner revoked.' });
  } catch (err) {
    return next(err);
  }
};

/**
 * ADMIN: Update B2B Global Wholesale Settings
 */
export const updateAdminB2BSettings = async (req, res) => {
  const { enabled, defaultDiscount, sandboxMode } = req.body;

  if (!memoryStore.settings) memoryStore.settings = {};
  if (!memoryStore.settings.b2bSettings) {
    memoryStore.settings.b2bSettings = {
      enabled: true,
      defaultDiscount: 8.5,
      publicApiVersion: 'v1.0.4',
      sandboxMode: false,
    };
  }

  if (enabled !== undefined) memoryStore.settings.b2bSettings.enabled = Boolean(enabled);
  if (defaultDiscount !== undefined) memoryStore.settings.b2bSettings.defaultDiscount = Number(defaultDiscount);
  if (sandboxMode !== undefined) memoryStore.settings.b2bSettings.sandboxMode = Boolean(sandboxMode);

  return res.status(200).json({
    success: true,
    message: 'Global B2B wholesale settings updated.',
    data: memoryStore.settings.b2bSettings,
  });
};
