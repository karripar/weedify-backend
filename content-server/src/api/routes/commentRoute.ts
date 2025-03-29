import express from 'express';
import {
  commentListGet,
  commentListByRecipeIdGet,
  commentListByUserGet,
  commentCountByRecipeIdGet,
  commentGet,
  commentPost,
  commentPut,
  commentDelete,
} from '../controllers/commentController';
import {authenticate, validationErrors} from '../../middlewares';
import {body, param} from 'express-validator';

const commentRouter = express.Router();

/**
 * @apiDefine commentGroup Comment API
 * All the APIs related to comments
 */

/**
 * @apiDefine token Authentication required in the form of a token
 * token should be passed in the header as a Bearer token
 * @apiHeader {String} Authorization Bearer <token>
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

commentRouter
  .route('/')
  .get(
    /**
     * @api {get} /comments Get Comments
     * @apiName GetComments
     * @apiGroup commentGroup
     * @apiVersion 1.0.0
     * @apiDescription Get all comments
     * @apiPermission none
     *
     * @apiSuccess {object[]} comments List of comments
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * [
     *  {
     *    "id": 1,
     *    "comment": "This is a comment",
     *    "recipe_id": 1,
     *    "user_id": 1,
     *    "reference_comment_id": null,
     *    "createdAt": "2021-07-01T00:00:00.000Z"
     *  }
     * ]
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     */
    commentListGet,
  )
  .post(
    /**
     * @api {post} /comments Create Comment
     * @apiName CreateComment
     * @apiGroup commentGroup
     * @apiVersion 1.0.0
     * @apiDescription Create a comment
     * @apiPermission token
     *
     * @apiUse token
     * @apiUse unauthorized
     *
     * @apiBody {String} comment Comment text
     * @apiBody {Number} recipe_id Recipe ID
     * @apiBody {Number} [reference_comment_id] Reference comment ID (if replying to another comment)
     *
     * @apiSuccess {Number} id Comment ID
     * @apiSuccess {String} comment Comment text
     * @apiSuccess {Number} recipe_id Recipe ID
     * @apiSuccess {Number} user_id User ID
     * @apiSuccess {Number} reference_comment_id Reference comment ID
     * @apiSuccess {Date} createdAt Comment creation date
     * @apiSuccess {Date} updatedAt Comment update date
     *
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *  "id": 1,
     *  "comment": "This is a comment",
     *  "recipe_id": 1,
     *  "user_id": 1,
     *  "reference_comment_id": null,
     *  "createdAt": "2021-07-01T00:00:00.000Z"
     * }
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
    authenticate,
    body('comment')
      .trim()
      .notEmpty()
      .isString()
      .isLength({min: 1})
      .escape(),
    body('recipe_id').notEmpty().isInt({min: 1}).toInt(),
    body('reference_comment_id')
      .optional({nullable: true})
      .isInt({min: 1})
      .toInt(),
    validationErrors,
    commentPost,
  );

commentRouter.route('/byRecipe/:id').get(
  /**
   * @api {get} /comments/byRecipe/:id Get Comments by Recipe ID
   * @apiName GetCommentsByRecipeId
   * @apiGroup commentGroup
   * @apiVersion 1.0.0
   * @apiDescription Get comments by Recipe ID
   * @apiPermission none
   *
   * @apiParam {Number} id Recipe ID
   *
   * @apiSuccess {object[]} comments List of comments
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 1,
   *    "comment": "This is a comment",
   *    "recipe_id": 1,
   *    "user_id": 1,
   *    "reference_comment_id": null,
   *    "createdAt": "2021-07-01T00:00:00.000Z"
   *  }
   * ]
   *
   * @apiError (Error 400) {String} BadRequest Invalid request
   * @apiErrorExample {json} BadRequest
   *    HTTP/1.1 400 Bad Request
   *    {
   *      "error": "Invalid request"
   *    }
   *
   */
  param('id').isInt({min: 1}).toInt(),
  validationErrors,
  commentListByRecipeIdGet,
);

