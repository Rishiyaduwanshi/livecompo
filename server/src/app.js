import express from 'express';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { AppError } from './utils/appError.js';
import httpLogger from './utils/appLogger.js';
import globalErrorHandler from './middlewares/globalError.mid.js';

const app = express();

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

app.use((req, res, next) => {
  next(new AppError({ statusCode: 404, message: 'Route not found' }));
});

app.use(globalErrorHandler);
export default app;
