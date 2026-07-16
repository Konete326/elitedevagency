const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const { getTenantConnection } = require('../utils/tenantConnection.util');

const getTenantConnHelper = async (tenantId) => {
  const tenant = await Tenant.findById(tenantId).select('databaseURI isActive').lean();
  if (!tenant) {
    throw new Error('Tenant not found');
  }
  if (!tenant.isActive) {
    throw new Error('Tenant account is inactive');
  }
  return await getTenantConnection(tenant.databaseURI, tenantId);
};

const getPublicMenu = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const conn = await getTenantConnHelper(tenantId);
    const Product = conn.model('Product');
    const Category = conn.model('Category');

    const products = await Product.find({ isDeleted: false }).lean();
    const categories = await Category.find({ isDeleted: false }).lean();

    res.status(200).json({ success: true, data: { products, categories } });
  } catch (error) {
    next(error);
  }
};

const getPublicTenantSettings = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId)
      .select('easyPaisaName easyPaisaNumber jazzCashName jazzCashNumber bankName bankIban businessName paymentMethods')
      .lean();
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    res.status(200).json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

const initializeSession = async (req, res, next) => {
  try {
    const { tenantId, tableId, customerName } = req.body;
    if (!tenantId || !tableId || !customerName) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const conn = await getTenantConnHelper(tenantId);
    const TableSession = conn.model('TableSession');
    const Table = conn.model('Table');

    const table = await Table.findOne({
      $or: [
        { _id: tableId },
        { tableNo: tableId }
      ]
    });
    if (!table) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }
    const resolvedTableId = table._id.toString();

    let session = await TableSession.findOne({
      tableId: resolvedTableId,
      status: { $in: ['ORDERING', 'WAITING_CONFIRMATION'] }
    });

    if (session) {
      return res.status(200).json({ success: true, data: session });
    }

    session = new TableSession({
      tenantId,
      tableId: resolvedTableId,
      customerName,
      items: [],
      status: 'ORDERING'
    });
    await session.save();

    table.status = 'OCCUPIED';
    table.currentOrderId = session._id.toString();
    await table.save();

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const appendSessionItems = async (req, res, next) => {
  try {
    const { tenantId, sessionId, items } = req.body;
    if (!tenantId || !sessionId || !items) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const conn = await getTenantConnHelper(tenantId);
    const TableSession = conn.model('TableSession');

    const session = await TableSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    if (session.status === 'PAID') {
      return res.status(400).json({ success: false, error: 'Session is already paid' });
    }

    session.items.push(...items);
    await session.save();

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const submitPayment = async (req, res, next) => {
  try {
    const { tenantId, sessionId, method, accountName, accountNumber, amount } = req.body;
    if (!tenantId || !sessionId || !method || !accountNumber || !amount) {
      return res.status(400).json({ success: false, error: 'Missing payment parameters' });
    }

    const conn = await getTenantConnHelper(tenantId);
    const TableSession = conn.model('TableSession');
    const RestaurantPayment = conn.model('RestaurantPayment');
    const Table = conn.model('Table');

    const session = await TableSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.status = 'WAITING_CONFIRMATION';
    session.paymentDetails = {
      method,
      accountName,
      accountNumber,
      amount,
      submittedAt: new Date()
    };
    await session.save();

    const table = await Table.findById(session.tableId).lean();
    const tableNo = table ? table.tableNo : 'Unknown';

    const payment = new RestaurantPayment({
      tenantId,
      tableSessionId: session._id,
      customerName: session.customerName,
      tableNo,
      tableId: session.tableId,
      accountNumberUsed: accountNumber,
      amount,
      status: 'PENDING'
    });
    await payment.save();

    res.status(200).json({ success: true, message: 'Payment submitted successfully' });
  } catch (error) {
    next(error);
  }
};

const getSessionStatus = async (req, res, next) => {
  try {
    const { tenantId, sessionId } = req.params;
    const conn = await getTenantConnHelper(tenantId);
    const TableSession = conn.model('TableSession');

    const session = await TableSession.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.status(200).json({ success: true, status: session.status });
  } catch (error) {
    next(error);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { tenantId, sessionId, feedbackScore, feedbackComments } = req.body;
    const conn = await getTenantConnHelper(tenantId);
    const TableSession = conn.model('TableSession');

    const session = await TableSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.feedbackScore = feedbackScore;
    session.feedbackComments = feedbackComments;
    await session.save();

    res.status(200).json({ success: true, message: 'Feedback saved' });
  } catch (error) {
    next(error);
  }
};

const getPendingPayments = async (req, res, next) => {
  try {
    const RestaurantPayment = req.tenantConnection.model('RestaurantPayment');
    const payments = await RestaurantPayment.find({ status: { $in: ['PENDING', 'DISMISSED'] } }).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const { tenantId } = req.user;
    const RestaurantPayment = req.tenantConnection.model('RestaurantPayment');
    const TableSession = req.tenantConnection.model('TableSession');
    const Table = req.tenantConnection.model('Table');
    const Product = req.tenantConnection.model('Product');
    const Order = req.tenantConnection.model('Order');

    const payment = await RestaurantPayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (payment.status === 'CONFIRMED') {
      return res.status(400).json({ success: false, error: 'Payment already confirmed' });
    }

    const session = await TableSession.findById(payment.tableSessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Active session not found' });
    }

    const totalAmount = session.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderId = new mongoose.Types.ObjectId().toString();
    const orderItems = session.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      returnedQty: 0,
      isDeal: false,
      selectedAddons: []
    }));

    const order = new Order({
      _id: orderId,
      tenantId,
      items: orderItems,
      totalAmount,
      paymentMode: session.paymentDetails?.method || 'EasyPaisa',
      returnStatus: 'NONE',
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      tableId: session.tableId,
      tableNo: payment.tableNo,
      orderSource: 'TABLE_QR',
      isDeleted: false
    });
    await order.save();

    for (const item of session.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    session.status = 'PAID';
    await session.save();

    await Table.findByIdAndUpdate(session.tableId, {
      status: 'AVAILABLE',
      currentOrderId: ''
    });

    payment.status = 'CONFIRMED';
    await payment.save();

    res.status(200).json({ success: true, message: 'Payment confirmed and order generated successfully' });
  } catch (error) {
    next(error);
  }
};

const dismissPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.body;
    const RestaurantPayment = req.tenantConnection.model('RestaurantPayment');

    const payment = await RestaurantPayment.findByIdAndUpdate(paymentId, { status: 'DISMISSED' }, { new: true });
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    res.status(200).json({ success: true, message: 'Alert dismissed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicMenu,
  getPublicTenantSettings,
  initializeSession,
  appendSessionItems,
  submitPayment,
  getSessionStatus,
  submitFeedback,
  getPendingPayments,
  confirmPayment,
  dismissPayment
};
