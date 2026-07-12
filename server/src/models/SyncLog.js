const mongoose = require('mongoose');

const syncLogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  bytesTransferred: { type: Number, required: true },
  durationMs: { type: Number, required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  timestamp: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('SyncLog', syncLogSchema);
