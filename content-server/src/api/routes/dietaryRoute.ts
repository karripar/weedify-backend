import express from 'express';
import {
  dietaryListGet,
  dietaryListByRecipeIdGet,
  dietaryMostPopularGet,
} from '../controllers/dietaryController';
import {validationErrors} from '../../middlewares';
import {param} from 'express-validator';

const dietaryRouter = express.Router();

/**
 * @apiDefine dietaryGroup Dietary API
 * all routes related to dietary information
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


dietaryRouter
  .route('/')
  .get(
    /**
     * @api {get} /dietary Get Dietary Types
     * @apiName GetDietaryTypes
     * @apiGroup dietaryGroup
     * @apiVersion 1.0.0
     * @apiDescription Get all dietary types
     * @apiPermission none
     *
     * @apiSuccess {object[]} dietary List of dietary types
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * [
     *  {
     *    "dietary_type_id": 1,
     *    "dietary_type_name": "Vegetarian"
     * }
     * ]
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     */
    dietaryListGet,
  );
dietaryRouter
  .route('/recipe/:id')
  .get(
    /**
     * @api {get} /dietary/recipe/:id Get Dietary Types by Recipe ID
     * @apiName GetDietaryTypesByRecipeId
     * @apiGroup dietaryGroup
     * @apiVersion 1.0.0
     * @apiDescription Get dietary types by recipe ID
     * @apiPermission none
     *
     * @apiParam {Number} id Recipe ID
     *
     * @apiSuccess {object[]} dietary List of dietary types
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * [
     *  {
     *    "dietary_type_id": 1,
     *    "dietary_type_name": "Vegetarian"
     * }
     * ]
     *
     * @apiError (Error 400) {String} BadRequest Invalid request
     * @apiErrorExample {json} BadRequest
     *    HTTP/1.1 400 Bad Request
     *    {
     *      "error": "Invalid request"
     *    }
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     */
    param('id').isInt({min: 1}).toInt(),
    validationErrors,
    dietaryListByRecipeIdGet,
  );
dietaryRouter
  .route('/popular/:limit')
  .get(
    /**
     * @api {get} /dietary/popular/:limit Get Most Popular Dietary Types
     * @apiName GetMostPopularDietaryTypes
     * @apiGroup dietaryGroup
     * @apiVersion 1.0.0
     * @apiDescription Get most popular dietary types
     * @apiPermission none
     *
     * @apiParam {Number} limit Limit for the number of dietary types
     *
     * @apiSuccess {object[]} dietary List of most popular dietary types
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * [
     *  {
     *    "dietary_type_id": 1,
     *    "dietary_type_name": "Vegetarian"
     * }
     * ]
     *
     * @apiError (Error 400) {String} BadRequest Invalid request
     * @apiErrorExample {json} BadRequest
     *    HTTP/1.1 400 Bad Request
     *    {
     *      "error": "Invalid request"
     *    }
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     */
    param('limit').isInt({min: 1}).toInt(),
    validationErrors,
    dietaryMostPopularGet,
  );
export default dietaryRouter;
