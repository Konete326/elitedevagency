require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger.config');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const authRoutes = require('./routes/auth.routes');
const syncRoutes = require('./routes/sync.routes');
const heartbeatRoutes = require('./routes/heartbeat.routes');
const superadminRoutes = require('./routes/superadmin.routes');

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/heartbeat', heartbeatRoutes);
app.use('/api/superadmin', superadminRoutes);

app.use(errorHandler);

module.exports = app;
