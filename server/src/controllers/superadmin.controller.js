const superadminService = require('../services/superadmin.service');

const createTenant = async (req, res) => {
  const { businessName, niche, trialDays, ownerName, ownerEmail, plan, activeModules, customTheme } = req.body;
  const result = await superadminService.onboardTenant(
    businessName,
    niche,
    trialDays,
    ownerName,
    ownerEmail,
    plan,
    activeModules,
    customTheme
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

module.exports = {
  createTenant,
  listPendingDevices,
  approveFingerprint,
  listTenants,
  toggleLock
};
