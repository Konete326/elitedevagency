const heartbeatService = require('../services/heartbeat.service');

const getHeartbeat = async (req, res) => {
  const { tenantId } = req.user;
  const { deviceFingerprint } = req.query;
  
  const result = await heartbeatService.checkHeartbeat(tenantId, deviceFingerprint);
  
  res.status(200).json({
    success: true,
    data: result
  });
};

module.exports = {
  getHeartbeat
};
