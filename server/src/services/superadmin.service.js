const Tenant = require('../models/Tenant');
const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger.config');
const SyncLog = require('../models/SyncLog');
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

const onboardTenant = async (
  businessName,
  niche,
  trialDays = 30,
  ownerName,
  ownerEmail,
  ownerPassword,
  plan,
  activeModules,
  customTheme,
  dbURI,
  features,
  customPlanName,
  customPlanPrice,
  blockMobileAccess = false
) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + trialDays);

  let finalModules = activeModules;
  if (!finalModules || finalModules.length === 0) {
    if (plan === 'STARTER') {
      finalModules = ['POS'];
    } else if (plan === 'GROWTH') {
      finalModules = ['POS', 'INVENTORY', 'ANALYTICS'];
    } else if (plan === 'PRO') {
      finalModules = ['POS', 'INVENTORY', 'ANALYTICS', 'FINANCIALS', 'HR', 'PROMOTIONS'];
    } else {
      finalModules = ['POS'];
    }
  }

  const tenant = new Tenant({
    businessName,
    niche,
    plan,
    activeModules: finalModules,
    databaseURI: dbURI,
    dbURI,
    features: features || [],
    customPlanName: plan === 'CUSTOM' ? customPlanName : undefined,
    customPlanPrice: plan === 'CUSTOM' ? customPlanPrice : undefined,
    subscriptionExpiry: expiryDate,
    customTheme: customTheme || { lightPrimary: null, darkPrimary: null },
    blockMobileAccess
  });
  
  await tenant.save();

  const hashedPassword = await bcrypt.hash(ownerPassword, 10);

  const tenantConnection = mongoose.createConnection(tenant.databaseURI);
  tenantConnection.on('error', (err) => {
    logger.error(`Tenant database connection error: ${err.message}`);
  });

  try {
    await Promise.race([
      tenantConnection.asPromise(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection to tenant database timed out')), 5000))
    ]);

    const TenantUserModel = tenantConnection.model('User', User.schema);
    const newOwner = new TenantUserModel({
      tenantId: tenant._id,
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: 'OWNER',
      isActive: true
    });
    await newOwner.save();
  } catch (err) {
    await Tenant.deleteOne({ _id: tenant._id });
    const initError = new Error(`Failed to initialize tenant database: ${err.message}`);
    initError.statusCode = 500;
    throw initError;
  } finally {
    await tenantConnection.close();
  }

  return {
    tenant,
    credentials: {
      email: ownerEmail,
      password: ownerPassword
    }
  };
};

const getPendingDevices = async () => {
  const tenants = await Tenant.find({ 'approvedDevices.status': 'PENDING' }).lean();
  const pending = [];

  for (const t of tenants) {
    for (const d of t.approvedDevices) {
      if (d.status === 'PENDING') {
        pending.push({
          tenantId: t._id,
          businessName: t.businessName,
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          addedAt: d.addedAt
        });
      }
    }
  }

  return pending;
};

const approveDevice = async (deviceId, approve) => {
  const tenant = await Tenant.findOne({ 'approvedDevices.deviceId': deviceId });
  if (!tenant) {
    throw new Error('Device not found');
  }

  const device = tenant.approvedDevices.find(d => d.deviceId === deviceId);
  
  if (approve) {
    device.status = 'APPROVED';
  } else {
    tenant.approvedDevices = tenant.approvedDevices.filter(d => d.deviceId !== deviceId);
  }

  await tenant.save();
  return { success: true };
};

const getTenants = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const tenants = await Tenant.find({})
    .select('-approvedDevices -__v')
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await Tenant.countDocuments({});
  return { tenants, total };
};

const toggleTenantLock = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  tenant.rentOverdue = !tenant.rentOverdue;
  await tenant.save();
  return tenant;
};

const toggleMobileAccess = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  tenant.blockMobileAccess = !tenant.blockMobileAccess;
  await tenant.save();
  return tenant;
};

const updateFeatures = async (tenantId, features) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  tenant.features = features;
  await tenant.save();
  return tenant;
};

const getDiagnostics = async () => {
  const tenants = await Tenant.find({}).lean();
  const diagnostics = [];

  const modelsList = ['Product', 'Order', 'Category', 'Table', 'Deal', 'Plan', 'Member', 'Payment', 'Trainer', 'TrainerLedger', 'Measurement', 'Customer', 'CashShift'];
  const schemas = {
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
    CashShift: CashShift.schema
  };

  for (const tenant of tenants) {
    let dbStatus = 'Disconnected';
    let totalSynced = 0;

    try {
      const conn = mongoose.createConnection(tenant.databaseURI);
      await Promise.race([
        conn.asPromise(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      
      dbStatus = conn.readyState === 1 ? 'Connected' : 'Unreachable';
      
      if (dbStatus === 'Connected') {
        for (const m of modelsList) {
          const model = conn.model(m, schemas[m]);
          const count = await model.countDocuments({ tenantId: tenant._id });
          totalSynced += count;
        }
      }
      await conn.close();
    } catch (err) {
      dbStatus = 'Unreachable';
    }

    const latestLog = await SyncLog.findOne({ tenantId: tenant._id })
      .sort({ createdAt: -1 })
      .lean();

    diagnostics.push({
      tenantId: tenant._id,
      businessName: tenant.businessName,
      dbStatus,
      totalSynced,
      latestLog: latestLog ? {
        timestamp: latestLog.timestamp,
        bytesTransferred: latestLog.bytesTransferred,
        durationMs: latestLog.durationMs,
        status: latestLog.status
      } : null,
      dbURI: tenant.dbURI || tenant.databaseURI
    });
  }

  return diagnostics;
};

const updateSuspension = async (tenantId, isSuspended, suspensionTitle, suspensionDescription) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  tenant.isSuspended = isSuspended;
  tenant.suspensionTitle = suspensionTitle || "";
  tenant.suspensionDescription = suspensionDescription || "";
  await tenant.save();
  return tenant;
};

module.exports = {
  onboardTenant,
  getPendingDevices,
  approveDevice,
  getTenants,
  toggleTenantLock,
  toggleMobileAccess,
  updateFeatures,
  getDiagnostics,
  updateSuspension
};
