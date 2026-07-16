const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tableId: { type: String, required: true },
  customerName: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  }],
  status: { type: String, enum: ['ORDERING', 'WAITING_CONFIRMATION', 'PAID'], default: 'ORDERING' },
  paymentDetails: {
    method: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    amount: { type: Number },
    submittedAt: { type: Date }
  },
  feedbackScore: { type: Number },
  feedbackComments: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('TableSession', tableSessionSchema);
