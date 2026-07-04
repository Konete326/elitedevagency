const mongoose = require('mongoose');
const logger = require('./logger.config');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/pos_offline_first';
    
    await mongoose.connect(mongoURI);
    
    logger.info(`MongoDB Connected successfully`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
