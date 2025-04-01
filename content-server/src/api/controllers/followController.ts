import {Request, Response, NextFunction} from 'express';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import {Follow, FollowResponse, TokenContent} from 'hybrid-types/DBTypes';
import {
  fetchFollowersByUserId,
  fetchFollowedUsersByUserId,
  addFollow,
  removeFollow,
  fetchFollowedUsersByUsername,
  fetchFollowersByUsername,
} from '../models/followModel';

// Request a list of followers by user ID
const getFollowersByUserId = async (
  req: Request,
  res: Response<Follow[]>,
  next: NextFunction,
) => {
  try {
    const user_id = Number(req.params.user_id);
    if (!user_id) {
      throw new Error('No user_id provided');
    }
    const followedUsers = await fetchFollowersByUserId(user_id);
    res.json(followedUsers);
  }
  catch (error) {
    next(error);
  }
};

// Request a list of followed users by username
const getFollowedUsersByUsername = async (
  req: Request,
  res: Response<Follow[]>,
  next: NextFunction,
) => {
  try {
    const username = req.params.username;
    if (!username) {
      throw new Error('No username provided');
    }
    const followedUsers = await fetchFollowedUsersByUsername(username);
    res.json(followedUsers);
  }
  catch (error) {
    next(error);
  }
};

// Request a list of followers by username
const getFollowersByUsername = async (
  req: Request,
  res: Response<Follow[]>,
  next: NextFunction,
) => {
  try {
    const username = req.params.username;
    if (!username) {
      throw new Error('No username provided');
    }
    const followers = await fetchFollowersByUsername(username);
    res.json(followers);
  }
  catch (error) {
    next(error);
  }
};

// Request a list of followers by user ID
const getFollowersByToken = async (
  req: Request,
  res: Response<Follow[]>,
  next: NextFunction,
) => {
  try {
    const user_id = res.locals.user.user_id;
    if (!user_id) {
      throw new Error('No user_id provided');
    }
    const followers = await fetchFollowersByUserId(user_id);
    res.json(followers);
  } catch (error) {
    next(error);
  }
};

// Request a list of followed users by user ID
const getFollowedUsersByUserId = async (
  req: Request,
  res: Response<Follow[]>,
  next: NextFunction,
) => {
  try {
    const user_id = Number(req.params.user_id);
    if (!user_id) {
      throw new Error('No user_id provided');
    }
    const followedUsers = await fetchFollowedUsersByUserId(user_id);
    res.json(followedUsers);
  }
  catch (error) {
    next(error);
  }
};

// Request a list of followed users by user ID
const getFollowedUsersByToken = async (
  req: Request,
  res: Response<Follow[]>,
  next: NextFunction,
) => {
  try {
    const user_id = Number(req.params.user_id) || res.locals.user.user_id;
    if (!user_id) {
      throw new Error('No user_id provided');
    }
    const followedUsers = await fetchFollowedUsersByUserId(user_id);
    res.json(followedUsers);
  } catch (error) {
    next(error);
  }
};

// Add a follow
const postFollow = async (
  req: Request<{user_id: string}, {}>,
  res: Response<FollowResponse, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const result = await addFollow(
      res.locals.user.user_id,
      Number(req.body.user_id),
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Remove a follow
const deleteFollow = async (
  req: Request<{follow_id: string}>,
  res: Response<MessageResponse, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const result = await removeFollow(
      Number(req.params.follow_id),
      res.locals.user.user_id,
      res.locals.user.level_name,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export {
  getFollowersByUserId,
  getFollowedUsersByUserId,
  postFollow,
  deleteFollow,
  getFollowersByToken,
  getFollowedUsersByToken,
  getFollowedUsersByUsername,
  getFollowersByUsername,
};
