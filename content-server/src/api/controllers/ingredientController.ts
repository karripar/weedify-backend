import {Request, Response, NextFunction} from 'express';
import {
  searchFineliIngredients,
  getFineliIngredientById,
} from '../../lib/fineliService';

// Search ingredients from Fineli API
const searchIngredients = async (
  req: Request<{}, {}, {}, {searchTerm: string}>, // Fix the generic type for query params
  res: Response,
  next: NextFunction,
) => {
  try {
    const {searchTerm} = req.query;
    if (!searchTerm) {
      res.status(400).json({error: 'Search term is required'});
      return; // Return void, not the response
    }

    const results = await searchFineliIngredients(searchTerm);
    res.json(results); // Don't return this
  } catch (error) {
    next(error);
  }
};

// Get ingredient details by ID
const getIngredientById = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({error: 'Invalid ingredient ID'});
      return; // Return void, not the response
    }

    const ingredient = await getFineliIngredientById(id);
    if (!ingredient) {
      res.status(404).json({error: 'Ingredient not found'});
      return; // Return void, not the response
    }

    res.json(ingredient); // Don't return this
  } catch (error) {
    next(error);
  }
};

export {searchIngredients, getIngredientById};
