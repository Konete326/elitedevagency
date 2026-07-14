const ErrorLog = require('../models/ErrorLog');

const ipCounts = new Map();

setInterval(() => {
  ipCounts.clear();
}, 60000);

const createClientLog = async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const count = ipCounts.get(ip) || 0;
  
  if (count >= 10) {
    return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
  }
  
  ipCounts.set(ip, count + 1);

  const { tenantId, userEmail, type, message, stack, url, browserInfo } = req.body;

  if (!type || !message) {
    return res.status(400).json({ success: false, error: 'Type and message are required' });
  }

  if (type !== 'ERROR' && type !== 'WARNING') {
    return res.status(400).json({ success: false, error: 'Invalid log type' });
  }

  const log = new ErrorLog({
    tenantId: tenantId || 'PUBLIC',
    userEmail: userEmail || 'anonymous',
    type,
    message,
    stack,
    url,
    browserInfo
  });

  await log.save();

  res.status(201).json({ success: true });
};

const getSuperAdminLogs = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.tenantId) {
    filter.tenantId = req.query.tenantId;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  if (req.query.url) {
    filter.url = { $regex: req.query.url, $options: 'i' };
  }

  const logs = await ErrorLog.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ErrorLog.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: logs,
    meta: { page, limit, total }
  });
};

const getTenantLogs = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const tenantId = req.user.tenantId;
  const filter = { tenantId };

  if (req.query.type) {
    filter.type = req.query.type;
  }

  const logs = await ErrorLog.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ErrorLog.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: logs,
    meta: { page, limit, total }
  });
};

const clearLogs = async (req, res) => {
  await ErrorLog.deleteMany({});
  res.status(200).json({ success: true, message: 'All logs cleared' });
};

module.exports = {
  createClientLog,
  getSuperAdminLogs,
  getTenantLogs,
  clearLogs
};
