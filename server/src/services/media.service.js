const cloudinary = require('../config/cloudinary');

const uploadBase64Image = async (base64String, folder = 'pos-products') => {
  if (!base64String || !base64String.startsWith('data:image')) {
    throw new Error('Invalid image payload — must be a Base64 data URI');
  }

  const result = await cloudinary.uploader.upload(base64String, {
    folder,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto'
  });

  return result.secure_url;
};

module.exports = { uploadBase64Image };
