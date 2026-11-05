import { Router } from 'express';
import { z } from 'zod';
import { getPackages, getFeaturedPackages, getPackageById } from '../controllers/package.controller.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();

const getPackagesSchema = {
  query: z.object({
    destination: z.string().max(50).optional(),
    category: z.string().optional(),
    maxPrice: z.string().optional(),
    featured: z.string().optional(),
    sort: z.string().optional(),
  }).strict(),
};

const packageIdSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid package ID format'),
  }).strict(),
};

router.get('/', validate(getPackagesSchema), getPackages);
router.get('/featured', getFeaturedPackages);
router.get('/:id', validate(packageIdSchema), getPackageById);

export default router;
