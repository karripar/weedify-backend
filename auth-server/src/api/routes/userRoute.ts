import express from 'express';
import {body, param} from 'express-validator';
import {
  userByUsernameGet,
  userByIdGet,
  usersGet,
  userPost,
  checkEmailExists,
  checkUsernameExists,
  deleteUserAsAdmin,
  checkToken,
  deleteUserAsUser,
  profilePictureGet,
  profilePicByIdGet,
  profilePicPost,
  profilePicturePut,
} from '../controllers/userController';
import {authenticate, validationErrors} from '../../middlewares';

const router = express.Router();

/**
 * @apiDefine UserGroup User API Endpoints
 * All user related endpoints.
 */

/**
 * @apiDefine token Autentication required in the form of a token
 * This endpoint requires a token to be passed in the header
 * in the form
 * `Authorization: Bearer <token>`
 * @apiHeader {String} Authorization Bearer <token>
 */

/**
 * @apiDefine unauthorized Unauthorized
 * @apiError (Error 401) Unauthorized The user is not authorized to access this endpoint
 * @apiErrorExample {json} Unauthorized
 *    HTTP/1.1 401 Unauthorized
 *    {
 *      "error": "Unauthorized"
 *    }
 */

router.get(
  /**
   * @api {get} / Get all users
   * @apiName GetUsers
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Get all users
   * @apiPermission none
   *
   * @apiSuccess {Object[]} users Array of user objects
   * @apiSuccess {Number} users.id User id
   * @apiSuccess {String} users.username Username of the user
   * @apiSuccess {String} users.email Email of the user
   * @apiSuccess {String} users.created_at Date the user was created
   * @apiSuccess {String} users.level_name User level name
   * @apiSuccess {String} users.filename Profile picture filename
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "users": [
   *        {
   *          "id": 1,
   *          "username": "username",
   *          "email": "test@user.com"
   *          "created_at": "2021-01-01T00:00:00.000Z",
   *          "level_name": "User",
   *          "filename": "profile.jpg"
   *       }
   *    ]
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/',
  usersGet,
);

router.get(
  /**
   * @api {get} /:username Get user by username
   * @apiName GetUserByUsername
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Get user by username
   * @apiPermission none
   *
   * @apiParam {String} username Username of the user
   *
   * @apiSuccess {Object} user User object
   * @apiSuccess {Number} user.id User id
   * @apiSuccess {String} user.username Username of the user
   * @apiSuccess {String} user.email Email of the user
   * @apiSuccess {String} user.created_at Date the user was created
   * @apiSuccess {String} user.level_name User level name
   * @apiSuccess {String} user.filename Profile picture filename
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "user": {
   *        "id": 1,
   *        "username": "username",
   *        "email": "test@user.com",
   *        "created_at": "2021-01-01T00:00:00.000Z",
   *        "level_name": "User",
   *        "filename": "profile.jpg"
   *      }
   *    }
   *
   * @apiError (Error 404) UserNotFound The user was not found
   * @apiErrorExample {json} UserNotFound
   *    HTTP/1.1 404 Not Found
   *    {
   *      "error": "User not found"
   *    }
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *    HTTP/1.1 422 Unprocessable Entity
   *    {
   *      "error": "Validation error"
   *    }
   *
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   *    HTTP/1.1 500 Internal Server Error
   *   {
   *    "error": "Internal server error"
   *  }
   *
   */
  '/username/:username',
  param('username').isString(),
  validationErrors,
  userByUsernameGet,
);

