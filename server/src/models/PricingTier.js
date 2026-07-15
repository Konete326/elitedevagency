const mongoose = require('mongoose');

const pricingTierSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  tenantId: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  features: [{ type: String }]
}, { timestamps: true });

pricingTierSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('PricingTier', pricingTierSchema);
