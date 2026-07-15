const mongoose = require('mongoose');

const trainerLedgerSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  trainerId: { type: String, required: true },
  type: { type: String, enum: ['Salary', 'Advance'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

trainerLedgerSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('TrainerLedger', trainerLedgerSchema);
