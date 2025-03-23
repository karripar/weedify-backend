import express, {NextFunction, Request, Response} from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares';
import CustomError from '../../classes/CustomError';
import { TokenContent } from 'hybrid-types/DBTypes';
import randomstring from 'randomstring';
import { param } from 'express-validator';


/**
 * @apiDefine FileUploadGroup File Upload
 * File upload routes
 */

/**
 * @apiDefine token Token is required in the form of Bearer token
 * @apiHeader {String} Authorization Bearer token
 * @apiHeaderExample {json} Header-Example:
 * {
 *  "Authorization": "Bearer <token>"
 * }
 */

/**
 * @apiDefine unauthorized Unauthorized
 * @apiError (401) {String} Unauthorized User is not authorized
 * @apiErrorExample {json} Unauthorized:
 * {
 *  "message": "Unauthorized"
 * }
 */

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const userId = (req as Request).res?.locals.user.user_id;
    const extension = file.originalname.split('.').pop();

    const randomName = randomstring.generate(20);
    const newName = `${randomName}_${userId}.${extension}`;
    cb(null, newName);
  },
})

const profilePicStorage = multer.diskStorage({
  destination: './uploads/profile',
  filename: (req, file, cb) => {
    const userId = (req as Request).res?.locals.user.user_id;
    const extension = file.originalname.split('.').pop();

    const randomName = randomstring.generate(20);
    const newName = `${randomName}_${userId}.${extension}`;
    cb(null, newName);
  }
})

const upload = multer({storage}).single('file');
const profileUpload = multer({storage: profilePicStorage}).single('file');

const doUpload = (
  req: Request,
  res: Response<unknown, {user: TokenContent}>,
  next: NextFunction
) => {
  upload(req, res, (err) => {
    if (err) {
      next(new CustomError(err.message, 400));
      return;
    }

    if (
      req.file &&
      (req.file.mimetype.includes('image') ||
      req.file.mimetype.includes('video'))
    ) {
      next();
    }
  });
}

const router = express.Router();


export default router;
