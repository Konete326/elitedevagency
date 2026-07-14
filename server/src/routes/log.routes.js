const express = require('express');
const auth = require('../middlewares/auth.middleware');
const superadmin = require('../middlewares/superadmin.middleware');
const logController = require('../controllers/log.controller');

const router = express.Router();

router.post('/logs/client', logController.createClientLog);

router.get('/superadmin/logs', auth, superadmin, logController.getSuperAdminLogs);
router.delete('/superadmin/logs/clear', auth, superadmin, logController.clearLogs);
router.delete('/superadmin/logs/:id', auth, superadmin, logController.deleteSingleLog);

router.get('/tenant/logs', auth, logController.getTenantLogs);

module.exports = router;
