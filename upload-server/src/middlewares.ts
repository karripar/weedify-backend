/* eslint-disable @typescript-eslint/no-unused-vars */
import CustomError from './classes/CustomError';
import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {TokenContent} from 'hybrid-types/DBTypes';
import sharp from 'sharp';
import path from 'path';
import makeVideoThumbail from './utils/videoThumb';


// Middleware to handle 404 errors
const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new CustomError('Not Found', 404);
  next(error);
};

// Middleware to handle errors
const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(error.status || 500);
  res.json({
    message: error.message,
    status: error.status,
  });
};

// Middleware to authenticate the user
const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('Unauthorized, no token provided', 401));
      return;
    }

    // decode the user_id from the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenContent;
    console.log(decoded);

    if (!decoded) {
      next(new CustomError('Unauthorized, invalid token', 401));
      return;
    }

    res.locals.user = decoded;
    next();
  } catch (error) {
    next(new CustomError((error as Error).message, 401));
  }
};


// thumbnail generation for images
const getThumbnails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      next(new CustomError('No file uploaded', 400));
      return;
    }

    console.log('path: ', req.file.path);

    if (!req.file.mimetype.includes('video')) {
      sharp.cache(false);
      await sharp(req.file.path)
        .resize(320, 320)
        .png()
        .toFile(req.file.path + '-thumb.png')
        .catch((err) => {
          console.error('Error generating thumbnail:', err);
          next(new CustomError('Error generating thumbnail', 500));
        });
        console.log('Thumbnail generated successfully');
      next();
      return;

    }
    // if the file is a video, generate thumbnails and gif
    await makeVideoThumbail(req.file.path)
    next();
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    next(new CustomError('Error generating thumbnail', 500));
  }
};

// user from res.locals to body
const userToBody = (
  req: Request,
  res: Response<unknown, {user: TokenContent}>,
  next: NextFunction
) => {
  if (!req.body.user) {
    delete req.body.user;
  }

  req.body.user = res.locals.user;
  next();
};

export {notFound, errorHandler, authenticate, getThumbnails, userToBody};
