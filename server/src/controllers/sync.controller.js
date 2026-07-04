const syncService = require('../services/sync.service');

const push = async (req, res) => {
  const { tenantId } = req.user;
  const { collection, changeRows } = req.body;
  const { tenantConnection } = req;
  
  const conflicts = await syncService.pushChanges(tenantConnection, tenantId, collection, changeRows);
  
  res.status(200).json({
    success: true,
    data: conflicts
  });
};

const pull = async (req, res) => {
  const { tenantId } = req.user;
  const { collection, checkpoint, limit } = req.query;
  const { tenantConnection } = req;
  
  const parsedCheckpoint = checkpoint ? JSON.parse(checkpoint) : null;
  const parsedLimit = parseInt(limit, 10) || 50;
  
  const result = await syncService.pullChanges(
    tenantConnection,
    tenantId, 
    collection, 
    parsedCheckpoint, 
    parsedLimit
  );
  
  res.status(200).json({
    success: true,
    data: result
  });
};

module.exports = {
  push,
  pull
};
