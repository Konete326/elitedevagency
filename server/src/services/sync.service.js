const getModel = (tenantConnection, collection) => {
  const map = {
    products: 'Product',
    orders: 'Order'
  };
  const modelName = map[collection];
  if (!modelName) {
    throw new Error(`Unsupported collection: ${collection}`);
  }
  return tenantConnection.model(modelName);
};

const pushChanges = async (tenantConnection, tenantId, collection, changeRows) => {
  const Model = getModel(tenantConnection, collection);
  const conflicts = [];

  for (const row of changeRows) {
    const doc = row.newDocumentState;
    const existing = await Model.findOne({ _id: doc._id, tenantId }).lean();

    if (existing) {
      const dbTime = new Date(existing.updatedAt).getTime();
      const clientTime = new Date(doc.updatedAt).getTime();
      
      if (dbTime > clientTime) {
        conflicts.push(existing);
        continue;
      }
    }

    const docToSave = { ...doc, tenantId, updatedAt: new Date() };
    await Model.findOneAndUpdate(
      { _id: doc._id, tenantId },
      docToSave,
      { upsert: true, new: true }
    );
  }

  return conflicts;
};

const pullChanges = async (tenantConnection, tenantId, collection, checkpoint, limit) => {
  const Model = getModel(tenantConnection, collection);
  const query = { tenantId };

  if (checkpoint && checkpoint.updatedAt && checkpoint.id) {
    query.$or = [
      { updatedAt: { $gt: new Date(checkpoint.updatedAt) } },
      {
        updatedAt: new Date(checkpoint.updatedAt),
        _id: { $gt: checkpoint.id }
      }
    ];
  }

  const documents = await Model.find(query)
    .select('-__v')
    .sort({ updatedAt: 1, _id: 1 })
    .limit(limit)
    .lean();

  let nextCheckpoint = checkpoint || null;
  if (documents.length > 0) {
    const lastDoc = documents[documents.length - 1];
    nextCheckpoint = {
      updatedAt: lastDoc.updatedAt.toISOString(),
      id: lastDoc._id
    };
  }

  return { documents, checkpoint: nextCheckpoint };
};

module.exports = {
  pushChanges,
  pullChanges
};
