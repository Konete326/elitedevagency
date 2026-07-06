const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  rfidCard: { type: String },
  activePlanId: { type: String, required: true },
  planExpiryDate: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED'], default: 'ACTIVE' },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

memberSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Member', memberSchema);
