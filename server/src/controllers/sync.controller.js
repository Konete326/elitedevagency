const syncService = require('../services/sync.service');
const SyncLog = require('../models/SyncLog');

const push = async (req, res) => {
  const { tenantId } = req.user;
  const { collection, changeRows } = req.body;
  const { tenantConnection } = req;
  
  const startTime = Date.now();
  try {
    const conflicts = await syncService.pushChanges(tenantConnection, tenantId, collection, changeRows);
    const durationMs = Date.now() - startTime;
    const bytesTransferred = JSON.stringify(req.body || {}).length;
    
    const syncLog = new SyncLog({
      tenantId,
      bytesTransferred,
      durationMs,
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    });
    await syncLog.save();

    res.status(200).json({
      success: true,
      data: conflicts
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const bytesTransferred = JSON.stringify(req.body || {}).length;
    const syncLog = new SyncLog({
      tenantId,
      bytesTransferred,
      durationMs,
      status: 'FAILED',
      timestamp: new Date().toISOString()
    });
    await syncLog.save();
    throw error;
  }
};

const pull = async (req, res) => {
  const { tenantId } = req.user;
  const { collection, checkpoint, limit } = req.query;
  const { tenantConnection } = req;
  
  const startTime = Date.now();
  try {
    const parsedCheckpoint = checkpoint ? JSON.parse(checkpoint) : null;
    const parsedLimit = parseInt(limit, 10) || 50;
    
    const result = await syncService.pullChanges(
      tenantConnection,
      tenantId, 
      collection, 
      parsedCheckpoint, 
      parsedLimit
    );
    
    const durationMs = Date.now() - startTime;
    const bytesTransferred = JSON.stringify(result || {}).length;
    
    const syncLog = new SyncLog({
      tenantId,
      bytesTransferred,
      durationMs,
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    });
    await syncLog.save();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const bytesTransferred = 0;
    const syncLog = new SyncLog({
      tenantId,
      bytesTransferred,
      durationMs,
      status: 'FAILED',
      timestamp: new Date().toISOString()
    });
    await syncLog.save();
    throw error;
  }
};

module.exports = {
  push,
  pull
};
