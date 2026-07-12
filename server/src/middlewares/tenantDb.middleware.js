const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Table = require('../models/Table');
const Deal = require('../models/Deal');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Trainer = require('../models/Trainer');
const TrainerLedger = require('../models/TrainerLedger');
const Measurement = require('../models/Measurement');
const Customer = require('../models/Customer');
const CashShift = require('../models/CashShift');
const PricingTier = require('../models/PricingTier');

const connectionCache = {};

const tenantDbMiddleware = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

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
      conn.model('Category', Category.schema);
      conn.model('Table', Table.schema);
      conn.model('Deal', Deal.schema);
      conn.model('Plan', Plan.schema);
      conn.model('Member', Member.schema);
      conn.model('Payment', Payment.schema);
      conn.model('Trainer', Trainer.schema);
      conn.model('TrainerLedger', TrainerLedger.schema);
      conn.model('Measurement', Measurement.schema);
      conn.model('Customer', Customer.schema);
      conn.model('CashShift', CashShift.schema);
      conn.model('PricingTier', PricingTier.schema);

      connectionCache[tenantId] = conn;
    }

    req.tenantConnection = connectionCache[tenantId];
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = tenantDbMiddleware;
