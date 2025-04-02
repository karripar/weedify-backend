import express from 'express';
import {
  RecipeListGet,
  RecipeGet,
  RecipePost,
  RecipeDelete,
  RecipesByUserGet,
  RecipesByTokenGet,
  RecipesByUsernameGet,
  RecipesByTagnameGet,
} from '../controllers/recipeController';
import {authenticate, validationErrors} from '../../middlewares';
import {body, param} from 'express-validator';

const recipeRouter = express.Router();

/**
 * @apiDefine recipeGroup Recipe API
 * All the APIs related to recipes
 */

/**
 * @apiDefine token Authentication required in the form of a token
 * token should be passed in the header as a Bearer token
 * @apiHeader {String} Authorization token
 */

/**
 * @apiDefine unauthorized Unauthorized
 * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
 * @apiErrorExample {json} Unauthorized
 *   HTTP/1.1 401 Unauthorized
 *  {
 *   "error": "Unauthorized"
 * }
 */

recipeRouter
  .route('/')
  .get(
    /**
     * @api {get} /recipes Get Recipes
     * @apiName GetRecipes
     * @apiGroup recipeGroup
     * @apiVersion 1.0.0
     * @apiDescription Get all recipes
     * @apiPermission none
     *
     * @apiSuccess {object[]} recipes List of recipes
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * [
     *  {
     *    "recipe_id": 1,
     *    "user_id": 1,
     *    "filename": "recipe1.jpg",
     *    "filesize": 12345,
     *    "media_type": "image/jpeg",
     *    "title": "Recipe Title",
     *    "instructions": "Recipe instructions",
     *    "diet_type": "Diet type",
     *    "cooking_time": "Cooking time",
     *    "thumbnail": "Thumbnail URL",
     *    "screenshots": ["Screenshot URL 1", "Screenshot URL 2"],
     *    "createdAt": "2021-07-01T00:00:00.000Z",
     *    "ingredients": [
     *      {
     *        "ingredient_id": 1,
     *        "name": "Ingredient Name",
     *        "amount": 1,
     *        "unit": "g"
     *      }
     *    ]
     *  }
     * ]
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     */
    RecipeListGet,
  )
  .post(
    /**
     * @api {post} /recipes Create Recipe
     * @apiName CreateRecipe
     * @apiGroup recipeGroup
     * @apiVersion 1.0.0
     * @apiDescription Create a new recipe
     * @apiPermission token
     *
     * @apiUse token
     *
     * @apiBody {string} title Title of the recipe
     * @apiBody {string} instructions Instructions for the recipe
     * @apiBody {string} diet_type Diet type of the recipe
     * @apiBody {number} cooking_time Cooking time of the recipe (in minutes)
     * @apiBody {string} media_type Media type of the recipe file from the upload response
     * @apiBody {string} filename Filename of the recipe from the upload response
     * @apiBody {number} filesize Filesize of the recipe from the upload response
     * @apiBody {object[]} ingredients List of ingredients
     * @apiBody {string} ingredients.name Name of the ingredient
     * @apiBody {number} ingredients.amount Amount of the ingredient in decimal format or integer
     * @apiBody {string} ingredients.unit Unit of the ingredient
     *
     * @apiExample {json} Request-Example:
     * {
     *  "title": "Recipe Title",
     *  "instructions": "Recipe instructions",
     *  "diet_type": "Diet type",
     *  "cooking_time": 30,
     *  "media_type": "image/jpeg",
     *  "filename": "recipe.jpg",
     *  "filesize": 12345,
     *  "difficulty_level_id": 1,
     *  "ingredients": [
     *  {
     *   "name": "Ingredient Name",
     *   "amount": 1,
     *   "unit": "g"
     *  },
     *  {
     *   "name": "Another Ingredient",
     *   "amount": 2,
     *   "unit": "ml"
     *  }
     * ],
     * "dietary_info": [
     *  {
     *  "diet_type_id": 1
     * }
     * }
     *
     *
     * @apiSuccess {string} message Success message
     * @apiSuccess {number} Recipe_id ID of the created recipe
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 201 Created
     * {
     *   "message": "Recipe created",
     *   "Recipe_id": 1
     * }
     *
     * @apiError (Error 400) {String} BadRequest Invalid request body
     * @apiErrorExample {json} BadRequest
     * HTTP/1.1 400 Bad Request
     * {
     *  "error": "Bad Request"
     *  }
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *  HTTP/1.1 401 Unauthorized
     * {
     *  "error": "Unauthorized"
     *  }
     * @apiError (Error 500) {String} InternalServerError Error creating recipe
     * @apiErrorExample {json} InternalServerError
     * HTTP/1.1 500 Internal Server Error
     * {
     * "error": "Internal Server Error"
     * }
     *
     */
    authenticate,
    body('title')
      .notEmpty()
      .isString()
      .isLength({min: 3, max: 100})
      .trim()
      .escape(),
    body('instructions')
      .notEmpty()
      .isString()
      .isLength({min: 20, max: 2000})
      .trim()
      .escape(),
    body('diet_type')
      .notEmpty()
      .isString()
      .isLength({min: 3, max: 50})
      .trim()
      .escape(),
    body('cooking_time')
      .notEmpty()
      .isNumeric()
      .isInt({min: 1, max: 1440})
      .toInt()
      .trim()
      .escape(),
    body('media_type')
      .notEmpty()
      .isString()
      .isLength({min: 3, max: 50})
      .trim()
      .escape(),
    body('filename')
      .notEmpty()
      .isString()
      .isLength({min: 3, max: 100})
      .trim()
      .escape(),
    body('filesize')
      .notEmpty()
      .isNumeric()
      .isInt({min: 1})
      .toInt()
      .trim()
      .escape(),
    body('difficulty_level_id')
      .optional()
      .isNumeric()
      .isInt({min: 1})
      .toInt()
      .trim()
      .escape(),
    body('ingredients')
      .isArray()
      .notEmpty()
      .custom((value) => {
        if (value.length === 0) {
          throw new Error('Ingredients array cannot be empty');
        }
        return true;
      }),
    body('ingredients.*.name')
      .notEmpty()
      .isString()
      .isLength({min: 3, max: 50})
      .trim()
      .escape(),
    body('ingredients.*.amount')
      .notEmpty()
      .isNumeric()
      .isInt({min: 1})
      .toInt()
      .trim()
      .escape(),
    body('ingredients.*.unit')
      .notEmpty()
      .isString()
      .isLength({min: 1, max: 20})
      .trim()
      .escape(),
    body('dietary_info')
      .optional()
      .isArray()
      .notEmpty()
      .custom((value) => {
        if (value.length === 0) {
          throw new Error('Dietary info array cannot be empty');
        }
        return true;
      }),
    body('dietary_info.*.diet_type_id')
      .notEmpty()
      .isNumeric()
      .isInt({min: 1})
      .toInt()
      .trim()
      .escape(),
    validationErrors,
    RecipePost,
  );

