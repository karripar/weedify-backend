import {Request, Response, NextFunction} from 'express';
import {
  fetchAllFavorites,
  fetchFavoritesByUserId,
  addFavorite,
  removeFavorite,
  countFavorites,
  fetchFavoriteStatus,
} from '../models/favoriteModel';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import {Favorite, Recipe, TokenContent} from 'hybrid-types/DBTypes';

const favoriteStatusGet = async (
  req: Request<{recipe_id: string}>,
  res: Response<{favorite: boolean}, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const user_id = res.locals.user.user_id;
    const recipe_id = Number(req.params.recipe_id);
    const status = await fetchFavoriteStatus(user_id, recipe_id);
    res.json({favorite: status});
  } catch (err) {
    next(err);
  }
};

// Get all favorites
const favoriteListGet = async (
  req: Request,
  res: Response<Favorite[]>,
  next: NextFunction,
) => {
  try {
    const favorites = await fetchAllFavorites();
    res.json(favorites);
  } catch (err) {
    next(err);
  }
};

// Get favorites by user id
const favoriteListGetByUserId = async (
  req: Request<{user_id: string}>,
  res: Response<Recipe[], {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const user_id = res.locals.user.user_id;
    if (!user_id) {
      throw new Error('No user_id provided');
    }
    const favorites = await fetchFavoritesByUserId(user_id);
    console.log('favorites by user_id', favorites);
    res.json(favorites);
  } catch (err) {
    next(err);
  }
};

// Add a favorite
const favoriteAdd = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const user_id = res.locals.user.user_id;
    const recipe_id = Number(req.body.recipe_id);
    const result = await addFavorite(user_id, recipe_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Get the number of favorites for a media
const favoriteCountGet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const recipe_id = Number(req.params.recipe_id);
    const count = await countFavorites(recipe_id);
    res.json({count});
  } catch (err) {
    next(err);
  }
};

// Remove a favorite
const favoriteRemove = async (
  req: Request<{user_id: string; recipe_id: string}>,
  res: Response<MessageResponse, {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const user_id = res.locals.user.user_id;
    const recipe_id = Number(req.params.recipe_id);
    console.log('user_id', user_id);
    console.log('recipe_id', recipe_id);
    const result = await removeFavorite(user_id, recipe_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export {
  favoriteListGet,
  favoriteListGetByUserId,
  favoriteAdd,
  favoriteRemove,
  favoriteCountGet,
  favoriteStatusGet,
};
