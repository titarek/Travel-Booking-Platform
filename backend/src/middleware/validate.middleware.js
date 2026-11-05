/**
 * Validation middleware using Zod schemas
 * Validates body, params, and/or query, rejecting invalid and unknown fields
 * @param {Object} schemas - { body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request body',
          errors: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL parameters',
          errors: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      req.params = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      req.query = result.data;
    }

    return next();
  } catch (err) {
    return next(err);
  }
};
