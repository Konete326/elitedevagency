const User = require('../models/User');
const Tenant = require('../models/Tenant');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (email, password, deviceFingerprint) => {
  if (
    process.env.SUPERADMIN_EMAIL &&
    process.env.SUPERADMIN_PASSWORD &&
    email === process.env.SUPERADMIN_EMAIL &&
    password === process.env.SUPERADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { id: 'superadmin_id', role: 'SUPER_ADMIN', tenantId: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
    return {
      token,
      user: {
        id: 'superadmin_id',
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        email: process.env.SUPERADMIN_EMAIL,
        tenantId: 'superadmin'
      },
      tenant: {
        _id: 'superadmin',
        name: 'Elite Super Admin',
        dbURI: 'main'
      }
    };
  }

  const user = await User.findOne({ email, isActive: true }).lean();
  if (!user) {
    const error = new Error('Invalid credentials or inactive user');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid credentials or inactive user');
    error.statusCode = 401;
    throw error;
  }

  if (user.role === 'SUPER_ADMIN') {
    const token = jwt.sign(
      { id: user._id, role: user.role, tenantId: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        tenantId: 'superadmin'
      },
      tenant: {
        _id: 'superadmin',
        name: 'Elite Super Admin',
        dbURI: 'main'
      }
    };
  }

  const tenant = await Tenant.findById(user.tenantId);
  if (!tenant || !tenant.isActive) {
    const error = new Error('Business account is inactive');
    error.statusCode = 403;
    throw error;
  }
  
  if (tenant.rentOverdue) {
    const error = new Error('Account suspended due to overdue rent');
    error.statusCode = 403;
    throw error;
  }

  const existingDeviceIndex = tenant.approvedDevices.findIndex(
    device => device.deviceId === deviceFingerprint
  );

  if (existingDeviceIndex === -1) {
    tenant.approvedDevices.push({
      deviceId: deviceFingerprint,
      deviceName: 'Desktop Client',
      status: 'PENDING'
    });
    await tenant.save();
    const error = new Error('Device not recognized or not approved by SuperAdmin');
    error.statusCode = 403;
    throw error;
  }

  const device = tenant.approvedDevices[existingDeviceIndex];
  if (device.status !== 'APPROVED') {
    const error = new Error('Device not recognized or not approved by SuperAdmin');
    error.statusCode = 403;
    throw error;
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );

  return { token, user: { id: user._id, name: user.name, role: user.role, email: user.email, tenantId: user.tenantId, niche: tenant.niche, customTheme: tenant.customTheme || null, blockMobileAccess: tenant.blockMobileAccess || false, features: tenant.features || [], isSuspended: tenant.isSuspended || false, suspensionTitle: tenant.suspensionTitle || "", suspensionDescription: tenant.suspensionDescription || "" } };
};

module.exports = { loginUser };