router.get(
  /**
   * @api {get} /id/:id Get user by id
   * @apiName GetUserById
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Get user by id
   * @apiPermission none
   *
   * @apiParam {Number} id User id
   *
   * @apiSuccess {Object} user User object
   * @apiSuccess {Number} user.id User id
   * @apiSuccess {String} user.username Username of the user
   * @apiSuccess {String} user.email Email of the user
   * @apiSuccess {String} user.created_at Date the user was created
   * @apiSuccess {String} user.level_name User level name
   * @apiSuccess {String} user.filename Profile picture filename
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "user": {
   *        "id": 1,
   *        "username": "username",
   *        "email": "test@user.com",
   *        "created_at": "2021-01-01T00:00:00.000Z",
   *        "level_name": "User",
   *        "filename": "profile.jpg"
   *      }
   *    }
   *
   * @apiError (Error 404) UserNotFound The user was not found
   * @apiErrorExample {json} UserNotFound
   *    HTTP/1.1 404 Not Found
   *    {
   *      "error": "User not found"
   *    }
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *    HTTP/1.1 422 Unprocessable Entity
   *    {
   *      "error": "Validation error"
   *    }
   *
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   *    HTTP/1.1 500 Internal Server Error
   *   {
   *    "error": "Internal server error"
   *  }
   *
   */
  '/user/:id',
  param('id').isNumeric(),
  validationErrors,
  userByIdGet,
);

