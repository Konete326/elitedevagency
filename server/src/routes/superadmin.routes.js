const express = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const superadmin = require('../middlewares/superadmin.middleware');
const superadminController = require('../controllers/superadmin.controller');

const router = express.Router();

router.use(auth);
router.use(superadmin);

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g. #FF5733)');

const onboardSchema = z.object({
  body: z.object({
    businessName: z.string().min(1, 'Business name is required'),
    niche: z.enum(['GYM', 'RESTAURANT', 'GARMENTS']),
    plan: z.string().min(1, 'Plan is required'),
    activeModules: z.array(z.string()).optional(),
    trialDays: z.number().int().nonnegative().optional(),
    ownerName: z.string().min(1, 'Owner name is required'),
    ownerEmail: z.string().email('Invalid owner email address'),
    ownerPassword: z.string().min(6, 'Owner password must be at least 6 characters'),
    dbURI: z.string().min(1, 'Database connection URI is required'),
    features: z.array(z.string()).optional(),
    customTheme: z.object({
      lightPrimary: hexColor.optional().nullable(),
      darkPrimary: hexColor.optional().nullable()
    }).optional(),
    blockMobileAccess: z.boolean().optional()
  })
});

const approveSchema = z.object({
  body: z.object({
    approve: z.boolean({ required_error: 'Approve status is required' })
  })
});

const listTenantsSchema = z.object({
  query: z.object({
    page: z.string().optional().refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    }, { message: 'Page must be a positive integer' }),
    limit: z.string().optional().refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    }, { message: 'Limit must be a positive integer' })
  })
});

const toggleLockSchema = z.object({
  params: z.object({
    tenantId: z.string().min(1, 'Tenant ID is required')
  })
});

const updateFeaturesSchema = z.object({
  params: z.object({
    tenantId: z.string().min(1, 'Tenant ID is required')
  }),
  body: z.object({
    features: z.array(z.string(), { required_error: 'Features are required' })
  })
});

const updateSuspensionSchema = z.object({
  params: z.object({
    tenantId: z.string().min(1, 'Tenant ID is required')
  }),
  body: z.object({
    isSuspended: z.boolean({ required_error: 'isSuspended must be a boolean' }),
    suspensionTitle: z.string().optional(),
    suspensionDescription: z.string().optional()
  })
});

const updateTenantSchema = z.object({
  params: z.object({
    tenantId: z.string().min(1, 'Tenant ID is required')
  }),
  body: z.object({
    businessName: z.string().min(1, 'Business name is required').optional(),
    niche: z.enum(['GYM', 'RESTAURANT', 'GARMENTS']).optional(),
    plan: z.string().min(1, 'Plan is required').optional(),
    trialDays: z.number().int().nonnegative().optional(),
    dbURI: z.string().min(1, 'Database connection URI is required').optional(),
    ownerName: z.string().optional(),
    ownerEmail: z.string().email('Invalid email format').optional(),
    ownerPassword: z.string().optional()
  })
});

const deleteTenantSchema = z.object({
  params: z.object({
    tenantId: z.string().min(1, 'Tenant ID is required')
  })
});

router.post('/tenants', validate(onboardSchema), superadminController.createTenant);
router.get('/tenants', validate(listTenantsSchema), superadminController.listTenants);
router.put('/tenants/:tenantId/toggle-lock', validate(toggleLockSchema), superadminController.toggleLock);
router.put('/tenants/:tenantId/toggle-mobile-access', validate(toggleLockSchema), superadminController.toggleMobileAccess);
router.put('/tenants/:tenantId/features', validate(updateFeaturesSchema), superadminController.updateTenantFeatures);
router.put('/tenants/:tenantId/suspension', validate(updateSuspensionSchema), superadminController.updateTenantSuspension);
router.put('/tenants/:tenantId', validate(updateTenantSchema), superadminController.updateTenant);
router.delete('/tenants/:tenantId', validate(deleteTenantSchema), superadminController.deleteTenant);
router.get('/devices', superadminController.listPendingDevices);
router.put('/devices/:deviceId/approve', validate(approveSchema), superadminController.approveFingerprint);
router.get('/diagnostics', superadminController.getDiagnostics);

module.exports = router;
