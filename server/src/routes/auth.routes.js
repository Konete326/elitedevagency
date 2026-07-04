const express = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    deviceFingerprint: z.string().min(1, "Device fingerprint is required")
  })
});

router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
