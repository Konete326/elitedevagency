const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  tenantId: { type: String, index: true },
  userEmail: { type: String },
  type: { type: String, enum: ['ERROR', 'WARNING'], required: true },
  message: { type: String, required: true },
  stack: { type: String },
  url: { type: String },
  browserInfo: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
});

errorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);
