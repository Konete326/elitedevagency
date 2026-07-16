const express = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const tenantDbMiddleware = require('../middlewares/tenantDb.middleware');
const tableOrderController = require('../controllers/tableOrder.controller');

const router = express.Router();

const initializeSessionSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1),
    tableId: z.string().min(1),
    customerName: z.string().min(1)
  })
});

const appendItemsSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1),
    sessionId: z.string().min(1),
    items: z.array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        price: z.number().positive(),
        quantity: z.number().int().positive()
      })
    )
  })
});

const submitPaymentSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1),
    sessionId: z.string().min(1),
    method: z.string().min(1),
    accountName: z.string().optional(),
    accountNumber: z.string().min(1),
    amount: z.number().positive()
  })
});

const feedbackSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1),
    sessionId: z.string().min(1),
    feedbackScore: z.number().min(1).max(10),
    comments: z.string().optional()
  })
});

const confirmPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1)
  })
});

const dismissPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().min(1)
  })
});

router.get('/menu/:tenantId', tableOrderController.getPublicMenu);
router.get('/tenant-settings/:tenantId', tableOrderController.getPublicTenantSettings);
router.post('/session', validate(initializeSessionSchema), tableOrderController.initializeSession);
router.post('/append', validate(appendItemsSchema), tableOrderController.appendSessionItems);
router.post('/pay', validate(submitPaymentSchema), tableOrderController.submitPayment);
router.get('/session-status/:tenantId/:sessionId', tableOrderController.getSessionStatus);
router.post('/feedback', validate(feedbackSchema), tableOrderController.submitFeedback);

router.use(auth);
router.use(tenantDbMiddleware);

router.get('/pending-payments', tableOrderController.getPendingPayments);
router.post('/confirm-payment', validate(confirmPaymentSchema), tableOrderController.confirmPayment);
router.post('/dismiss-payment', validate(dismissPaymentSchema), tableOrderController.dismissPayment);

module.exports = router;
