const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createEmployee = async (tenantId, data) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const newEmployee = new User({
    tenantId,
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: data.role || 'CASHIER',
    permissions: data.permissions || [],
    dataVisibility: data.dataVisibility || 'ALL',
    isActive: true
  });

  await newEmployee.save();
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

const getEmployees = async (tenantId) => {
  return User.find({ tenantId, role: { $ne: 'SUPER_ADMIN' } })
    .select('-password')
    .lean();
};

const updateEmployee = async (id, tenantId, data) => {
  const employee = await User.findOne({ _id: id, tenantId });
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