router.get(
  /**
   * @api {get} /profilepicture/:user_id Get user profile picture
   * @apiName GetUserProfilePicture
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Get user profile picture
   * @apiPermission none
   *
   * @apiParam {Number} user_id User id
   *
   * @apiSuccess {Object} Profile picture object
   * @apiSuccess {String} filepath Profile picture filename
   * @apiSuccess {String} user_id User id
   * @apiSuccess {String} created_at Date the profile picture was created
   * @apiSuccess {String} profile_picture_id Profile picture id
   * @apiSuccess {String} filesize Profile picture filesize
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *  {
   *   "filename": "profile.jpg",
   *   "user_id": 1,
   *   "created_at": "2021-01-01T00:00:00.000Z",
   *   "profile_picture_id": 1,
   *   "filesize": "1000"
   * }
   *
   * @apiError (Error 404) ProfilePictureNotFound The profile picture was not found
   * @apiErrorExample {json} ProfilePictureNotFound
   *   HTTP/1.1 404 Not Found
   * {
   * "error": "Profile picture not found"
   * }
   *
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *  HTTP/1.1 422 Unprocessable Entity
   * {
   * "error": "Validation error"
   * }
   *
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/profilepicture/:user_id',
  param('user_id').isNumeric(),
  validationErrors,
  profilePictureGet,
);

router.get(
  /**
   * @api {get} /profilepicture/id/:profile_picture_id Get profile picture by id
   * @apiName GetProfilePictureById
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Get profile picture by id
   * @apiPermission none
   *
   * @apiParam {Number} profile_picture_id Profile picture id
   *
   * @apiSuccess {Object} Profile picture object
   * @apiSuccess {String} filepath Profile picture filename
   * @apiSuccess {String} user_id User id
   * @apiSuccess {String} created_at Date the profile picture was created
   * @apiSuccess {String} profile_picture_id Profile picture id
   * @apiSuccess {String} filesize Profile picture filesize
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *  {
   *   "filename": "profile.jpg",
   *   "user_id": 1,
   *   "created_at": "2021-01-01T00:00:00.000Z",
   *   "profile_picture_id": 1,
   *   "filesize": "1000"
   * }
   *
   * @apiError (Error 404) ProfilePictureNotFound The profile picture was not found
   * @apiErrorExample {json} ProfilePictureNotFound
   *   HTTP/1.1 404 Not Found
   * {
   * "error": "Profile picture not found"
   * }
   *
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *  HTTP/1.1 422 Unprocessable Entity
   * {
   * "error": "Validation error"
   * }
   *
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/profilepicture/id/:picture_id',
  param('picture_id').isNumeric(),
  validationErrors,
  profilePicByIdGet,
);


router.post(
  /**
   * @api {post} /profilepicture Post profile picture
   * @apiName PostProfilePicture
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Post profile picture
   * @apiPermission token
   *
   * @apiBody {String} filename Profile picture filename
   * @apiBody {String} filesize Profile picture filesize
   *
   * @apiSuccess {Object} Profile picture object
   * @apiSuccess {String} filepath Profile picture filename
   * @apiSuccess {String} user_id User id
   * @apiSuccess {String} created_at Date the profile picture was created
   * @apiSuccess {String} profile_picture_id Profile picture id
   * @apiSuccess {String} filesize Profile picture filesize
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *  {
   *   "filename": "profile.jpg",
   *   "user_id": 1,
   *   "created_at": "2021-01-01T00:00:00.000Z",
   *   "profile_picture_id": 1,
   *   "filesize": "1000"
   * }
   *
   * @apiError (Error 401) Unauthorized The user is not authorized to access this endpoint
   * @apiErrorExample {json} Unauthorized
   *  HTTP/1.1 401 Unauthorized
   * {
   * "error": "Unauthorized"
   * }
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *  HTTP/1.1 422 Unprocessable Entity
   * {
   * "error": "Validation error"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/profilepicture',
  authenticate,
  body('filename').isString(),
  body('filesize').isString(),
  validationErrors,
  profilePicPost,
);


router.put(
  /**
   * @api {put} /profilepicture Update profile picture
   * @apiName UpdateProfilePicture
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Update profile picture
   * @apiPermission token
   *
   * @apiBody {String} filename Profile picture filename
   * @apiBody {String} filesize Profile picture filesize
   *
   * @apiSuccess {Object} Profile picture object
   * @apiSuccess {String} filepath Profile picture filename
   * @apiSuccess {String} user_id User id
   * @apiSuccess {String} created_at Date the profile picture was created
   * @apiSuccess {String} profile_picture_id Profile picture id
   * @apiSuccess {String} filesize Profile picture filesize
   *
   * @apiSuccessExample {json} Success-Response:
   *   HTTP/1.1 200 OK
   *  {
   *   "filename": "profile.jpg",
   *   "user_id": 1,
   *   "created_at": "2021-01-01T00:00:00.000Z",
   *   "profile_picture_id": 1,
   *   "filesize": "1000"
   * }
   *
   * @apiError (Error 401) Unauthorized The user is not authorized to access this endpoint
   * @apiErrorExample {json} Unauthorized
   *  HTTP/1.1 401 Unauthorized
   * {
   * "error": "Unauthorized"
   * }
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *  HTTP/1.1 422 Unprocessable Entity
   * {
   * "error": "Validation error"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/profilepicture',
  authenticate,
  body('filename').isString(),
  body('filesize').isString(),
  validationErrors,
  profilePicturePut,
);


router.post(
  /**
   * @api {post} / Create user
   * @apiName CreateUser
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Create user
   * @apiPermission none
   *
   * @apiBody {String} username Username of the user
   * @apiBody {String} email Email of the user
   * @apiBody {String} password Password of the user
   *
   * @apiSuccess {Object} user User object
   * @apiSuccess {Number} user.id User id
   * @apiSuccess {String} user.username Username of the user
   * @apiSuccess {String} user.email Email of the user
   * @apiSuccess {String} user.created_at Date the user was created
   * @apiSuccess {String} user.level_name User level name
   * @apiSuccess {String} user.filename Profile picture filename
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "user": {
   *        "id": 1,
   *        "username": "username",
   *        "email": "test@user.com",
   *        "created_at": "2021-01-01T00:00:00.000Z",
   *        "level_name": "User",
   *        "filename": ""
   *     }
   *   }
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *   HTTP/1.1 422 Unprocessable Entity
   *  {
   *  "error": "Validation error"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   *  HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   * @apiError (Error 409) Conflict The user already exists
   * @apiErrorExample {json} Conflict
   *  HTTP/1.1 409 Conflict
   * {
   * "error": "User already exists"
   * }
   *
   */
  '/',
  body('username')
    .isString()
    .trim()
    .isLength({min: 3, max: 20})
    .withMessage('Username must be between 3 and 20 characters')
    .escape(),
  body('email')
    .isEmail()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .isString()
    .isLength({min: 8})
    .withMessage('Password must be at least 8 characters'),
  validationErrors,
  userPost,
);

