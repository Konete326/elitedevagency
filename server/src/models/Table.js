const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tableNo: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'], default: 'AVAILABLE' },
  currentOrderId: { type: String, default: null },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

tableSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Table', tableSchema);
