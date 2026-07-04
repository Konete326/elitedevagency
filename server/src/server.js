require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db.config');
const logger = require('./config/logger.config');
const { initCronJobs } = require('./services/cron.service');

const PORT = process.env.PORT || 5000;

connectDB();
initCronJobs();

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});
