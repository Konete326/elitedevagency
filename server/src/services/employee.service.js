const TenantIdentity = require('../models/TenantIdentity');
const bcrypt = require('bcryptjs');

const createEmployee = async (tenantConnection, tenantId, data) => {
  const UserModel = tenantConnection.model('User');

  const existingUser = await UserModel.findOne({ email: data.email.toLowerCase().trim() }).lean();
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newEmployee = new UserModel({
    tenantId,
    name: data.name,
    email: data.email.toLowerCase().trim(),
    password: hashedPassword,
    role: data.role || 'CASHIER',
    permissions: data.permissions || [],
    dataVisibility: data.dataVisibility || 'ALL',
    isActive: true
  });

  await newEmployee.save();

  await TenantIdentity.create({
    email: data.email.toLowerCase().trim(),
    tenantId,
    role: newEmployee.role
  });

  return {
    id: newEmployee._id,
    name: newEmployee.name,
    email: newEmployee.email,
    role: newEmployee.role,
    permissions: newEmployee.permissions,
    dataVisibility: newEmployee.dataVisibility,
    isActive: newEmployee.isActive
  };
};

const getEmployees = async (tenantConnection, tenantId) => {
  const UserModel = tenantConnection.model('User');
  return UserModel.find({ tenantId, role: { $ne: 'SUPER_ADMIN' } })
    .select('-password')
    .lean();
};

const updateEmployee = async (tenantConnection, tenantId, id, data) => {
  const UserModel = tenantConnection.model('User');
  const employee = await UserModel.findOne({ _id: id, tenantId });
  if (!employee) {
    throw new Error('Employee not found');
  }

  if (data.role) employee.role = data.role;
  if (data.permissions) employee.permissions = data.permissions;
  if (data.dataVisibility) employee.dataVisibility = data.dataVisibility;
  if (typeof data.isActive === 'boolean') employee.isActive = data.isActive;

  await employee.save();

  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    permissions: employee.permissions,
    dataVisibility: employee.dataVisibility,
    isActive: employee.isActive
  };
};

module.exports = {
  createEmployee,
  getEmployees,
  updateEmployee
};
