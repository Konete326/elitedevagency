const mongoose = require('mongoose');

const pricingTierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  tenantId: { type: String, required: true },
  isDeleted: { type: Boolean, default: false },
  features: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('PricingTier', pricingTierSchema);
