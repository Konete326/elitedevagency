const { uploadBase64Image } = require('../services/media.service');

const uploadImage = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, message: 'image field is required' });
  }

  const secureUrl = await uploadBase64Image(image);

  res.status(200).json({ success: true, data: { url: secureUrl } });
};

module.exports = { uploadImage };
