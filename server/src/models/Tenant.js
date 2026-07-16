const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  niche: { type: String, enum: ['GYM', 'RESTAURANT', 'GARMENTS'], required: true },
  plan: { type: String, required: true },
  activeModules: [{ type: String }],
  isActive: { type: Boolean, default: true },
  rentOverdue: { type: Boolean, default: false },
  databaseURI: { type: String, required: true },
  dbURI: { type: String, required: true },
  features: [{ type: String }],
  customPlanName: { type: String },
  customPlanPrice: { type: Number },
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
  },
  blockMobileAccess: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  suspensionTitle: { type: String, default: "" },
  suspensionDescription: { type: String, default: "" },
  ownerName: { type: String },
  ownerEmail: { type: String },
  easyPaisaName: { type: String, default: "" },
  easyPaisaNumber: { type: String, default: "" },
  jazzCashName: { type: String, default: "" },
  jazzCashNumber: { type: String, default: "" },
  bankName: { type: String, default: "" },
  bankIban: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
