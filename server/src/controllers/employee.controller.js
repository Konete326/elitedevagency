const employeeService = require('../services/employee.service');

const createEmployee = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context required' });
    }

    const employee = await employeeService.createEmployee(tenantId, req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context required' });
    }

    const employees = await employeeService.getEmployees(tenantId);
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant context required' });
    }

    const employee = await employeeService.updateEmployee(id, tenantId, req.body);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  updateEmployee
};
