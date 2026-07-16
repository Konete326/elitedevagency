const mongoose = require('mongoose');

const restaurantPaymentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  tableSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', required: true },
  customerName: { type: String, required: true },
  tableNo: { type: String, required: true },
  tableId: { type: String, required: true },
  accountNumberUsed: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'CONFIRMED', 'DISMISSED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('RestaurantPayment', restaurantPaymentSchema);