router.get(
  /**
   * @api {get} /email/:email Check if email exists
   * @apiName CheckEmailExists
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Check if email exists
   * @apiPermission none
   *
   * @apiParam {String} email Email of the user
   *
   * @apiSuccess {Object} exists Object with exists property
   * @apiSuccess {Boolean} exists.exists True if email exists, false if not
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "exists": true
   *   }
   *  @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *  HTTP/1.1 422 Unprocessable Entity
   * {
   * "error": "Validation error"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/email/:email',
  param('email').isEmail().normalizeEmail(),
  validationErrors,
  checkEmailExists,
);

router.get(
  /**
   * @api {get} /username/:username Check if username exists
   * @apiName CheckUsernameExists
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Check if username exists
   * @apiPermission none
   *
   * @apiParam {String} username Username of the user
   *
   * @apiSuccess {Object} exists Object with exists property
   * @apiSuccess {Boolean} exists.exists True if username exists, false if not
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "exists": true
   *   }
   *  @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *  HTTP/1.1 422 Unprocessable Entity
   * {
   * "error": "Validation error"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/username/:username',
  param('username').isString(),
  validationErrors,
  checkUsernameExists,
);

router.delete(
  /**
   * @api {delete} /id/:id Delete user as admin
   * @apiName DeleteUserAsAdmin
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Delete user as admin
   * @apiPermission token
   *
   * @apiParam {Number} id User id
   *
   * @apiSuccess {Object} message Object with message property
   * @apiSuccess {String} message.message Message
   * @apiSuccess {Number} message.user_id User id
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "message": "User deleted successfully",
   *      "user_id": 1
   *   }
   *  @apiError (Error 401) Unauthorized The user is not authorized to access this endpoint
   * @apiErrorExample {json} Unauthorized
   *  HTTP/1.1 401 Unauthorized
   * {
   * "error": "Unauthorized"
   * }
   * @apiError (Error 422) ValidationError Validation error
   * @apiErrorExample {json} ValidationError
   *  HTTP/1.1 422 Unprocessable Entity
   * {
   * "error": "Validation error"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/id',
  authenticate,
  param('id').isNumeric(),
  validationErrors,
  deleteUserAsAdmin,
);

router.delete(
  /**
   * @api {delete} / Delete user as user
   * @apiName DeleteUserAsUser
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Delete user as user
   * @apiPermission token
   *
   * @apiSuccess {Object} message Object with message property
   * @apiSuccess {String} message.message Message
   * @apiSuccess {Number} message.user_id User id
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "message": "User deleted successfully",
   *      "user_id": 1
   *   }
   *  @apiError (Error 401) Unauthorized The user is not authorized to access this endpoint
   * @apiErrorExample {json} Unauthorized
   *  HTTP/1.1 401 Unauthorized
   * {
   * "error": "Unauthorized"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/',
  authenticate,
  deleteUserAsUser,
);

router.get(
  /**
   * @api {get} /token Check token and return user
   * @apiName CheckToken
   * @apiGroup UserGroup
   * @apiVersion 1.0.0
   * @apiDescription Check token
   * @apiPermission token
   *
   * @apiSuccess {Object} object with user and token properties
   * @apiSuccess {String} token Token
   *
   * @apiSuccessExample {json} Success-Response:
   *    HTTP/1.1 200 OK
   *    {
   *      "message": "Token is valid",
   *      "user": {
   *        "id": 1,
   *        "username": "username",
   *        "email": "test@user.com",
   *        "created_at": "2021-01-01T00:00:00.000Z",
   *        "level_name": "User",
   *        "filename": "profile.jpg"
   *      }
   *   }
   *  @apiError (Error 401) Unauthorized The user is not authorized to access this endpoint
   * @apiErrorExample {json} Unauthorized
   *  HTTP/1.1 401 Unauthorized
   * {
   * "error": "Unauthorized"
   * }
   * @apiError (Error 500) InternalServerError Internal server error
   * @apiErrorExample {json} InternalServerError
   * HTTP/1.1 500 Internal Server Error
   * {
   * "error": "Internal server error"
   * }
   *
   */
  '/token',
  authenticate,
  checkToken,
);

export default router;
