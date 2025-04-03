import {Request, Response, NextFunction} from 'express';
import {
  fetchAllRecipes,
  fetchRecipeById,
  postRecipe,
  deleteRecipe,
  fetchRecipesByUserId,
  fetchRecipesByUsername,
  fetchRecipesByTagname,
} from '../models/recipeModel';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import {Recipe, TokenContent, RecipeWithDietaryIds} from 'hybrid-types/DBTypes';
import CustomError from '../../classes/customError';
import {ERROR_MESSAGES} from '../../utils/errorMessages';

const RecipeListGet = async (
  req: Request<{}, {}, {page: string; limit: string}>,
  res: Response<Recipe[]>,
  next: NextFunction,
) => {
  try {
    const {page, limit} = req.query;
    const Recipe = await fetchAllRecipes(Number(page), Number(limit));
    res.json(Recipe);
  } catch (error) {
    next(error);
  }
};

const RecipeGet = async (
  req: Request<{id: string}>,
  res: Response<Recipe>,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const Recipe = await fetchRecipeById(id);
    res.json(Recipe);
  } catch (error) {
    next(error);
  }
};

// Post a new recipe
const RecipePost = async (
  req: Request<
    {},
    {},
    Omit<RecipeWithDietaryIds, 'recipe_id' | 'created_at' | 'thumbnail'> & {
      ingredients: {
        name: string;
        amount: string | number;
        unit: string;
      }[];
      dietary_info: number[] | string[]; // Allow string[] in case it comes as strings
    }
  >,
  res: Response<{ message: string; Recipe_id: number }, { user: TokenContent }>,
  next: NextFunction
) => {
  try {
    // Add user_id to Recipe object from token
    req.body.user_id = res.locals.user.user_id;

    // dietary_info is a valid array of numbers
    const dietaryInfo = Array.isArray(req.body.dietary_info)
      ? req.body.dietary_info.map(Number).filter(num => !isNaN(num)) // Convert and filter NaN values
      : [];

    const ingredients = req.body.ingredients.map(ingredient => ({
      name: ingredient.name,
      amount: Number(ingredient.amount) || 0, // Default to 0 if invalid
      unit: ingredient.unit,
    }));

    // Debugging logs
    console.log('Processed dietary_info:', dietaryInfo);
    console.log('Processed ingredients:', ingredients);

    // Post the recipe
    const response = await postRecipe(req.body, ingredients, dietaryInfo);

    // Send the response with recipe_id
    res.json({
      message: 'Recipe created',
      Recipe_id: response.recipe_id,
    });
  } catch (error) {
    next(error);
  }
};



const RecipeDelete = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse, {user: TokenContent; token: string}>,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const result = await deleteRecipe(
      id,
      res.locals.user.user_id,
      res.locals.token,
      res.locals.user.level_name,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const RecipesByTokenGet = async (
  req: Request<{user_id: string}>,
  res: Response<Recipe[]>,
  next: NextFunction,
) => {
  console.log('res.locals.user', res.locals.user);
  try {
    if (!res.locals.user || !res.locals.user.user_id) {
      throw new CustomError(ERROR_MESSAGES.RECIPE.NO_ID, 400);
    }

    const user_id = res.locals.user?.user_id;
    if (!user_id) {
      throw new CustomError(ERROR_MESSAGES.RECIPE.NO_ID, 400);
    }
    const Recipe = await fetchRecipesByUserId(user_id);
    res.json(Recipe);
  } catch (error) {
    next(error);
  }
};

const RecipesByUsernameGet = async (
  req: Request<{username: string}>,
  res: Response<Recipe[]>,
  next: NextFunction,
) => {
  try {
    const username = req.params.username;
    if (!username) {
      throw new CustomError(ERROR_MESSAGES.RECIPE.NO_USERNAME, 400);
    }

    const Recipe = await fetchRecipesByUsername(username);
    res.json(Recipe);
  } catch (error) {
    next(error);
  }
};

const RecipesByTagnameGet = async (
  req: Request<{tagname: string}>,
  res: Response<Recipe[]>,
  next: NextFunction,
) => {
  try {
    const tagname = req.params.tagname;
    if (!tagname) {
      throw new CustomError(ERROR_MESSAGES.RECIPE.NO_TAG, 400);
    }

    const Recipe = await fetchRecipesByTagname(tagname);
    res.json(Recipe);
  } catch (error) {
    next(error);
  }
};

const RecipesByUserGet = async (
  req: Request<{user_id: string}>,
  res: Response<Recipe[], {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const user_id = Number(req.params.user_id) || null;

    if (!user_id) {
      throw new CustomError(ERROR_MESSAGES.RECIPE.NO_ID, 400);
    }

    const Recipe = await fetchRecipesByUserId(user_id);
    res.json(Recipe);
  } catch (error) {
    next(error);
  }
};

export {
  RecipeListGet,
  RecipeGet,
  RecipePost,
  RecipeDelete,
  RecipesByUserGet,
  RecipesByTokenGet,
  RecipesByUsernameGet,
  RecipesByTagnameGet,
};
