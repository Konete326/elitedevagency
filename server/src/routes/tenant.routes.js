const express = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const tenantController = require('../controllers/tenant.controller');

const router = express.Router();

const updateSettingsSchema = z.object({
  body: z.object({
    easyPaisaName: z.string().optional(),
    easyPaisaNumber: z.string().optional(),
    jazzCashName: z.string().optional(),
    jazzCashNumber: z.string().optional(),
    bankName: z.string().optional(),
    bankIban: z.string().optional()
  })
});

router.use(auth);

router.get('/settings', tenantController.getTenantSettings);
router.put('/settings', validate(updateSettingsSchema), tenantController.updateTenantSettings);

module.exports = router;
