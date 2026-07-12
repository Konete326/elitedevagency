const mongoose = require('mongoose');

const cashShiftSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  openedAt: { type: String, required: true },
  closedAt: { type: String },
  openingBalance: { type: Number, required: true },
  cashSales: { type: Number, default: 0 },
  expenses: { type: Number, default: 0 },
  closingBalance: { type: Number },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  openedBy: { type: String, required: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

cashShiftSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('CashShift', cashShiftSchema);
