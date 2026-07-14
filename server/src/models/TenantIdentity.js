const mongoose = require('mongoose');

const tenantIdentitySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  role: { type: String, enum: ['OWNER', 'MANAGER', 'CASHIER'], required: true }
}, { timestamps: true });

tenantIdentitySchema.index({ tenantId: 1 });

module.exports = mongoose.model('TenantIdentity', tenantIdentitySchema);
