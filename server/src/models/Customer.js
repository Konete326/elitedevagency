const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  receivableBalance: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

customerSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Customer', customerSchema);
