const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  sku: { type: String },
  stock: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  image: { type: String },
  imageSynced: { type: Boolean },
  categoryId: { type: String },
  costPrice: { type: Number },
  alertLevel: { type: Number, default: 0 },
  promotionalDiscount: {
    rate: { type: Number },
    price: { type: Number },
    label: { type: String }
  },
  variants: [{
    size: { type: String },
    color: { type: String },
    sku: { type: String },
    barcode: { type: String },
    stock: { type: Number, default: 0 }
  }],
  addons: [{
    name: { type: String },
    price: { type: Number }
  }],
  hasSpiceLevel: { type: Boolean, default: false }
}, {
  timestamps: true
});

productSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

const extractPublicId = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  let remaining = parts[1];
  const versionMatch = remaining.match(/^v\d+\/(.+)$/);
  if (versionMatch) {
    remaining = versionMatch[1];
  }
  const dotIndex = remaining.lastIndexOf('.');
  if (dotIndex !== -1) {
    remaining = remaining.substring(0, dotIndex);
  }
  return remaining;
};

const deleteCloudinaryImage = async (image) => {
  if (!image || !image.includes('res.cloudinary.com')) return;
  const publicId = extractPublicId(image);
  if (publicId) {
    try {
      const cloudinary = require('../config/cloudinary');
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
    }
  }
};

productSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update && (update.isDeleted === true || update.isDeleted === 'true')) {
    const doc = await this.model.findOne(this.getQuery()).lean();
    if (doc && doc.image) {
      await deleteCloudinaryImage(doc.image);
    }
  }
  next();
});

productSchema.pre('deleteOne', { document: true, query: true }, async function(next) {
  const doc = this.getQuery ? await this.model.findOne(this.getQuery()).lean() : this;
  if (doc && doc.image) {
    await deleteCloudinaryImage(doc.image);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
