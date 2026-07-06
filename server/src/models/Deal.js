const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  imageSynced: { type: Boolean, default: false },
  items: [{
    productId: { type: String, required: true },
    variantSku: { type: String },
    quantity: { type: Number, required: true },
    name: { type: String }
  }],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

dealSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Deal', dealSchema);
