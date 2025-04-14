import express from 'express';
import {authenticate, validationErrors} from '../../middlewares';
import {body, param} from 'express-validator';
import {
  likeListByRecipeGet,
  likeListByUserGet,
  likePost,
  likeDelete,
  likeByRecipeIdAndUserIdGet,
} from '../controllers/likeController';

const likeRouter = express.Router();

/**
 * @apiDefine LikeGroup Like API
 * Like routes
 */

/**
 * @apiDefine token Token is required in the form of Bearer token
 * token should be passed in the header as a Bearer token
 * @apiHeader {String} Authorization Bearer <token>
 */

/**
 * @apiDefine unauthorized Unauthorized
 * @apiError (401) {String} Unauthorized User is not authorized
 * @apiErrorExample {json} Unauthorized:
 * HTTP/1.1 401 Unauthorized
 * {
 *  "message": "Unauthorized"
 * }
 */

likeRouter
.route('/')
.post(
  /**
   * @api {post} /likes Post a like on a recipe
   * @apiName LikePost
   * @apiGroup LikeGroup
   * @apiVersion 1.0.0
   * @apiDescription Like a recipe
   * @apiHeader {String} Authorization Bearer token
   * @apiPermission token
   *
   * @apiBody {Number} recipe_id Recipe ID
   * @apiExample {json} Request-Example:
   * {
   *  "recipe_id": 1
   * }
   * @apiSuccess {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "Recipe liked"
   * }
   * @apiError (400) {String} Missing Missing required fields
   * @apiErrorExample {json} Missing required fields:
   * {
   *  "message": "Missing required fields"
   * }
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   *  "message": "Unauthorized"
   * }
   * @apiError (500) {String} Server-Error An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   *  "message": "An error occurred"
   * }
   */
  body('recipe_id')
    .exists()
    .withMessage('recipe_id is required')
    .isNumeric()
    .withMessage('recipe_id must be a number'),
  validationErrors,
  authenticate,
  likePost,
)

likeRouter
.route('/recipe/:recipe_id')
.get(
  /**
   * @api {get} /likes/recipe/:recipe_id Get likes by recipe ID
   * @apiName LikeListByRecipeGet
   * @apiGroup LikeGroup
   * @apiVersion 1.0.0
   * @apiDescription Get likes by recipe ID
   * @apiHeader {String} Authorization Bearer token
   *
   * @apiParam {Number} recipe_id Recipe ID
   *
   * @apiSuccess {Object[]} likes List of likes
   * @apiSuccess {Number} likes.like_id Like ID
   * @apiSuccess {Number} likes.recipe_id Recipe ID
   * @apiSuccess {Number} likes.user_id User ID
   * @apiSuccess {Date} likes.created_at Created at
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "likes": [
   *    {
   *      "like_id": 1,
   *      "recipe_id": 1,
   *      "user_id": 1,
   *      "created_at": "2023-10-01T00:00:00.000Z"
   *   }
   *  ]
   * }
   * @apiError (400) {String} Missing required fields Missing required fields
   * @apiErrorExample {json} Missing required fields:
   * {
   * "message": "Missing required fields"
   * }
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   * "message": "Unauthorized"
   * }
   * @apiError (500) {String} Server-Error An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   * "message": "An error occurred"
   * }
   */
  param('recipe_id')
    .exists()
    .withMessage('recipe_id is required')
    .isNumeric()
    .withMessage('recipe_id must be a number'),
  validationErrors,
  likeListByRecipeGet,
)

likeRouter
.route('/user/:user_id')
.get(
  /**
   * @api {get} /likes/user/:user_id Get likes by user ID
   * @apiName LikeListByUserGet
   * @apiGroup LikeGroup
   * @apiVersion 1.0.0
   * @apiDescription Get likes by user ID
   * @apiHeader {String} Authorization Bearer token
   *
   * @apiParam {Number} user_id User ID
   *
   * @apiSuccess {Object[]} likes List of likes
   * @apiSuccess {Number} likes.like_id Like ID
   * @apiSuccess {Number} likes.recipe_id Recipe ID
   * @apiSuccess {Number} likes.user_id User ID
   * @apiSuccess {Date} likes.created_at Created at
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "likes": [
   *    {
   *      "like_id": 1,
   *      "recipe_id": 1,
   *      "user_id": 1,
   *     "created_at": "2023-10-01T00:00:00.000Z"
   *   }
   *  ]
   * }
   * @apiError (400) {String} Missing required fields Missing required fields
   * @apiErrorExample {json} Missing required fields:
   * {
   * "message": "Missing required fields"
   * }
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   * "message": "Unauthorized"
   * }
   * @apiError (500) {String} Server-error An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   * "message": "An error occurred"
   * }
   */
  param('user_id')
    .exists()
    .withMessage('user_id is required')
    .isNumeric()
    .withMessage('user_id must be a number'),
  validationErrors,
  likeListByUserGet,
)

likeRouter
.route('/recipe/:recipe_id/user')
.get(
  /**
   * @api {get} /likes/recipe/:recipe_id/user Get like by recipe ID and user ID
   * @apiName LikeByRecipeIdAndUserIdGet
   * @apiGroup LikeGroup
   * @apiVersion 1.0.0
   * @apiDescription Get like by recipe ID and user ID
   * @apiPermission token
   *
   * @apiHeader {String} Authorization Bearer token
   *
   * @apiParam {Number} recipe_id Recipe ID
   *
   * @apiSuccess {Object} like Like object
   * @apiSuccess {Number} like.like_id Like ID
   * @apiSuccess {Number} like.recipe_id Recipe ID
   * @apiSuccess {Number} like.user_id User ID
   * @apiSuccess {Date} like.created_at Created at
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "like": {
   *    "like_id": 1,
   *    "recipe_id": 1,
   *    "user_id": 1,
   *    "created_at": "2023-10-01T00:00:00.000Z"
   *  }
   * }
   * @apiError (400) {String} Missing required fields Missing required fields
   * @apiErrorExample {json} Missing required fields:
   * {
   * "message": "Missing required fields"
   * }
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   * "message": "Unauthorized"
   * }
   * @apiError (500) {String} Server-error An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   * "message": "An error occurred"
   * }
   */
  param('recipe_id')
    .exists()
    .withMessage('recipe_id is required')
    .isNumeric()
    .withMessage('recipe_id must be a number'),
  authenticate,
  validationErrors,
  likeByRecipeIdAndUserIdGet,
)

likeRouter
.route('/:id')
.delete(
  /**
   * @api {delete} /likes/:id Delete a like
   * @apiName LikeDelete
   * @apiGroup LikeGroup
   * @apiDescription Delete a like
   * @apiVersion 1.0.0
   * @apiHeader {String} Authorization Bearer token
   * @apiPermission token
   *
   * @apiParam {Number} id Like ID
   *
   * @apiSuccess {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "Like deleted"
   * }
   * }
   * @apiError (400) {String} Missing required fields Missing required fields
   * @apiErrorExample {json} Missing required fields:
   * {
   * "message": "Missing required fields"
   * }
   * @apiError (401) {String} Unauthorized User is not authorized
   * @apiErrorExample {json} Unauthorized:
   * {
   *  "message": "Unauthorized"
   * }
   * @apiError (500) {String} Server-error An error occurred
   * @apiErrorExample {json} An error occurred:
   * {
   *  "message": "An error occurred"
   * }
   */
  param('id')
    .exists()
    .withMessage('id is required')
    .toInt()
    .isNumeric()
    .withMessage('id must be a number'),
  validationErrors,
  authenticate,
  likeDelete,
);


export default likeRouter;
