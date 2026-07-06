import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const categorySchema = {
  title: 'category schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    parentCategoryId: { type: 'string' },
    image: { type: 'string' },
    imageSynced: { type: 'boolean' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'isDeleted', 'updatedAt']
};

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
    updatedAt: { type: 'string' },
    image: { type: 'string' },
    imageSynced: { type: 'boolean' },
    categoryId: { type: 'string' },
    costPrice: { type: 'number' },
    alertLevel: { type: 'number' },
    promotionalDiscount: {
      type: 'object',
      properties: {
        rate: { type: 'number' },
        price: { type: 'number' },
        label: { type: 'string' }
      }
    },
    variants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          size: { type: 'string' },
          color: { type: 'string' },
          sku: { type: 'string' },
          barcode: { type: 'string' },
          stock: { type: 'number' }
        },
        required: ['sku', 'stock']
      }
    },
    addons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' }
        },
        required: ['name', 'price']
      }
    },
    hasSpiceLevel: { type: 'boolean' },
    kitchenSection: { type: 'string' }
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
          quantity: { type: 'number' },
          returnedQty: { type: 'number' },
          returnReason: { type: 'string' },
          variantSku: { type: 'string' },
          spiceLevel: { type: 'string' },
          selectedAddons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' }
              },
              required: ['name', 'price']
            }
          }
        },
        required: ['productId', 'name', 'price', 'quantity']
      }
    },
    totalAmount: { type: 'number' },
    paymentMode: { type: 'string' },
    returnStatus: { type: 'string' },
    status: { type: 'string' },
    tableId: { type: 'string' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'items', 'totalAmount', 'paymentMode', 'isDeleted', 'updatedAt']
};

const tableSchema = {
  title: 'table schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    tableNo: { type: 'string' },
    capacity: { type: 'number' },
    status: { type: 'string' },
    currentOrderId: { type: 'string' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'tableNo', 'status', 'isDeleted', 'updatedAt']
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
      orders: { schema: orderSchema },
      categories: { schema: categorySchema },
      tables: { schema: tableSchema }
    });
    return db;
  });
  
  return dbPromise;
};