commentRouter.route('/byuser').get(
  /**
   * @api {get} /comments/byuser Get Comments by User
   * @apiName GetCommentsByUser
   * @apiGroup commentGroup
   * @apiVersion 1.0.0
   * @apiDescription Get comments by user
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiSuccess {object[]} comments List of comments
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 1,
   *    "comment": "This is a comment",
   *    "recipe_id": 1,
   *    "user_id": 1,
   *    "reference_comment_id": null,
   *    "createdAt": "2021-07-01T00:00:00.000Z"
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
  authenticate,
  commentListByUserGet,
);

commentRouter.route('/count/:id').get(
  /**
   * @api {get} /comments/count/:id Get Comment Count by Recipe ID
   * @apiName GetCommentCountByRecipeId
   * @apiGroup commentGroup
   * @apiVersion 1.0.0
   * @apiDescription Get comment count by Recipe ID
   * @apiPermission none
   *
   * @apiParam {Number} id Recipe ID
   *
   * @apiSuccess {Number} count Comment count
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *  "count": 1
   * }
   *
   * @apiError (Error 400) {String} BadRequest Invalid request
   * @apiErrorExample {json} BadRequest
   *    HTTP/1.1 400 Bad Request
   *    {
   *      "error": "Invalid request"
   *    }
   */
  param('id').isInt({min: 1}).toInt(),
  validationErrors,
  commentCountByRecipeIdGet,
);

commentRouter
  .route('/:id')
  .get(
    /**
     * @api {get} /comments/:id Get Comment
     * @apiName GetComment
     * @apiGroup commentGroup
     * @apiVersion 1.0.0
     * @apiDescription Get a comment
     * @apiPermission none
     *
     * @apiParam {Number} id Comment ID
     *
     * @apiSuccess {Number} id Comment ID
     * @apiSuccess {String} comment Comment text
     * @apiSuccess {Number} recipe_id Recipe ID
     * @apiSuccess {Number} user_id User ID
     * @apiSuccess {Number} reference_comment_id Reference comment ID
     * @apiSuccess {Date} createdAt Comment creation date
     * @apiSuccess {Date} updatedAt Comment update date
     *
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *  "id": 1,
     *  "comment": "This is a comment",
     *  "recipe_id": 1,
     *  "user_id": 1,
     *  "reference_comment_id": null,
     *  "createdAt": "2021-07-01T00:00:00.000Z"
     * }
     *
     * @apiError (Error 400) {String} BadRequest Invalid request
     * @apiErrorExample {json} BadRequest
     *    HTTP/1.1 400 Bad Request
     *    {
     *      "error": "Invalid request"
     *    }
     *
     */
    param('id').isInt({min: 1}).toInt(),
    validationErrors,
    commentGet,
  )
  .put(
    /**
     * @api {put} /comments/:id Update Comment
     * @apiName UpdateComment
     * @apiGroup commentGroup
     * @apiVersion 1.0.0
     * @apiDescription Update a comment
     * @apiPermission token
     *
     * @apiUse token
     * @apiUse unauthorized
     *
     * @apiParam {Number} id Comment ID
     * @apiBody {String} comment Comment text
     *
     * @apiSuccess {Number} id Comment ID
     * @apiSuccess {String} comment Comment text
     * @apiSuccess {Number} recipe_id Recipe ID
     * @apiSuccess {Number} user_id User ID
     * @apiSuccess {Number} reference_comment_id Reference comment ID
     * @apiSuccess {Date} createdAt Comment creation date
     * @apiSuccess {Date} updatedAt Comment update date
     *
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *  "id": 1,
     *  "comment": "This is a comment",
     *  "recipe_id": 1,
     *  "user_id": 1,
     *  "reference_comment_id": null,
     *  "createdAt": "2021-07-01T00:00:00.000Z"
     * }
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
    authenticate,
    param('id').isInt({min: 1}).toInt(),
    body('comment')
      .trim()
      .notEmpty()
      .isString()
      .isLength({min: 1})
      .escape(),
    validationErrors,
    commentPut,
  )
  .delete(
    /**
     * @api {delete} /comments/:id Delete Comment
     * @apiName DeleteComment
     * @apiGroup commentGroup
     * @apiVersion 1.0.0
     * @apiDescription Delete a comment
     * @apiPermission token
     *
     * @apiUse token
     * @apiUse unauthorized
     *
     * @apiParam {Number} id Comment ID
     *
     * @apiSuccess {String} message Success message
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *  "message": "Comment deleted successfully"
     * }
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
    authenticate,
    param('id').isInt({min: 1}).toInt(),
    validationErrors,
    commentDelete,
  );

export default commentRouter;
