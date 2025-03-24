import express from 'express';
import Login from '../controllers/authController';
import { body } from 'express-validator';
import { validationErrors } from '../../middlewares';
const router = express.Router();

/**
 * @apiDefine AuthGroup Auth
 * All routes related to authentication
 */

/**
 * @apiDefine token Authentication required in the form of a token
 * @apiHeader {String} Authorization Bearer token
 */

/**
 * @apiDefine unauthorized Unauthorized
 * @apiError (401) {String} Unauthorized User is not authorized to access this route
 *@apiErrorExample {json} Unauthorized:
 * {
 *  "message": "Unauthorized"
 * }
 */

router.post(
  /**
   * @api {post} /auth/login Login
   * @apiName Login
   * @apiGroup AuthGroup
   * @apiVersion  1.0.0
   * @apiDescription Login to the application
   * @apiPermission none
   *
   * @apiBody {String} email User's email
   * @apiBody {String} password User's password
   *
   * @apiSuccess (200) {object} user User object
   * @apiSuccess (200) {string} token JWT token
   * @apiSuccess (200) {string} message Success message
   *
   * @apiSuccessExample {json} Success-Response:
   * {
   *  "message": "Login successful",
   *  "token": "fjsjfiesfjsefaåmdcweir9wfnsosdkfsefijsfpojfej"
   *  "user": {
   *    "user_id": 1,
   *    "username": "user",
   *    "bio": "I am a user",
   *    "email": "test@user.com",
   *    "created_at": "2021-01-01T00:00:00.000Z",
   *    "level_name": "User"
   *  }
   * }
   *
   * @apiError (400) {String} Invalid credentials Invalid credentials
   * @apiError (500) {String} Internal server error, JWT_SECRET not set Internal server error, JWT_SECRET not set
   *
   * @apiErrorExample {json} Invalid credentials:
   * {
   *  "message": "Invalid credentials"
   * }
   *
   * @apiErrorExample {json} Internal server error, JWT_SECRET not set:
   * {
   *  "message": "Internal server error, JWT_SECRET not set"
   * }
   *
   * @apiError (400) {String} Invalid email or password Invalid email or password
   * @apiErrorExample {json} Invalid email or password:
   * {
   *  "message": "Invalid email or password"
   * }
   *
   * @apiError (500) {String} Internal server error Internal server error
   * @apiErrorExample {json} Internal server error:
   * {
   *  "message": "Internal server error"
   * }
   */
  '/login',
  body('email')
    .isString()
    .isEmail()
    .escape()
    .isLength({ min: 5, max: 255 })
    .withMessage('Invalid email'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 255 })
    .withMessage('Invalid password'),
  validationErrors,
  Login,
);

export default router;
