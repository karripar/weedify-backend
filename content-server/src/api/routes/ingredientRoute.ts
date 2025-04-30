import express from 'express';
import {
  searchIngredients,
  getIngredientById,
} from '../controllers/ingredientController';
import {validationErrors} from '../../middlewares';
import {query, param} from 'express-validator';

const ingredientRouter = express.Router();

ingredientRouter
  .route('/search')
  .get(
    query('searchTerm').notEmpty().withMessage('Search term is required'),
    validationErrors,
    searchIngredients,
  );

ingredientRouter
  .route('/:id')
  .get(
    param('id').isInt().withMessage('Ingredient ID must be an integer'),
    validationErrors,
    getIngredientById,
  );

export default ingredientRouter;
