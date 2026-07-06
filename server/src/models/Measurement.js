const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  memberId: { type: String, required: true },
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  bmi: { type: Number, required: true },
  bicep: { type: Number },
  chest: { type: Number },
  waist: { type: Number }
}, {
  timestamps: true
});

measurementSchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Measurement', measurementSchema);
