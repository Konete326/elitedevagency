const cron = require('node-cron');
const Tenant = require('../models/Tenant');
const logger = require('../config/logger.config');

const initCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const result = await Tenant.updateMany(
        { subscriptionExpiry: { $lt: new Date() }, rentOverdue: false },
        { $set: { rentOverdue: true } }
      );
      
      if (result.modifiedCount > 0) {
        logger.info(`Billing check complete: updated ${result.modifiedCount} tenants to rentOverdue: true`);
      }
    } catch (error) {
      logger.error(`Error in billing check cron: ${error.message}`);
    }
  });
};

module.exports = {
  initCronJobs
};