recipeRouter
  .route('/:id')
  .get(
    /**
     * @api {get} /recipes/:id Get Recipe by ID
     * @apiName GetRecipeById
     * @apiGroup recipeGroup
     * @apiVersion 1.0.0
     * @apiDescription Get a recipe by ID
     * @apiPermission none
     *
     * @apiParam {number} id Recipe ID
     *
     * @apiSuccess {object} recipe Recipe object
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "recipe_id": 1,
     *   "user_id": 1,
     *   "createdAt": "2021-07-01T00:00:00.000Z"
     *   "title": "Recipe Title",
     *  "instructions": "Recipe instructions",
     *  "diet_type": "Diet type",
     *  "cooking_time": "Cooking time",
     *  "media_type": "Media type",
     *  "filename": "Filename",
     *  "filesize": 12345,
     *  "thumbnail": "Thumbnail URL",
     * "screenshots": ["Screenshot URL 1", "Screenshot URL 2"]
     * }
     *
     * @apiError (Error 400) {String} BadRequest Invalid request
     * @apiErrorExample {json} BadRequest
     * HTTP/1.1 400 Bad Request
     * {
     *   "error": "Bad Request"
     * }
     * }
     *
     * @apiError (Error 404) {String} NotFound Recipe not found
     * @apiErrorExample {json} NotFound
     * HTTP/1.1 404 Not Found
     * {
     *   "error": "Recipe not found"
     * }
     * }
     * @apiError (Error 500) {String} InternalServerError Error fetching recipe
     * @apiErrorExample {json} InternalServerError
     * HTTP/1.1 500 Internal Server Error
     * {
     *   "error": "Internal Server Error"
     * }
     * }
     */
    param('id').notEmpty().isInt({min: 1}).toInt(),
    validationErrors,
    RecipeGet,
  )
  .delete(
    /**
     * @api {delete} /recipes/:id Delete Recipe
     * @apiName DeleteRecipe
     * @apiGroup recipeGroup
     * @apiVersion 1.0.0
     * @apiDescription Delete a recipe by ID
     * @apiPermission token
     *
     * @apiUse token
     *
     * @apiParam {number} id Recipe ID
     *
     * @apiSuccess {string} message Success message
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "message": "Recipe deleted"
     * }
     *
     * @apiError (Error 400) {String} BadRequest Invalid request
     * @apiErrorExample {json} BadRequest
     * HTTP/1.1 400 Bad Request
     * {
     *   "error": "Bad Request"
     * }
     * }
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     * }
     *
     * @apiError (Error 404) {String} NotFound Recipe not found
     * @apiErrorExample {json} NotFound
     * HTTP/1.1 404 Not Found
     * {
     *   "error": "Recipe not found"
     * }
     * }
     * @apiError (Error 500) {String} InternalServerError Error deleting recipe
     * @apiErrorExample {json} InternalServerError
     * HTTP/1.1 500 Internal Server Error
     * {
     *   "error": "Internal Server Error"
     * }
     * }
     */
    authenticate,
    param('id').notEmpty().isInt({min: 1}).toInt(),
    validationErrors,
    RecipeDelete,
  );
