import express, {NextFunction, Request, Response} from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares';
import CustomError from '../../classes/CustomError';
import { TokenContent } from 'hybrid-types/DBTypes';
import randomstring from 'randomstring';
import { param } from 'express-validator';
import { uploadFile, deleteProfileFile, deleteFile } from '../controllers/uploadController';

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


router.post(
  /**
   * @api {post} /upload Upload a file
   * @apiName UploadFile
   * @apiGroup FileUploadGroup
   * @apiVersion  1.0.0
   * @apiDescription Upload a file
   * @apiPermission none
   *
   * @apiUse token
   *
   * @apiBody {File} file File to upload
   * @apiBodyExample {json} Body-Example:
   * {
   *  "filename": "file.jpg",
   *  "filesize": 1024,
   *  "media_type": "image/jpeg"
   * }
   *
   * @apiSuccess (200) {object} data File data
   * @apiSuccess (200) {string} message Success message
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "File uploaded",
   *  "data": {
   *   "filename": "file.jpg",
   *   "filesize": 1024,
   *   "media_type": "image/jpeg"
   *  }
   * }
   *
   * @apiError (400) {String} No valid file No valid file
   * @apiError (400) {String} Invalid file extension Invalid file extension
   * @apiErrorExample {json} No valid file:
   * {
   * "message": "No valid file"
   * }
   *
   * @apiErrorExample {json} Invalid file extension:
   * {
   * "message": "Invalid file extension"
   * }
   *
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   *  "message": "Unauthorized"
   * }
   *
   * @apiError (500) {String} An error occurred An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   *  "message": "An error occurred"
   * }
   */
  '/upload',
  authenticate,
  doUpload,
  uploadFile
);


router.post(
  /**
   * @api {post} /upload/profile Upload a profile file
   * @apiName UploadProfileFile
   * @apiGroup FileUploadGroup
   * @apiVersion  1.0.0
   * @apiDescription Upload a profile file
   * @apiPermission none
   *
   * @apiUse token
   *
   * @apiBody {File} file File to upload
   * @apiBodyExample {json} Body-Example:
   * {
   *  "filename": "file.jpg",
   *  "filesize": 1024
   * }
   *
   * @apiSuccess (200) {String} message Success message
   * @apiSuccess (200) {Number} profile_picture_id Profile picture ID
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "Profile picture uploaded",
   *  "profile_picture_id": 1
   * }
   *
   * @apiError (400) {String} Missing required fields Missing required fields
   * @apiErrorExample {json} Missing required fields:
   * {
   *  "message": "Missing required fields"
   * }
   *
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   *  "message": "Unauthorized"
   * }
   *
   * @apiError (500) {String} An error occurred An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   *  "message": "An error occurred"
   * }
   */
  '/upload/profile',
  authenticate,
  profileUpload,
  uploadFile
);


router.delete(
  /**
   * @api {delete} /upload/:filename Delete a file
   * @apiName DeleteFile
   * @apiGroup FileUploadGroup
   * @apiVersion  1.0.0
   * @apiDescription Delete a file
   * @apiPermission none
   *
   * @apiParam {String} filename Filename of the file to delete
   *
   * @apiSuccess (200) {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "File deleted"
   * }
   *
   * @apiError (400) {String} No filename provided No filename provided
   * @apiErrorExample {json} No filename provided:
   * {
   *  "message": "No filename provided"
   * }
   *
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   *  "message": "Unauthorized"
   * }
   */
  '/upload/:filename',
  authenticate,
  deleteFile
);


router.delete(
  /**
   * @api {delete} /upload/profile/:filename Delete a profile file
   * @apiName DeleteProfileFile
   * @apiGroup FileUploadGroup
   * @apiVersion  1.0.0
   * @apiDescription Delete a profile file
   * @apiPermission none
   *
   * @apiParam {String} filename Filename of the profile file to delete
   *
   * @apiSuccess (200) {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "File deleted"
   * }
   *
   * @apiError (400) {String} No filename or user_id provided No filename or user_id provided
   *
   * @apiErrorExample {json} No filename or user_id provided:
   * {
   *  "message": "No filename or user_id provided"
   * }
   *
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   *  "message": "Unauthorized"
   *
   * @apiError (404) {String} File not found File not found
   * @apiErrorExample {json} File not found:
   * {
   *  "message": "File not found"
   * }
   *
   * @apiError (500) {String} An error occurred An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   *  "message": "An error occurred"
   * }
   */
  '/upload/profile/:filename',
  authenticate,
  param('filename').isString(),
  deleteProfileFile
)


export default router;
