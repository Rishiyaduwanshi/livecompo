import express from 'express';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser'
import { config } from '../config/index.js';
import { AppError } from './utils/appError.js';
import httpLogger from './utils/appLogger.js';
import globalErrorHandler from './middlewares/globalError.mid.js';

const app = express();

app.use(cookieParser())
app.use(httpLogger);
app.use(rateLimit(config.GLOBAL_RATE_LIMIT_CONFIG));
app.use(rateLimit(config.PER_IP_RATE_LIMIT_CONFIG));
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Routes
import indexRoutes from './routes/index.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';

// API routes
app.use('/api/v1', indexRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  next(new AppError({ statusCode: 404, message: 'Route not found' }));
});

app.use(globalErrorHandler);
export default app;
