const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const Order = require('../models/Order');

const connectionCache = {};

const tenantDbMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.tenantId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No tenant context' });
    }

    const { tenantId } = req.user;

    if (!connectionCache[tenantId]) {
      const tenant = await Tenant.findById(tenantId).lean();
      if (!tenant) {
        return res.status(404).json({ success: false, error: 'Tenant not found' });
      }
      if (!tenant.isActive) {
        return res.status(403).json({ success: false, error: 'Tenant account is inactive' });
      }

      const conn = mongoose.createConnection(tenant.databaseURI);
      
      await conn.asPromise();

      conn.model('Product', Product.schema);
      conn.model('Order', Order.schema);

      connectionCache[tenantId] = conn;
    }

    req.tenantConnection = connectionCache[tenantId];
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = tenantDbMiddleware;
