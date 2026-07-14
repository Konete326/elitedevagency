const Tenant = require('../models/Tenant');
const { getTenantConnection } = require('../utils/tenantConnection.util');

const tenantDbMiddleware = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!req.user || !req.user.tenantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No tenant context' });
    }

    const { tenantId } = req.user;

    const tenant = await Tenant.findById(tenantId).select('databaseURI isActive').lean();
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    if (!tenant.isActive) {
      return res.status(403).json({ success: false, error: 'Tenant account is inactive' });
    }

    req.tenantConnection = await getTenantConnection(tenant.databaseURI, tenantId);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = tenantDbMiddleware;
