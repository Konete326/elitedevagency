const express = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const heartbeatController = require('../controllers/heartbeat.controller');

const router = express.Router();

const heartbeatSchema = z.object({
  query: z.object({
    deviceFingerprint: z.string().min(1, 'Device fingerprint is required')
  })
});

router.get('/', auth, validate(heartbeatSchema), heartbeatController.getHeartbeat);

module.exports = router;
