import mongoose from 'mongoose';
import { Package } from '../models/package.model.js';
import { memoryStore } from '../utils/memoryStore.js';

/**
 * Get tour/holiday packages with filtering
 */
export const getPackages = async (req, res, next) => {
  try {
    const { destination, category, maxPrice, featured, sort } = req.query;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const filter = {};
      if (destination) filter.destination = new RegExp(destination.trim(), 'i');
      if (category && category !== 'All') filter.category = category;
      if (maxPrice) filter.price = { $lte: Number(maxPrice) };
      if (featured === 'true') filter.featured = true;

      let query = Package.find(filter);
      if (sort === 'price_asc') query = query.sort({ price: 1 });
      else if (sort === 'price_desc') query = query.sort({ price: -1 });
      else if (sort === 'duration') query = query.sort({ durationDays: 1 });
      else query = query.sort({ featured: -1, price: 1 });

      let results = await query.exec();
      if (results.length === 0) {
        results = await Package.find().sort({ featured: -1 }).limit(6);
      }

      return res.status(200).json({ success: true, count: results.length, data: results });
    }

    // Memory fallback
    let list = [...memoryStore.packages];
    if (destination) list = list.filter((p) => p.destination.toLowerCase().includes(destination.toLowerCase()));
    if (category && category !== 'All') list = list.filter((p) => p.category === category);
    if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
    if (featured === 'true') list = list.filter((p) => p.featured);

    if (list.length === 0) list = [...memoryStore.packages];

    if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get featured packages for homepage
 */
export const getFeaturedPackages = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const packages = await Package.find({ featured: true }).limit(6);
      return res.status(200).json({
        success: true,
        data: packages.length > 0 ? packages : await Package.find().limit(6),
      });
    }

    const featured = memoryStore.packages.filter((p) => p.featured);
    return res.status(200).json({
      success: true,
      data: featured.length > 0 ? featured : memoryStore.packages.slice(0, 6),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single package by ID
 */
export const getPackageById = async (req, res, next) => {
  try {
    let pkg;
    if (mongoose.connection.readyState === 1) {
      pkg = await Package.findById(req.params.id);
    } else {
      pkg = memoryStore.packages.find((p) => p._id.toString() === req.params.id);
    }

    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Tour package not found.' });
    }

    return res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    return next(error);
  }
};
