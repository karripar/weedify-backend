import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../../classes/CustomError';
import { LoginResponse, MessageResponse } from 'hybrid-types/MessageTypes';
import {getUserByEmail} from '../models/userModel';
import { UserWithLevel, TokenContent } from 'hybrid-types/DBTypes';
import { createResetToken, verifyResetToken, updatePassword } from '../models/authModel';
import { getUserExistsByEmail } from '../models/userModel';
import { sendResetEmail } from '../../utils/emailer';

const Login = async (
  req: Request<object, object, { email: string, password: string }>,
  res: Response<LoginResponse>,
  next: NextFunction,
) => {
  try {
    const {email, password} = req.body;
    const user = await getUserByEmail(email);

    if (!user || !user.password) {
      next(new CustomError('Invalid credentials', 400));
      return;
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      next(new CustomError('Invalid email or password', 400));
      return;
    }

    if (!process.env.JWT_SECRET) {
      next(new CustomError('Internal server error, JWT_SECRET not set', 500));
      return;
    }

    const Out: Omit<UserWithLevel, 'password'> = {
      user_id: user.user_id,
      username: user.username,
      bio: user.bio,
      email: user.email,
      created_at: user.created_at,
      dietary_info: user.dietary_info,
      level_name: user.level_name,
      user_level_id: user.user_level_id,

    };

    const tokenContent: TokenContent = {
      user_id: user.user_id,
      level_name: user.level_name
    }

    const token = jwt.sign(tokenContent, process.env.JWT_SECRET, {expiresIn: '3h'});

    res.json({
      message: 'Login successful',
      token,
      user: Out,
    });
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
}

const requestPasswordReset = async (
  req: Request<{email: string}>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const {email} = req.body;
    const user = await getUserExistsByEmail(email);
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }

    if (!user.user_id) {
      next(new CustomError('User ID is missing', 400));
      return;
    }
    const token = await createResetToken(user.user_id);

    await sendResetEmail(email, token);

    res.json({
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
}

const resetPassword = async (
  req: Request<{token: string}, {password: string}>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const {token, password} = req.body; // token and new password from request body

    const tokenData = await verifyResetToken(token);
    if (!tokenData) {
      next(new CustomError('Invalid or expired token', 400));
      return;
    }

    await updatePassword(tokenData.user_id, password);

    res.json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(new CustomError((error as Error).message, 500));
  }
}

export {
  Login,
  requestPasswordReset,
  resetPassword,
}
