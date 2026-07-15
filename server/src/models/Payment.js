const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  memberId: { type: String, required: true },
  amountReceived: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  monthPaidFor: { type: String, required: true },
  receiptNo: { type: String },
  notes: { type: String },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

paymentSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
