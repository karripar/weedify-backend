import express from 'express';
import {authenticate, validationErrors} from '../../middlewares';
import {body, param} from 'express-validator';
import {
  getFollowersByUserId,
  getFollowedUsersByUserId,
  getFollowedUsersByToken,
  getFollowersByToken,
  postFollow,
  deleteFollow,
  getFollowedUsersByUsername,
  getFollowersByUsername,
} from '../controllers/followController';

const followRouter = express.Router();

/**
 * @apiDefine followGroup Follow API
 * All the APIs related to follows
 */

/**
 * @apiDefine token Authentication required in the form of a token
 * token should be passed in the header as a Bearer token
 * @apiHeader {String} Authorization token
 * @apiExample {json} Header-Example:
 * {
 *  "Authorization": "Bearer <token>"
 * }
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

followRouter.route('/').post(
  /**
   * @api {post} /follows Follow User
   * @apiName FollowUser
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Follow a user
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiBody {Number} user_id User ID
   *
   * @apiSuccess {Number} follow_id Follow ID
   * @apiSuccess {Number} user_id User ID
   * @apiSuccess {Number} followed_user_id Followed user ID
   * @apiSuccess {Date} createdAt Date of creation
   *
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *  "follow_id": 1,
   *  "follower_id": 1,
   *  "followed_id": 2,
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
  body('user_id').isInt({min: 1}).toInt(),
  validationErrors,
  postFollow,
);

followRouter.route('/byuser/followed/:user_id').get(
  /**
   * @api {get} /follows/byuser/followed/:user_id Get Followed Users by User Id
   * @apiName GetFollowedUsersByUser
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Get followed users by user ID
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiParam {Number} user_id User ID
   *
   * @apiSuccess {object[]} followed_users List of followed users
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 2,
   *    "username": "user2"
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
  param('user_id').isInt({min: 1}).toInt(),
  validationErrors,
  getFollowedUsersByUserId,
);

followRouter.route('/byuser/followers/:user_id').get(
  /**
   * @api {get} /follows/byuser/followers/:user_id Get Followers by User
   * @apiName GetFollowersByUser
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Get followers by user
   * @apiPermission token
   *
   * @apiUse token
   *
   * @apiParam {Number} user_id User ID
   *
   * @apiSuccess {object[]} followers List of followers
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 1,
   *    "username": "user1"
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
   */
  param('user_id').isInt({min: 1}).toInt(),
  validationErrors,
  getFollowersByUserId,
);

followRouter.route('/byusername/followed/:username').get(
  /**
   * @api {get} /follows/byusername/followed/:username Get Followed Users by Username
   * @apiName GetFollowedUsersByUsername
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Get followed users by username
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiParam {String} username Username
   *
   * @apiSuccess {object[]} followed_users List of followed users
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 2,
   *    "username": "user2"
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
   */
  param('username').isString().trim().escape(),
  getFollowedUsersByUsername,
);

followRouter.route('/byusername/followers/:username').get(
  /**
   * @api {get} /follows/byusername/followers/:username Get Followers by Username
   * @apiName GetFollowersByUsername
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Get followers by username
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiParam {String} username Username
   *
   * @apiSuccess {object[]} followers List of followers
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 1,
   *    "username": "user1"
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
   */
  param('username').isString().trim().escape(),
  getFollowersByUsername,
);

followRouter.route('/bytoken/followed').get(
  /**
   * @api {get} /follows/bytoken/followed Get Followed Users with Token
   * @apiName GetFollowedUsersByToken
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Get followed users by token
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiSuccess {object[]} followed_users List of followed users
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 2,
   *    "username": "user2"
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
  authenticate,
  getFollowedUsersByToken,
);

followRouter.route('/bytoken/followers').get(
  /**
   * @api {get} /follows/bytoken/followers Get Followers by Token
   * @apiName GetFollowersByToken
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Get followers by token
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiSuccess {object[]} followers List of followers
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [
   *  {
   *    "id": 1,
   *    "username": "user1"
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
  authenticate,
  getFollowersByToken,
);

followRouter.route('/:follow_id').delete(
  /**
   * @api {delete} /follows/:follow_id Unfollow User
   * @apiName UnfollowUser
   * @apiGroup followGroup
   * @apiVersion 1.0.0
   * @apiDescription Unfollow a user
   * @apiPermission token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiParam {Number} follow_id Follow ID
   *
   * @apiSuccess {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *  "message": "Unfollowed successfully"
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
  param('follow_id').isInt({min: 1}).toInt(),
  validationErrors,
  deleteFollow,
);

export default followRouter;
