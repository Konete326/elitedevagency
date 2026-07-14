const { z } = require('zod');
const logger = require('../config/logger.config');

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    return next();
  } catch (error) {
    logger.warn('Validation failed for incoming request');
    if (error.errors && Array.isArray(error.errors)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors.map(err => ({
          path: err.path?.join('.') ?? '',
          message: err.message
        }))
      });
    }
    return next(error);
  }
};

module.exports = validate;
