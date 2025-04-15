import {Request, Response, NextFunction} from 'express';
import {
  fetchLikeByRecipeIdAndUserId,
  fetchLikesByRecipeId,
  fetchLikesByUserId,
  postLike,
  deleteLike,
} from '../models/likeModel';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import {Like, TokenContent} from 'hybrid-types/DBTypes';

const likeListByRecipeGet = async (
  req: Request,
  res: Response<Like[]>,
  next: NextFunction,
) => {
  try {
    const likes = await fetchLikesByRecipeId(Number(req.params.recipe_id));
    res.json(likes);
  } catch (error) {
    next(error);
  }
};

const likeListByUserGet = async (
  req: Request,
  res: Response<Like[]>,
  next: NextFunction,
) => {
  try {
    const likes = await fetchLikesByUserId(Number(req.params.user_id));
    res.json(likes);
  } catch (error) {
    next(error);
  }
};

const likePost = async (
  req: Request<{}, {}, {recipe_id: string}>,
  res: Response<MessageResponse, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const recipe_id = Number(req.body.recipe_id);
    const user_id = res.locals.user.user_id;
    const result = await postLike(recipe_id, user_id);

    res.json(result);
  } catch (error) {
    console.error('Error in likePost:', error);
    next(error);
  }
};

// delete a like based on like_id
const likeDelete = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const result = await deleteLike(
      Number(req.params.id),
      res.locals.user.user_id,
      res.locals.user.level_name,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const likeByRecipeIdAndUserIdGet = async (
  req: Request<{recipe_id: string}>,
  res: Response<Like | null, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const user_id = res.locals.user.user_id;
    const recipe_id = Number(req.params.recipe_id);

    const result = await fetchLikeByRecipeIdAndUserId(recipe_id, user_id);
    // Return like object or null
    res.json(result);
  } catch (error) {
    // If error
    next(error);
  }
};

export {
  likeListByRecipeGet,
  likeListByUserGet,
  likePost,
  likeDelete,
  likeByRecipeIdAndUserIdGet,
};
