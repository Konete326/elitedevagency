const Tenant = require('../models/Tenant');
const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  try {
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

module.exports = {
  onboardTenant,
  getPendingDevices,
  approveDevice,
  getTenants,
  toggleTenantLock,
  toggleMobileAccess,
  updateFeatures
};
