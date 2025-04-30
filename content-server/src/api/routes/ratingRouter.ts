import express from 'express';
import {
  ratingListByRecipeIdGet,
  ratingListByUserIdGet,
  ratingPost,
  ratingDelete,
  ratingCheckExists,
} from '../controllers/ratingController';
import {authenticate, validationErrors} from '../../middlewares';
import {body, param} from 'express-validator';

const ratingRouter = express.Router();

/**
 * @apiDefine ratingGroup Ratings
 * All the APIs related to ratings
 */

/**
 * @apiDefine token Authentication required in the form of a bearer token
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

ratingRouter
  .route('/recipe/:id')
  .get(
    /**
     * @api {get} /ratings/recipe/:id Get Ratings by Recipe ID
     * @apiName GetRatingsByRecipeId
     * @apiGroup ratingGroup
     * @apiVersion 1.0.0
     * @apiDescription Get ratings for a specific recipe by recipe ID
     * @apiPermission none
     *
     * @apiParam {Number} id Recipe ID
     *
     * @apiSuccess {object[]} ratings List of ratings for the recipe
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * [
     *   {
     *     "rating_id": 1,
     *     "recipe_id": 1,
     *     "user_id": 1,
     *     "rating": 4,
     *     "review": "Great recipe!",
     *     "created_at": "2023-10-01T12:00:00Z"
     *   }
     * ]
     *
     */
    param('id').isNumeric().withMessage('Recipe ID must be a number'),
    validationErrors,
    ratingListByRecipeIdGet,
  )
  /**
   * @api {delete} /ratings/recipe/:rating_id Delete Rating
   * @apiName DeleteRating
   * @apiGroup ratingGroup
   * @apiVersion 1.0.0
   * @apiDescription Delete a rating for a recipe by rating ID
   * @apiPermission token
   *
   * @apiUse token
   *
   * @apiParam {Number} id rating ID
   *
   * @apiSuccess {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *   "message": "Rating deleted"
   * }
   *
   * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
   * @apiErrorExample {json} Unauthorized
   * HTTP/1.1 401 Unauthorized
   * {
   *  "error": "Unauthorized"
   * }
   *
   * @apiError (Error 400) {String} BadRequest Invalid request data
   * @apiErrorExample {json} BadRequest
   * HTTP/1.1 400 BadRequest
   * {
   *  "error": "Invalid request data"
   * }
   *
   * @apiError (Error 500) {String} InternalServerError Error deleting rating
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 InternalServerError
   * {
   * "error": "Error deleting rating"
   * }
   *
   */
  .delete(
    authenticate,
    param('id').isNumeric().withMessage('Rating ID must be a number'),
    validationErrors,
    ratingDelete,
  );

ratingRouter.route('/').post(
  /**
   * @api {post} /ratings Post Rating
   * @apiName PostRating
   * @apiGroup ratingGroup
   * @apiVersion 1.0.0
   * @apiDescription Post a new rating for a recipe
   * @apiPermission token
   *
   * @apiUse token
   *
   * @apiBody {Number} recipe_id Recipe ID
   * @apiBody {object} rating Rating object
   * @apiBody {Number} rating.rating Rating value (1-5)
   * @apiBody {String} [rating.review] Review text
   *
   * @apiSuccess {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *   "message": "Rating added"
   * }
   *
   * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
   * @apiErrorExample {json} Unauthorized
   *  HTTP/1.1 401 Unauthorized
   * {
   *  "error": "Unauthorized"
   * }
   *
   * @apiError (Error 400) {String} BadRequest Invalid request data
   * @apiErrorExample {json} BadRequest
   * HTTP/1.1 400 BadRequest
   * {
   *  "error": "Invalid request data"
   * }
   *
   * @apiError (Error 500) {String} InternalServerError Error creating rating
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 InternalServerError
   * {
   * "error": "Error creating rating"
   * }
   *
   */
  authenticate,
  body('recipe_id').isNumeric().withMessage('recipe_id must be a number'),
  body('rating.rating')
    .isNumeric()
    .isInt({min: 1, max: 5})
    .withMessage('rating.rating must be a number'),
  body('rating.review')
    .optional()
    .isString()
    .withMessage('rating.review must be a string'),
  validationErrors,
  ratingPost,
);

ratingRouter.route('/user').get(
  /**
   * @api {get} /ratings/user Get Ratings by User ID
   * @apiName GetRatingsByUserId
   * @apiGroup ratingGroup
   * @apiVersion 1.0.0
   * @apiDescription Get ratings for a specific user
   * @apiPermission token
   *
   * @apiUse token
   *
   * @apiSuccess {object[]} ratings List of ratings for the user
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *   {
   *     "rating_id": 1,
   *     "recipe_id": 1,
   *     "rating": 4,
   *     "user_id": 1,
   *     "review": "Great recipe!",
   *    "created_at": "2023-10-01T12:00:00Z"
   *  }
   * ]
   *
   * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
   * @apiErrorExample {json} Unauthorized
   *  HTTP/1.1 401 Unauthorized
   * {
   *  "error": "Unauthorized"
   * }
   *
   * @apiError (Error 500) {String} InternalServerError Error fetching ratings
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 InternalServerError
   * {
   * "error": "Error fetching ratings"
   * }
   *
   */
  authenticate,
  ratingListByUserIdGet,
);

ratingRouter.route('/check-exists/:id').get(
  /**
   * @api {get} /ratings/check-exists/:id Check if Rating Exists
   * @apiName CheckRatingExists
   * @apiGroup ratingGroup
   * @apiVersion 1.0.0
   * @apiDescription Check if a rating exists for a specific recipe and user
   * @apiPermission token
   *
   * @apiUse token
   *
   * @apiParam {Number} id Recipe ID
   *
   * @apiSuccess {Boolean} exists True if the rating exists, false otherwise
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *   "exists": true
   * }
   *
   */
  authenticate,
  param('id').isNumeric().withMessage('Recipe ID must be a number'),
  validationErrors,
  ratingCheckExists,
);

export default ratingRouter;
