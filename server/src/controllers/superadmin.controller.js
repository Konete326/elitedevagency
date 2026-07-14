const superadminService = require('../services/superadmin.service');

const createTenant = async (req, res) => {
  const { 
    businessName, 
    niche, 
    trialDays, 
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
    blockMobileAccess
  } = req.body;

  const result = await superadminService.onboardTenant(
    businessName,
    niche,
    trialDays,
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
    blockMobileAccess
  );
  
  res.status(201).json({
    success: true,
    data: result.tenant,
    credentials: result.credentials
  });
};

const listPendingDevices = async (req, res) => {
  const devices = await superadminService.getPendingDevices();
  
  res.status(200).json({
    success: true,
    data: devices
  });
};

const approveFingerprint = async (req, res) => {
  const { deviceId } = req.params;
  const { approve } = req.body;
  
  await superadminService.approveDevice(deviceId, approve);
  
  res.status(200).json({
    success: true
  });
};

const listTenants = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  const { tenants, total } = await superadminService.getTenants(page, limit);
  
  res.status(200).json({
    success: true,
    data: tenants,
    meta: { page, limit, total }
  });
};

const toggleLock = async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await superadminService.toggleTenantLock(tenantId);
  
  res.status(200).json({
    success: true,
    data: tenant
  });
};

const toggleMobileAccess = async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await superadminService.toggleMobileAccess(tenantId);
  
  res.status(200).json({
    success: true,
    data: tenant
  });
};

const updateTenantFeatures = async (req, res) => {
  const { tenantId } = req.params;
  const { features } = req.body;
  const tenant = await superadminService.updateFeatures(tenantId, features);
  
  res.status(200).json({
    success: true,
    data: tenant
  });
};

const getDiagnostics = async (req, res) => {
  const data = await superadminService.getDiagnostics();
  res.status(200).json({
    success: true,
    data
  });
};

const updateTenantSuspension = async (req, res) => {
  const { tenantId } = req.params;
  const { isSuspended, suspensionTitle, suspensionDescription } = req.body;
  const tenant = await superadminService.updateSuspension(tenantId, isSuspended, suspensionTitle, suspensionDescription);
  
  res.status(200).json({
    success: true,
    data: tenant
  });
};

const updateTenant = async (req, res) => {
  const { tenantId } = req.params;
  const updateData = req.body;
  const tenant = await superadminService.updateTenant(tenantId, updateData);
  
  res.status(200).json({
    success: true,
    data: tenant
  });
};

const deleteTenant = async (req, res) => {
  const { tenantId } = req.params;
  await superadminService.deleteTenant(tenantId);
  
  res.status(200).json({
    success: true,
    message: 'Tenant deleted successfully'
  });
};

const testConnection = async (req, res) => {
  const { dbUri } = req.body;
  if (!dbUri) {
    return res.status(400).json({ success: false, message: 'Database connection URI is required.' });
  }
  const mongoose = require('mongoose');
  try {
    const testConn = await mongoose.createConnection(dbUri, { serverSelectionTimeoutMS: 4000 });
    await testConn.asPromise();
    await testConn.close();
    res.status(200).json({ success: true, message: 'Connection established successfully.' });
  } catch {
    res.status(200).json({ success: false, message: 'Connection failed. Verify network access, IP whitelisting, or URI format.' });
  }
};

module.exports = {
  createTenant,
  listPendingDevices,
  approveFingerprint,
  listTenants,
  toggleLock,
  toggleMobileAccess,
  updateTenantFeatures,
  getDiagnostics,
  updateTenantSuspension,
  updateTenant,
  deleteTenant,
  testConnection
};
