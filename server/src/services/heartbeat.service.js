const Tenant = require('../models/Tenant');

const checkHeartbeat = async (tenantId, deviceFingerprint) => {
  const tenant = await Tenant.findById(tenantId).lean();
  
  if (!tenant) {
    return { status: 'locked', reason: 'Tenant not found' };
  }
  
  if (!tenant.isActive) {
    return { status: 'locked', reason: 'Business account is inactive' };
  }
  
  if (tenant.rentOverdue) {
    return { status: 'locked', reason: 'Account suspended due to overdue rent' };
  }
  
  const isApproved = tenant.approvedDevices.some(
    device => device.deviceId === deviceFingerprint
  );
  
  if (!isApproved) {
    return { status: 'locked', reason: 'This hardware device is not approved' };
  }
  
  return { status: 'active', blockMobileAccess: tenant.blockMobileAccess || false, features: tenant.features || [], isSuspended: tenant.isSuspended || false, suspensionTitle: tenant.suspensionTitle || "", suspensionDescription: tenant.suspensionDescription || "" };
};

module.exports = {
  checkHeartbeat
};
