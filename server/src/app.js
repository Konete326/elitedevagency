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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const authRoutes = require('./routes/auth.routes');
const syncRoutes = require('./routes/sync.routes');
const heartbeatRoutes = require('./routes/heartbeat.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const mediaRoutes = require('./routes/media.routes');
const employeeRoutes = require('./routes/employee.routes');
const logRoutes = require('./routes/log.routes');
const tableOrderRoutes = require('./routes/tableOrder.routes');
const tenantRoutes = require('./routes/tenant.routes');

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'API is running', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/heartbeat', heartbeatRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/table-order', tableOrderRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api', logRoutes);

app.use(errorHandler);

module.exports = app;
