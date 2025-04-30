import {Request, Response, NextFunction} from 'express';
import {
  fetchAllRecipes,
  fetchRecipeById,
  postRecipe,
  deleteRecipe,
  fetchRecipesByUserId,
  fetchRecipesByUsername,
  fetchRecipesByTagname,
  updateRecipe,
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
        fineli_id: number;
        energy_kcal: number;
        protein: number;
        fat: number;
        carbohydrate: number;
        fiber: number;
        sugar: number;
      }[];
      dietary_info?: number[] | string[] | null; // Allow string[] in case it comes as strings
    }
  >,
  res: Response<{message: string; recipe_id: number}, {user: TokenContent}>,
  next: NextFunction,
) => {
  console.log('RecipePost body:', req.body);
  try {
    // Add user_id to Recipe object from token
    req.body.user_id = res.locals.user.user_id;

    // dietary_info is a valid array of numbers
    const dietaryInfo = Array.isArray(req.body.dietary_info)
      ? req.body.dietary_info.map(Number).filter((num) => !isNaN(num))
      : [];
    console.log('dietary info', dietaryInfo);

    // Update the ingredients mapping to include all required nutritional properties
    const ingredients = req.body.ingredients.map((ingredient) => ({
      ingredient_id: 0, // This will be assigned by the database
      fineli_id: ingredient.fineli_id,
      name: ingredient.name,
      amount: Number(ingredient.amount) || 0,
      unit: ingredient.unit,
      energy_kcal: ingredient.energy_kcal || 0,
      protein: ingredient.protein || 0,
      fat: ingredient.fat || 0,
      carbohydrate: ingredient.carbohydrate || 0,
      fiber: ingredient.fiber || 0,
      sugar: ingredient.sugar || 0,
    }));

    // Debugging logs
    console.log('Processed dietary_info:', dietaryInfo);
    console.log('Processed ingredients:', ingredients);

    // Create a proper RecipeWithDietaryIds object with required properties
    const recipeData: RecipeWithDietaryIds = {
      ...req.body,
      recipe_id: 0, // Placeholder, will be assigned by DB
      created_at: new Date().toISOString(),
      thumbnail: '', // Placeholder, will be generated later
      dietary_id: dietaryInfo, // Use the preprocessed dietary info
    };

    // Post the recipe with the properly formatted data
    const response = await postRecipe(
      res.locals.user.user_id,
      recipeData,
      ingredients,
    );

    // Send the response with recipe_id
    res.json({
      message: 'Recipe created',
      recipe_id: response.recipe_id,
    });
  } catch (error) {
    console.error('Error in RecipePost:', error);
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

interface RecipeUpdate {
  title: string;
  instructions: string;
  cooking_time: number;
  difficulty_level_id: number;
  portions: number;
  ingredients?: {
    name: string;
    amount: string | number;
    unit: string;
    fineli_id?: number;
    energy_kcal?: number;
    protein?: number;
    fat?: number;
    carbohydrate?: number;
    fiber?: number;
    sugar?: number;
  }[];
  dietary_info?: number[] | string | null;
}

const updateRecipePost = async (
  req: Request<{id: string}, unknown, RecipeUpdate>,
  res: Response<Recipe>,
  next: NextFunction,
) => {
  try {
    const recipeId = Number(req.params.id);
    const userId = res.locals.user.user_id;
    const level_name = res.locals.user.level_name;

    const recipe = await fetchRecipeById(recipeId);
    if (!recipe) {
      next(new CustomError('Recipe not found', 404));
      return;
    }
    if (recipe.user_id !== userId && level_name !== 'Admin') {
      next(
        new CustomError(
          'You do not have permission to update this recipe',
          403,
        ),
      );
      return;
    }

    const recipeModifications = req.body;

    console.log('RecipeUpdate body:', recipeModifications);
    // Clean dietary info (if provided as an array or as a comma-separated string)
    const dietaryInfo = Array.isArray(recipeModifications.dietary_info)
      ? recipeModifications.dietary_info
      : recipeModifications.dietary_info
        ? recipeModifications.dietary_info.split(',').map(Number)
        : null;

    // Clean ingredients and preserve nutritional data
    const ingredients = Array.isArray(recipeModifications.ingredients)
      ? recipeModifications.ingredients.map((ingredient) => ({
          name: ingredient.name,
          amount: Number(ingredient.amount) || 0,
          unit: ingredient.unit,
          fineli_id: ingredient.fineli_id || 0,
          energy_kcal: ingredient.energy_kcal || 0,
          protein: ingredient.protein || 0,
          fat: ingredient.fat || 0,
          carbohydrate: ingredient.carbohydrate || 0,
          fiber: ingredient.fiber || 0,
          sugar: ingredient.sugar || 0,
        }))
      : undefined;

    console.log('Processed dietary_info:', dietaryInfo);
    console.log('Processed ingredients with nutrition:', ingredients);

    // Call the updateRecipe function with recipe modifications and optional fields
    const updatedRecipe = await updateRecipe(
      recipeId,
      recipeModifications,
      ingredients,
      dietaryInfo,
    );

    if (!updatedRecipe) {
      next(new CustomError('Recipe not found', 404));
      return;
    }

    res.json(updatedRecipe);
  } catch (err) {
    next(err);
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
  updateRecipePost,
};
