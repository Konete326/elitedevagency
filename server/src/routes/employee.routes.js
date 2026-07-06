const express = require('express');
const auth = require('../middlewares/auth.middleware');
const employeeController = require('../controllers/employee.controller');

const router = express.Router();

const authorizeOwnerOrManager = (req, res, next) => {
  if (!req.user || (req.user.role !== 'OWNER' && req.user.role !== 'MANAGER')) {
    return res.status(403).json({ success: false, error: 'Forbidden: Owner or Manager access required' });
  }
  next();
};

router.use(auth);
router.use(authorizeOwnerOrManager);

router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getEmployees);
router.patch('/:id', employeeController.updateEmployee);

module.exports = router;