recipeRouter.route('/byuser/:user_id').get(
  /**
   * @api {get} /recipes/byuser/:user_id Get Recipes by User ID
   * @apiName GetRecipesByUserId
   * @apiGroup recipeGroup
   * @apiVersion 1.0.0
   * @apiDescription Get all recipes by user ID
   * @apiPermission token
   *
   * @apiUse token
   *
   * @apiParam {number} user_id User ID
   *
   * @apiSuccess {object[]} recipes List of recipes
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "recipe_id": 1,
   *    "user_id": 1,
   *    "createdAt": "2021-07-01T00:00:00.000Z"
   *    "title": "Recipe Title",
   *    "instructions": "Recipe instructions",
   *    "diet_type": "Diet type",
   *    "cooking_time": "Cooking time",
   *    "media_type": "Media type",
   *    "filename": "Filename",
   *    "filesize": 12345,
   *    "thumbnail": "Thumbnail URL",
   *    "screenshots": ["Screenshot URL 1", "Screenshot URL 2"]
   *  }
   * ]
   *
   * @apiError (Error 400) {String} BadRequest Invalid request
   * @apiErrorExample {json} BadRequest
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Bad Request"
   * }
   * }
   * @apiError (Error 404) {String} NotFound Recipe not found
   * @apiErrorExample {json} NotFound
   * HTTP/1.1 404 Not Found
   * {
   *  "error": "Recipe not found"
   * }
   * }
   * @apiError (Error 500) {String} InternalServerError Error fetching recipes
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   *   "error": "Internal Server Error"
   * }
   * }
   */
  authenticate,
  param('user_id').notEmpty().isInt({min: 1}).toInt(),
  validationErrors,
  RecipesByUserGet,
);
recipeRouter.route('/bytoken').get(
  /**
   * @api {get} /recipes/bytoken Get Recipes by Token
   * @apiName GetRecipesByToken
   * @apiGroup recipeGroup
   * @apiVersion 1.0.0
   * @apiDescription Get all recipes by token
   * @apiPermission token
   *
   * @apiUse token
   *
   * @apiSuccess {object[]} recipes List of recipes
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "recipe_id": 1,
   *    "user_id": 1,
   *    "createdAt": "2021-07-01T00:00:00.000Z"
   *    "title": "Recipe Title",
   *    "instructions": "Recipe instructions",
   *    "diet_type": "Diet type",
   *    "cooking_time": "Cooking time",
   *    "media_type": "Media type",
   *    "filename": "Filename",
   *    "filesize": 12345,
   *    "thumbnail": "Thumbnail URL",
   *    "screenshots": ["Screenshot URL 1", "Screenshot URL 2"]
   *  }
   * ]
   *
   * @apiError (Error 400) {String} BadRequest Invalid request
   * @apiErrorExample {json} BadRequest
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Bad Request"
   * }
   * }
   * @apiError (Error 404) {String} NotFound Recipe not found
   * @apiErrorExample {json} NotFound
   * HTTP/1.1 404 Not Found
   * {
   *   "error": "Recipe not found"
   * }
   * }
   * @apiError (Error 500) {String} InternalServerError Error fetching recipes
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   *   "error": "Internal Server Error"
   * }
   * }
   */
  authenticate,
  validationErrors,
  RecipesByTokenGet,
);

