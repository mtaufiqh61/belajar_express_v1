import 'dotenv/config';

import express, {Request, Response, NextFunction} from 'express';
const app = express();

import usersRoute from './routes/userRoutes';
import productRoute from './routes/productRoutes';
import authRoute from './routes/authRoutes';
import { logger } from './utils/logger';
import { pinoHttp } from 'pino-http';
import cookieParser from 'cookie-parser';
import AppError from './utils/errorHandling';
import rateLimiterFn from './utils/rateLimiter';

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(pinoHttp({ logger, autoLogging: process.env.NODE_ENV !== 'test' }));

app.use(cookieParser());

app.get('/', (req: Request, res: Response, next: NextFunction) => {
  if (req.path !== '/' || req.method !== 'GET') {
    return next();
  }

  res.status(200).json({
    "message": `Selamat Datang di RESTful API ${process.env.APP_NAME}`,
    "status": "Running",
    "endpoints": {
      "auth": "/api/v1/auth",
      "users": "/api/v1/users",
      "products": "/api/v1/products"
    }
  })
});

app.use('/api/v1/auth', rateLimiterFn('auth'), authRoute);
app.use('/api/v1/users', rateLimiterFn('general'), usersRoute);
app.use('/api/v1/products', rateLimiterFn('general'), productRoute);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error(err);

  console.log('error handler called with error:', err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message,
      status: "error",
      errors: err.errors
    });
  }

  // fallback (unknown error)
  return res.status(500).json({
    message: "Internal Server Error",
    status: "error"
  });
})

export default app;