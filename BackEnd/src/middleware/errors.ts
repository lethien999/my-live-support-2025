import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import logger from '@/config/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details || error.message,
    });
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A record with this information already exists.',
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        message: 'The requested record was not found.',
      });
    }
  }

  if (createError.isHttpError(error)) {
    return res.status(error.status).json({
      error: error.message,
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
};

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
};
