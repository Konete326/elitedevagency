const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  niche: { type: String, enum: ['GYM', 'RESTAURANT', 'GARMENTS'], required: true },
  plan: { type: String, enum: ['STARTER', 'GROWTH', 'PRO'], required: true },
  activeModules: [{ type: String }],
  isActive: { type: Boolean, default: true },
  rentOverdue: { type: Boolean, default: false },
  databaseURI: { type: String, required: true },
  subscriptionExpiry: { type: Date, required: true },
  approvedDevices: [{
    deviceId: { type: String, required: true },
    deviceName: { type: String },
    status: { type: String, enum: ['PENDING', 'APPROVED'], default: 'PENDING' },
    addedAt: { type: Date, default: Date.now }
  }],
  customTheme: {
    lightPrimary: { type: String, default: null },
    darkPrimary: { type: String, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
