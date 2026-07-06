const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tableNo: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'], default: 'AVAILABLE' },
  currentOrderId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
