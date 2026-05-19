import jwt from 'jsonwebtoken';
import AppError from '../utils/errorHandling';
import { redis } from '../utils/sessionStore';
import { Request, Response, NextFunction } from 'express';
import { User } from '../types/type';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError('Authorization header missing', 401, []));
  }

  const accessToken = authHeader?.split(' ')[1];

  try {
    const decoded = jwt.verify(accessToken, process.env.SECRET_KEY || "default_secret_key") as User;

    console.log('From App:', process.env.INSTANCE_NAME);

    try {
      const userSession = await redis.get(`session:${accessToken}`);
      if (!userSession) {
        return next(new AppError('Session expired or invalid', 401, []));
      }
    } catch (err) {
      console.error('Redis error: ', err);
    }

    req.user = decoded;
    req.token = accessToken;

    next();
  } catch (err) {
    // req.log.info({
    //   err,
    //   msg: 'JWT Verification Failed',
    //   path: req.url,
    //   method: req.method
    // });
    req.log.error(err, 'JWT Verification Failed');
    console.log('From App:', process.env.INSTANCE_NAME);
    return next(new AppError('Invalid token', 403, [{ field: 'Bearer Token', message: 'Bearer Token is invalid or expired' }] as any));
  }
};