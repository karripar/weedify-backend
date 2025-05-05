/* eslint-disable @typescript-eslint/no-unused-vars */
import CustomError from './classes/CustomError';
import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import {TokenContent} from 'hybrid-types/DBTypes';
import sharp from 'sharp';
import rateLimit from 'express-rate-limit';
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


const getThumbnails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next(new CustomError('No file uploaded', 400));
    }

    console.log('File path: ', req.file.path);

    // Handle image files
    if (!req.file.mimetype.includes('video')) {
      sharp.cache(false);
      await sharp(req.file.path)
        .resize(320, 320)
        .png()
        .toFile(req.file.path + '-thumb.png')
        .then(() => {
          console.log('Image thumbnail generated successfully');
          next(); // Call next only after thumbnail generation
        })
        .catch((err) => {
          console.error('Error generating image thumbnail:', err);
          return next(new CustomError('Error generating image thumbnail', 500));
        });
      return;
    }

    // Handle video files
    await makeVideoThumbail(req.file.path)
      .then(() => {
        console.log('Video thumbnail and gif generated successfully');
        next(); // Call next only after video thumbnail and gif generation
      })
      .catch((err) => {
        console.error('Error generating video thumbnail:', err);
        next(new CustomError('Error generating video thumbnail', 500));
      });
  } catch (error) {
    console.error('Unexpected error generating thumbnail:', error);
    next(new CustomError('Unexpected error generating thumbnail', 500));
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


const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many uploads, please try again later.',
    status: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return res.locals.user.user_id || req.ip; // use user_id if available, otherwise use IP
  }
});

export {notFound, errorHandler, authenticate, getThumbnails, userToBody, uploadRateLimit};
