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
          isDeal: { type: 'boolean' },
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
    paymentStatus: { type: 'string' },
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

const dealSchema = {
  title: 'deal schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    price: { type: 'number' },
    description: { type: 'string' },
    image: { type: 'string' },
    imageSynced: { type: 'boolean' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string' },
          variantSku: { type: 'string' },
          quantity: { type: 'number' },
          name: { type: 'string' }
        },
        required: ['productId', 'quantity']
      }
    },
    isActive: { type: 'boolean' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'price', 'items', 'isDeleted', 'updatedAt']
};

const planSchema = {
  title: 'plan schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    price: { type: 'number' },
    durationInDays: { type: 'number' },
    description: { type: 'string' },
    isActive: { type: 'boolean' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'price', 'durationInDays', 'isDeleted', 'updatedAt']
};

const memberSchema = {
  title: 'member schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    phone: { type: 'string' },
    rfidCard: { type: 'string' },
    activePlanId: { type: 'string' },
    planExpiryDate: { type: 'string' },
    status: { type: 'string' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'phone', 'activePlanId', 'planExpiryDate', 'status', 'isDeleted', 'updatedAt']
};

const paymentSchema = {
  title: 'payment schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    memberId: { type: 'string' },
    amountReceived: { type: 'number' },
    paymentMethod: { type: 'string' },
    monthPaidFor: { type: 'string' },
    receiptNo: { type: 'string' },
    notes: { type: 'string' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'memberId', 'amountReceived', 'paymentMethod', 'monthPaidFor', 'isDeleted', 'updatedAt']
};

const trainerSchema = {
  title: 'trainer schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    phone: { type: 'string' },
    baseSalary: { type: 'number' },
    advanceBalance: { type: 'number' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'phone', 'baseSalary', 'advanceBalance', 'isDeleted', 'updatedAt']
};

const trainerLedgerSchema = {
  title: 'trainer ledger schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    trainerId: { type: 'string' },
    type: { type: 'string' },
    amount: { type: 'number' },
    date: { type: 'string' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'trainerId', 'type', 'amount', 'date', 'isDeleted', 'updatedAt']
};

const measurementSchema = {
  title: 'measurement schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    memberId: { type: 'string' },
    weight: { type: 'number' },
    height: { type: 'number' },
    bmi: { type: 'number' },
    bicep: { type: 'number' },
    chest: { type: 'number' },
    waist: { type: 'number' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'memberId', 'weight', 'height', 'bmi', 'isDeleted', 'updatedAt']
};

const customerSchema = {
  title: 'customer schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    phone: { type: 'string' },
    receivableBalance: { type: 'number' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'phone', 'receivableBalance', 'isDeleted', 'updatedAt']
};

const cashShiftSchema = {
  title: 'cash shift schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    openedAt: { type: 'string' },
    closedAt: { type: 'string' },
    openingBalance: { type: 'number' },
    cashSales: { type: 'number' },
    expenses: { type: 'number' },
    closingBalance: { type: 'number' },
    status: { type: 'string' },
    openedBy: { type: 'string' },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'openedAt', 'openingBalance', 'cashSales', 'expenses', 'status', 'openedBy', 'isDeleted', 'updatedAt']
};

const pricingTierSchema = {
  title: 'pricing tier schema',
  version: 0,
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string' },
    tenantId: { type: 'string' },
    name: { type: 'string' },
    price: { type: 'number' },
    description: { type: 'string' },
    isActive: { type: 'boolean' },
    niche: { type: 'string' },
    features: {
      type: 'array',
      items: { type: 'string' }
    },
    isSynced: { type: 'boolean' },
    isDeleted: { type: 'boolean' },
    updatedAt: { type: 'string' }
  },
  required: ['_id', 'tenantId', 'name', 'price', 'isDeleted', 'updatedAt']
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
      tables: { schema: tableSchema },
      deals: { schema: dealSchema },
      plans: { schema: planSchema },
      members: { schema: memberSchema },
      payments: { schema: paymentSchema },
      trainers: { schema: trainerSchema },
      trainer_ledgers: { schema: trainerLedgerSchema },
      measurements: { schema: measurementSchema },
      customers: { schema: customerSchema },
      cash_shifts: { schema: cashShiftSchema },
      pricing_tiers: { schema: pricingTierSchema }
    });
    return db;
  });
  
  return dbPromise;
};
