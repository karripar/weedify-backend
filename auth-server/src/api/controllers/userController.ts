import {NextFunction, Request, Response} from 'express';
import CustomError from '../../classes/CustomError';
import bcrypt from 'bcryptjs';
import {UserDeleteResponse, UserResponse} from 'hybrid-types/MessageTypes';
import {
  getUserById,
  getUserByEmail,
  createUser,
  getUserByUsername,
  deleteUser,
  checkProfilePicExists,
  getUsers,
  postProfilePic,
  putProfilePic,
  getProfilePicById,
  updateUserDetails,
} from '../models/userModel';
import {
  ProfilePicture,
  User,
  TokenContent,
  UserWithNoPassword,
} from 'hybrid-types/DBTypes';

const salt = bcrypt.genSaltSync(12);

const usersGet = async (
  req: Request,
  res: Response<UserWithNoPassword[]>,
  next: NextFunction,
) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const userByUsernameGet = async (
  req: Request<{username: string}>,
  res: Response<UserWithNoPassword>,
  next: NextFunction,
) => {
  try {
    const user = await getUserByUsername(req.params.username);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const userByIdGet = async (
  req: Request<{id: string}>,
  res: Response<UserWithDietaryInfo>,
  next: NextFunction,
) => {
  try {
    const user = await getUserById(Number(req.params.id));
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const profilePictureGet = async (
  req: Request<{user_id: string}>,
  res: Response<ProfilePicture | null>,
  next: NextFunction,
) => {
  try {
    const profilePic = await checkProfilePicExists(Number(req.params.user_id));
    res.json(profilePic);
  } catch (err) {
    console.log('Error in profilePictureGet:', err);
    next(err);
  }
};

const profilePicPost = async (
  req: Request<
    unknown,
    unknown,
    Omit<ProfilePicture, 'profile_picture_id' | 'created_at'>
  >,
  res: Response<
    {message: string; profile_picture_id: number},
    {user: TokenContent}
  >,
  next: NextFunction,
) => {
  try {
    req.body.user_id = res.locals.user.user_id;
    const media = req.body;
    if (!media.filename || !media.filesize || !media.media_type) {
      next(new CustomError('Missing required fields', 400));
      return;
    }
    const response = await postProfilePic(req.body);

    res.json({
      message: 'Profile picture uploaded',
      profile_picture_id: response.profile_picture_id,
    });
  } catch (err) {
    next(err);
  }
};

const profilePicturePut = async (
  req: Request<{user_id: string}, unknown, ProfilePicture>,
  res: Response<ProfilePicture | null, {user: TokenContent; token: string}>,
  next: NextFunction,
) => {
  try {
    const profilePic = req.body;
    const user_id = Number(res.locals.user.user_id);

    if (!profilePic.filename || !profilePic.filesize || !profilePic.media_type) {
      next(new CustomError('Missing required fields', 400));
      return;
    }

    const result = await putProfilePic(profilePic, user_id);
    res.json(result);
  } catch (err) {
    console.log('Error in profilePicturePut:', err);
    next(err);
  }
};

const profilePicByIdGet = async (
  req: Request<{profile_picture_id: string}>,
  res: Response<ProfilePicture>,
  next: NextFunction,
) => {
  try {
    const profilePic = await getProfilePicById(
      Number(req.params.profile_picture_id),
    );
    res.json(profilePic);
  } catch (err) {
    next(err);
  }
};

const userPost = async (
  req: Request<unknown, unknown, User>,
  res: Response<UserResponse>,
  next: NextFunction,
) => {
  try {
    const user = req.body;

    if (!user.password || !user.email || !user.username) {
      next(new CustomError('Missing required fields', 400));
      return;
    }

    user.password = await bcrypt.hash(user.password, salt);

    const newUser = await createUser(user);
    console.log('newUser:', newUser);

    if (!newUser) {
      next(new CustomError('User not created', 500));
      return;
    }

    const response = {
      message: 'User created',
      user: newUser,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

const checkEmailExists = async (
  req: Request<{email: string}>,
  res: Response<{exists: boolean}>,
  next: NextFunction,
) => {
  try {
    const user = await getUserByEmail(req.params.email);
    res.json({exists: user ? true : false});
  } catch (err) {
    next(err);
  }
};

const checkUsernameExists = async (
  req: Request<{username: string}>,
  res: Response<{exists: boolean}>,
  next: NextFunction,
) => {
  try {
    const user = await getUserByUsername(req.params.username);
    res.json({exists: user ? true : false});
  } catch (err) {
    next(err);
  }
};

const deleteUserAsAdmin = async (
  req: Request<{user_id: string}>,
  res: Response<UserDeleteResponse, {user: TokenContent; token: string}>,
  next: NextFunction,
) => {
  try {
    if (res.locals.user.level_name !== 'Admin') {
      next(new CustomError('Unauthorized', 401));
      return;
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('Unauthorized', 401));
      return;
    }

    const response = await deleteUser(Number(req.params.user_id), token);

    if (!response) {
      next(new CustomError('User not deleted', 500));
      return;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

const deleteUserAsUser = async (
  req: Request,
  res: Response<UserDeleteResponse, {user: TokenContent; token: string}>,
  next: NextFunction,
) => {
  try {
    const userFromToken = res.locals.user;

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new CustomError('Unauthorized', 401));
      return;
    }

    const response = await deleteUser(userFromToken.user_id, token);

    if (!response) {
      next(new CustomError('User not deleted', 500));
      return;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

const checkToken = async (
  req: Request,
  res: Response<UserResponse, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const userFromToken = res.locals.user;

    const user = await getUserById(userFromToken.user_id);
    console.log('user:', user);

    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }

    res.json({message: 'Token is valid', user});
  } catch (err) {
    next(err);
  }
};

interface UserWithDietaryInfo {
  user_id: number;
  username: string;
  email: string;
  bio?: string;
  dietary_info?: number[] | string | null; // can be a string, array, null, or undefined
}

// generic function to update user details with one call and optional body items
const updateUser = async (
  req: Request<{user_id: string}, unknown, UserWithDietaryInfo>,
  res: Response<UserWithDietaryInfo>,
  next: NextFunction,
) => {
  try {
    const userModifications = req.body;

    // check if the array is of valid numbers
    const diets = Array.isArray(userModifications.dietary_info)
      ? userModifications.dietary_info
      : userModifications.dietary_info
        ? userModifications.dietary_info.split(',').map(Number)
        : [];

    const user_id = res.locals.user.user_id;
    const user = await updateUserDetails(user_id, userModifications, diets);

    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

export {
  userByUsernameGet,
  userByIdGet,
  userPost,
  checkEmailExists,
  checkUsernameExists,
  deleteUserAsAdmin,
  checkToken,
  deleteUserAsUser,
  profilePictureGet,
  usersGet,
  profilePicPost,
  profilePicturePut,
  profilePicByIdGet,
  updateUser,
};
