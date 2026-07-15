const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  parentCategoryId: { type: String },
  image: { type: String },
  imageSynced: { type: Boolean, default: false },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  isDeleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

categorySchema.index({ tenantId: 1, parentCategoryId: 1 });
categorySchema.index({ tenantId: 1, updatedAt: 1, _id: 1 });

module.exports = mongoose.model('Category', categorySchema);
