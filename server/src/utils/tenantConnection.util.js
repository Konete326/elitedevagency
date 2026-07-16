const mongoose = require('mongoose');
const logger = require('../config/logger.config');
const User = require('../models/User');
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
const TableSession = require('../models/TableSession');
const RestaurantPayment = require('../models/RestaurantPayment');

const TENANT_SCHEMAS = {
  User: User.schema,
  Product: Product.schema,
  Order: Order.schema,
  Category: Category.schema,
  Table: Table.schema,
  Deal: Deal.schema,
  Plan: Plan.schema,
  Member: Member.schema,
  Payment: Payment.schema,
  Trainer: Trainer.schema,
  TrainerLedger: TrainerLedger.schema,
  Measurement: Measurement.schema,
  Customer: Customer.schema,
  CashShift: CashShift.schema,
  PricingTier: PricingTier.schema,
  TableSession: TableSession.schema,
  RestaurantPayment: RestaurantPayment.schema
};

const connectionCache = {};

const getTenantConnection = async (databaseURI, tenantId) => {
  const cacheKey = tenantId.toString();
  const cached = connectionCache[cacheKey];

  if (cached && cached.readyState === 1) {
    return cached;
  }

  const conn = mongoose.createConnection(databaseURI);

  conn.on('error', (err) => {
    logger.error(`Tenant cluster error [${cacheKey}]: ${err.message}`);
    delete connectionCache[cacheKey];
  });

  const connPromise = conn.asPromise();
  connPromise.catch(() => {});

  await Promise.race([
    connPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tenant database connection timed out')), 10000)
    )
  ]);

  for (const [name, schema] of Object.entries(TENANT_SCHEMAS)) {
    conn.model(name, schema);
  }

  connectionCache[cacheKey] = conn;
  return conn;
};

module.exports = { getTenantConnection };
