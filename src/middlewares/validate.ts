import AppError from "../utils/errorHandling";
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const value = await schema.validateAsync(req.body, {
      abortEarly: false, // biar semua error keluar
      stripUnknown: true // buang field yang ga dikenal
    });

    req.validatedBody = value;
    next();
  } catch (err: any) {
    if (err.isJoi) {
      const formattedErrors = err.details.map((e: any) => ({
        field: e.path[0],
        message: e.message
      }));

      return next(new AppError('Validation Failed', 400, formattedErrors));
    }

    next(err);
  }
};