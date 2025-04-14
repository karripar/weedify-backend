import {Request, Response, NextFunction} from 'express';
import {
  fetchRatingsByRecipeId,
  fetchRatingsByUserId,
  postRating,
  deleteRating,
  checkRatingExists
} from '../models/ratingModel';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import {Rating, TokenContent} from 'hybrid-types/DBTypes';


// list of ratings by Recipe item id
const ratingListByRecipeIdGet = async (
  req: Request<{id: string}, Rating[]>,
  res: Response<Rating[]>,
  next: NextFunction,
) => {
  try {
    const ratings = await fetchRatingsByRecipeId(Number(req.params.id));
    res.json(ratings);
  } catch (error) {
    next(error);
  }
}

// list of ratings by user id
const ratingListByUserIdGet = async (
  req: Request,
  res: Response<Rating[], {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const user_id = Number(res.locals.user.user_id);
    const ratings = await fetchRatingsByUserId(user_id);
    res.json(ratings);
  } catch (error) {
    next(error);
  }
}

// create a new rating
const ratingPost = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const {recipe_id, rating} = req.body;
    const user_id = Number(res.locals.user.user_id);
    const response = await postRating(recipe_id, user_id, rating);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

// delete a rating
const ratingDelete = async (
  req: Request<{id: string}, {user: TokenContent}>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const rating_id = Number(req.params.id);
    const user_id = Number(res.locals.user.user_id);
    const userLevel = res.locals.user.level_name;
    const response = await deleteRating(rating_id, user_id, userLevel);
    res.json(response);
  } catch (error) {
    next(error);
  }
}

// check if a rating exists
const ratingCheckExists = async (
  req: Request<{id: string}>,
  res: Response<boolean>,
  next: NextFunction,
) => {
  try {
    const recipe_id = Number(req.params.id);
    const user_id = Number(res.locals.user.user_id);
    const exists = await checkRatingExists(recipe_id, user_id);
    res.json(exists);
  } catch (error) {
    console.log('Error checking rating existence:', error);
    next(error);
  }
}

export {
  ratingListByRecipeIdGet,
  ratingListByUserIdGet,
  ratingPost,
  ratingDelete,
  ratingCheckExists
}
