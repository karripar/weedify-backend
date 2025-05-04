/* eslint-disable @typescript-eslint/no-unused-vars */
import CustomError from "./classes/CustomError";
import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { TokenContent } from "hybrid-types/DBTypes";
import { validationResult } from "express-validator";
import {getUserById} from './api/models/userModel';

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
    const messages: string = errors.array().map((error) => error.msg).join(', ');
    next(new CustomError(messages, 400));
    return;
  }
  next();
}

// Middleware to authenticate the user
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('Unauthorized, no token provided', 401));
      return;
  }

  // decode the user_id from the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenContent; //
  console.log(decoded);

  const user = await getUserById(decoded.user_id);
  if (!user) {
    next(new CustomError('Unauthorized, user not found', 401));
    return;
  }

  res.locals.user = user;
  next();
  } catch (error) {
    next(new CustomError((error as Error).message, 401));
  }
}

const routeNotInUse = (req: Request, res: Response) => {
  res.status(404).json({
    message: "Route currently not in use (check back later)",
    status: 404,
  });
};



export {notFound, errorHandler, validationErrors, authenticate, routeNotInUse};
