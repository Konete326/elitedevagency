const express = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const tenantDbMiddleware = require('../middlewares/tenantDb.middleware');
const syncController = require('../controllers/sync.controller');

const router = express.Router();

router.use(auth);
router.use(tenantDbMiddleware);

const pushSchema = z.object({
  body: z.object({
    collection: z.enum(['products', 'orders', 'categories', 'tables', 'deals']),
    changeRows: z.array(
      z.object({
        newDocumentState: z.object({
          _id: z.string(),
          updatedAt: z.string()
        }).catchall(z.any()),
        assumedMasterState: z.object({
          _id: z.string(),
          updatedAt: z.string()
        }).catchall(z.any()).optional()
      })
    )
  })
});

const pullSchema = z.object({
  query: z.object({
    collection: z.enum(['products', 'orders', 'categories', 'tables', 'deals']),
    checkpoint: z.string().optional().refine((val) => {
      if (!val) return true;
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    }, { message: 'Checkpoint must be a valid JSON string' }),
    limit: z.string().optional().refine((val) => {
      if (!val) return true;
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    }, { message: 'Limit must be a positive integer' })
  })
});

router.post('/push', validate(pushSchema), syncController.push);
router.get('/pull', validate(pullSchema), syncController.pull);

module.exports = router;
