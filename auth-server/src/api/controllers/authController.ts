import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import CustomError from '../../classes/CustomError';
import { LoginResponse } from 'hybrid-types/MessageTypes';
import {getUserByEmail} from '../models/userModel';
import { UserWithLevel, TokenContent } from 'hybrid-types/DBTypes';


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

export default Login;
