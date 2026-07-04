import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const productSchema = {
  title: 'product schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    price: { type: 'number' },
    sku: { type: 'string' },
    stock: { type: 'number' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'price', 'isDeleted', 'updatedAt']
};

const orderSchema = {
  title: 'order schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          name: { type: 'string' },
          price: { type: 'number' },
          quantity: { type: 'number' }
        },
        required: ['productId', 'name', 'price', 'quantity']
      }
    },
    totalAmount: { type: 'number' },
    paymentMode: { type: 'string' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'items', 'totalAmount', 'paymentMode', 'isDeleted', 'updatedAt']
};

let dbPromise = null;

export const getDatabase = async () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = createRxDatabase({
    name: 'pos_offline_db',
    storage: getRxStorageDexie(),
    ignoreDuplicate: true
  }).then(async (db) => {
    await db.addCollections({
      products: { schema: productSchema },
      orders: { schema: orderSchema }
    });
    return db;
  });
  
  return dbPromise;
};
