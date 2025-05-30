/* eslint-disable @typescript-eslint/no-unused-vars */
import CustomError from "./classes/customError";
import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { TokenContent } from "hybrid-types/DBTypes";
import { validationResult } from "express-validator";
import rateLimit from "express-rate-limit";

// Middleware to handle 404 errors
const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError('Not Found', 404);
  next(error);
}

// Middleware to handle errors
const errorHandler = (error: CustomError, req: Request, res: Response, next: NextFunction) => {
  res.status(error.status || 500);
  res.json({
    message: error.message,
    status: error.status,
  });
}

// Middleware to check for validation errors
const validationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('VALIDATION ERRORS:', errors.array());
    const messages: string = errors.array().map((error) => error.msg).join(', ');
    next(new CustomError(messages, 400));
    return;
  }
  next();
}

const isDecimalWithTwoPlaces = (value: number): boolean => {
  return /^(\d+)(\.\d{1,2})?$/.test(value.toString());
};


// Middleware to authenticate the user
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('Unauthorized, no token provided', 401));
      return;
  }

  // decode the user_id from the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenContent;
  console.log(decoded);

  if (!decoded || !decoded.user_id) {
    next(new CustomError('Unauthorized, user not found', 401));
    return;
  }

  res.locals.user = decoded;
  res.locals.token = token;
  next();
  } catch (error) {
    next(new CustomError((error as Error).message, 401));
  }
}

const recipePostRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    message: 'Too many requests, try again later.',
    status: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return res.locals.user.user_id || req.ip;
  }
});



export {notFound, errorHandler, validationErrors, authenticate, isDecimalWithTwoPlaces, recipePostRateLimit};
