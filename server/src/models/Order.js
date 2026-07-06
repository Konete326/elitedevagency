const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    returnedQty: { type: Number, default: 0 },
    returnReason: { type: String },
    variantSku: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  paymentMode: { type: String, required: true },
  returnStatus: { type: String, enum: ['NONE', 'PARTIAL', 'FULL'], default: 'NONE' },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

orderSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Order', orderSchema);
