const express = require('express');
const { z } = require('zod');
const validate = require('../middlewares/validate.middleware');
const auth = require('../middlewares/auth.middleware');
const { uploadImage } = require('../controllers/media.controller');

const router = express.Router();

router.use(auth);

const uploadSchema = z.object({
  body: z.object({
    image: z.string().min(1, 'image is required').startsWith('data:image', 'Must be a Base64 data URI')
  })
});

router.post('/upload', validate(uploadSchema), uploadImage);

module.exports = router;
