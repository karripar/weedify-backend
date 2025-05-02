import { ErrorResponse } from 'hybrid-types/MessageTypes';
import CustomError from '../classes/CustomError';
import { NextFunction } from 'express';

const corsSettings = {
  origin: '*',
  methods: 'GET, POST, PUT, DELETE',
  allowedHeaders: 'Content-Type, Authorization',
  optionsSuccessStatus: 200
};

const customLog = (message: string) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message);
  } else {
    return;
  }
};

const fetchData = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) {
    const error = json as unknown as ErrorResponse;
    console.log(error);
    if (error.message) {
      throw new CustomError(error.message, response.status);
    }
    throw new CustomError('An error occurred', response.status);
  }
  return json;
};

const handleErrors = (message: string, status: number, next: NextFunction) => {
  next(new CustomError(message, status));
}

const safeJsonParse = <T>(value: unknown): T | null => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return null;
    }
  }
  return value as T;
}



export { corsSettings, customLog, fetchData, handleErrors, safeJsonParse };
