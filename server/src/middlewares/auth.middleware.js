const jwt = require('jsonwebtoken');
const logger = require('../config/logger.config');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`JWT verification failed: ${error.message}`);
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

module.exports = auth;
