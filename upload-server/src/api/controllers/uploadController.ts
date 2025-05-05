import { Request, Response, NextFunction } from "express";
import CustomError from "../../classes/CustomError";
import fs from "fs";
import { MessageResponse } from "hybrid-types/MessageTypes";

const UPLOAD_DIR = './uploads';
const PROFILE_DIR = './uploads/profile';

type UploadResponse = MessageResponse & {
  data: {
    filename: string;
    media_type: string;
    filesize: number;
    screenshots?: string[];
  }
}


// Upload a file
const uploadFile = async (
  req: Request,
  res: Response<UploadResponse>,
  next: NextFunction,
) => {
  const tempFiles: string[] = [];
  try {
    if (!req.file) {
      throw new CustomError('No valid file', 400);
    }

    const extension = req.file.originalname.split('.').pop(); // Get the file extension

    if (!extension) {
      throw new CustomError('Invalid file extension', 400);
    }

    const response: UploadResponse = {
      message: 'File uploaded',
      data: {
        filename: req.file.filename,
        media_type: req.file.mimetype,
        filesize: req.file.size,
      }
    };

    res.json(response);
  } catch (err) {
    cleanup(tempFiles);
    next(
      err instanceof CustomError
        ? err
        : new CustomError('An error occurred', 400),
    );
  }
};


const deleteFile = async (
  req: Request<{filename: string}>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const {filename} = req.params;
    if (!filename) {
      throw new CustomError('No filename provided', 400);
    }

    // Check if the user is an admin
    if (res.locals.user.level_name !== 'Admin') {
      const fileUserId = filename.split('_').pop()?.split('.')[0];
      if (!fileUserId || fileUserId !== res.locals.user.user_id.toString()) {
        throw new CustomError('Unauthorized', 401);
      }
  }

  // Get the base filename
  const baseFileName = filename.split('.')[0];

  const filePath = `${UPLOAD_DIR}/${filename}`;

  if (!fs.existsSync(filePath)) {
    throw new CustomError('File not found', 404);
  }

  try {
    // Delete the file from the file system and any related files
    const filesToDelete = fs.readdirSync(UPLOAD_DIR).filter((file) => {
      return file.includes(baseFileName);
    });

    filesToDelete.forEach((file) => {
      const filePathToDelete = `${UPLOAD_DIR}/${file}`;
      if (fs.existsSync(filePathToDelete)) {
        fs.unlinkSync(filePath);
      }
    })
  } catch {
    throw new CustomError('An error occurred', 500);
  }

  res.json({message: 'File and related files deleted'});
  } catch (err) {
    console.error('Error deleting file in uploadController:', err);
    next(
      err instanceof CustomError
        ? err
        : new CustomError('An error occurred', 400),
    );
  }
};

// Delete a profile file
const deleteProfileFile = async (
  req: Request<{filename: string}, object, {user_id: number}>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const {filename} = req.params;
    const {user_id} = req.body;

    if (!filename || !user_id) {
      throw new CustomError('No filename or user_id provided', 400);
    }

    const fileUserId = filename.split('_').pop()?.split('.')[0]; // Get the user_id from the filename

    if (!fileUserId || fileUserId !== user_id.toString()) {
      throw new CustomError('Unauthorized', 401);
    }

    const filePath = `${PROFILE_DIR}/${filename}`;
    if (!fs.existsSync(filePath)) {
      throw new CustomError('File not found', 404);
    }

    // Delete the file from the file system
    try {
      fs.unlinkSync(filePath
      );
    } catch {
      throw new CustomError('An error occurred', 500);
    }

    res.json({message: 'File deleted'});
  } catch (err) {
    next(
      err instanceof CustomError
        ? err
        : new CustomError('An error occurred', 400),
    );
  }
};


const cleanup = (files: string[]) => {
  files.forEach((file) => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (err) {
      console.error(err);
    }
  })
};


export { uploadFile, deleteFile, deleteProfileFile };
