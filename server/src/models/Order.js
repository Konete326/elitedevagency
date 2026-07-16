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
    variantSku: { type: String },
    spiceLevel: { type: String },
    isDeal: { type: Boolean, default: false },
    selectedAddons: [{
      name: { type: String },
      price: { type: Number }
    }]
  }],
  totalAmount: { type: Number, required: true },
  paymentMode: { type: String, required: true },
  returnStatus: { type: String, enum: ['NONE', 'PARTIAL', 'FULL'], default: 'NONE' },
  status: { type: String, enum: ['DRAFT', 'COMPLETED'], default: 'COMPLETED' },
  paymentStatus: { type: String, enum: ['PAID', 'UNPAID'], default: 'PAID' },
  tableId: { type: String },
  tableNo: { type: String },
  orderSource: { type: String, default: 'COUNTER' },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

orderSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Order', orderSchema);