recipeRouter.route('/byusername/:username').get(
  /**
   * @api {get} /recipes/byusername/:username Get Recipes by Username
   * @apiName GetRecipesByUsername
   * @apiGroup recipeGroup
   * @apiVersion 1.0.0
   * @apiDescription Get all recipes by username
   * @apiPermission none
   *
   * @apiParam {string} username Username
   *
   * @apiSuccess {object[]} recipes List of recipes
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "recipe_id": 1,
   *    "user_id": 1,
   *    "createdAt": "2021-07-01T00:00:00.000Z"
   *    "title": "Recipe Title",
   *    "instructions": "Recipe instructions",
   *    "diet_type": "Diet type",
   *    "cooking_time": "Cooking time",
   *    "media_type": "Media type",
   *    "filename": "Filename",
   *    "filesize": 12345,
   *    "thumbnail": "Thumbnail URL",
   *    "screenshots": ["Screenshot URL 1", "Screenshot URL 2"]
   *  }
   * ]
   *
   * @apiError (Error 400) {String} BadRequest Invalid request
   * @apiErrorExample {json} BadRequest
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Bad Request"
   * }
   * }
   * @apiError (Error 404) {String} NotFound Recipe not found
   * @apiErrorExample {json} NotFound
   * HTTP/1.1 404 Not Found
   * {
   *   "error": "Recipe not found"
   * }
   * }
   * @apiError (Error 500) {String} InternalServerError Error fetching recipes
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   *   "error": "Internal Server Error"
   * }
   * }
   */
  param('username').notEmpty().isString().trim().escape(),
  validationErrors,
  RecipesByUsernameGet,
);

recipeRouter.route('/bytagname/:tagname').get(
  /**
   * @api {get} /recipes/bytagname/:tagname Get Recipes by Tagname
   * @apiName GetRecipesByTagname
   * @apiGroup recipeGroup
   * @apiVersion 1.0.0
   * @apiDescription Get all recipes by tagname
   * @apiPermission none
   *
   * @apiParam {string} tagname Tagname
   *
   * @apiSuccess {object[]} recipes List of recipes
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "recipe_id": 1,
   *    "user_id": 1,
   *    "createdAt": "2021-07-01T00:00:00.000Z"
   *    "title": "Recipe Title",
   *    "instructions": "Recipe instructions",
   *    "diet_type": "Diet type",
   *    "cooking_time": "Cooking time",
   *    "media_type": "Media type",
   *    "filename": "Filename",
   *    "filesize": 12345,
   *    "thumbnail": "Thumbnail URL",
   *    "screenshots": ["Screenshot URL 1", "Screenshot URL 2"]
   *  }
   * ]
   *
   * @apiError (Error 400) {String} BadRequest Invalid request
   * @apiErrorExample {json} BadRequest
   * HTTP/1.1 400 Bad Request
   * {
   *   "error": "Bad Request"
   * }
   * }
   * @apiError (Error 404) {String} NotFound Recipe not found
   * @apiErrorExample {json} NotFound
   * HTTP/1.1 404 Not Found
   * {
   *   "error": "Recipe not found"
   * }
   * }
   * @apiError (Error 500) {String} InternalServerError Error fetching recipes
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   *   "error": "Internal Server Error"
   * }
   * }
   */
  param('tagname').notEmpty().isString().trim().escape(),
  validationErrors,
  RecipesByTagnameGet,
);

export default recipeRouter;
