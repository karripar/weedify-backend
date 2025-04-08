import express from 'express';
import {
  notificationDeleteOld,
  notificationListByUserGet,
  notificationMarkAsArchived,
  notificationMarkAsRead,
  notificationCheckEnabled,
  notificationToggleEnabled,
} from '../controllers/notificationController'
import {authenticate, validationErrors} from '../../middlewares';
import {param} from 'express-validator';

const notificationRouter = express.Router();

/**
 * @apiDefine notificationGroup Notifications
 * All the APIs related to notifications
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

notificationRouter
  .route('/user')
  .get(
    /**
     * @api {get} /notifications/user Get Notifications
     * @apiName GetNotifications
     * @apiGroup notificationGroup
     * @apiVersion 1.0.0
     * @apiDescription Get all notifications for a user
     * @apiPermission token
     *
     * @apiUse token
     *
     * @apiSuccess {object[]} notifications List of notifications
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * [
     *  {
     *    "id": 1,
     *    "user_id": 1,
     *    "text": "Notification text",
     *    "notification_type_id": 1,
     *    "is_read": false,
     *    "is_archived": false,
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
    notificationListByUserGet,
  )

notificationRouter
  .route('/user/:id')
  .put(
    /**
     * @api {put} /notifications/user/:id Mark Notification as Read
     * @apiName MarkNotificationAsRead
     * @apiGroup notificationGroup
     * @apiVersion 1.0.0
     * @apiDescription Mark a notification as read
     * @apiPermission token
     * @apiHeader {String} Authorization Bearer token
     *
     * @apiUse token
     * @apiUse unauthorized
     *
     * @apiParam {Number} id Notification ID
     *
     * @apiSuccess {String} message Success message
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "message": "Notification marked as read"
     * }
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     * @apiError (Error 500) {String} InternalServerError Error marking notification as read
     * @apiErrorExample {json} InternalServerError
     *   HTTP/1.1 500 InternalServerError
     *  {
     *   "error": "Error marking notification as read"
     * }
     */
    authenticate,
    param('id').isNumeric().withMessage('id must be a number'),
    validationErrors,
    notificationMarkAsRead,
  );

notificationRouter
  .route('/user/:id/archive')
  .put(
    /**
     * @api {put} /notifications/user/:id/archive Mark Notification as Archived
     * @apiName MarkNotificationAsArchived
     * @apiGroup notificationGroup
     * @apiVersion 1.0.0
     * @apiDescription Mark a notification as archived
     * @apiPermission token
     * @apiHeader {String} Authorization Bearer token
     *
     * @apiUse token
     * @apiUse unauthorized
     *
     * @apiParam {Number} id Notification ID
     *
     * @apiSuccess {String} message Success message
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "message": "Notification marked as archived"
     * }
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     * @apiError (Error 500) {String} InternalServerError Error marking notification as archived
     * @apiErrorExample {json} InternalServerError
     *   HTTP/1.1 500 InternalServerError
     *  {
     *   "error": "Error marking notification as archived"
     * }
     */
    authenticate,
    param('id').isNumeric().withMessage('id must be a number'),
    validationErrors,
    notificationMarkAsArchived,
  );

notificationRouter
  .route('/delete/old')
  .delete(
    /**
     * @api {delete} /notifications/delete/old Delete Old Notifications
     * @apiName DeleteOldNotifications
     * @apiGroup notificationGroup
     * @apiVersion 1.0.0
     * @apiDescription Delete old notifications
     * @apiPermission token
     * @apiHeader {String} Authorization Bearer token
     *
     * @apiUse token
     * @apiUse unauthorized
     *
     * @apiSuccess {String} message Success message
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "message": "Old notifications deleted successfully"
     * }
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     * @apiError (Error 500) {String} InternalServerError Error deleting old notifications
     * @apiErrorExample {json} InternalServerError
     *   HTTP/1.1 500 InternalServerError
     *  {
     *   "error": "Error deleting old notifications"
     * }
     */
    authenticate,
    notificationDeleteOld,
  );


notificationRouter
.route('/user/enabled/:id')
.get(
  /**
   * @api {get} /notifications/user/enabled/:id Check if Notifications are Enabled
   * @apiName CheckNotificationsEnabled
   * @apiGroup notificationGroup
   * @apiVersion 1.0.0
   * @apiDescription Check if notifications are enabled for a user
   * @apiPermission none
   *
   * @apiParam {Number} id User ID
   *
   * @apiSuccess {Boolean} enabled Notifications enabled status
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *   "enabled": true
   * }
   *
   * @apiError (Error 404) {String} NotFound User not found
   * @apiErrorExample {json} NotFound
   *   HTTP/1.1 404 NotFound
   *  {
   *  "error": "User not found"
   *  }
   * @apiError (Error 500) {String} InternalServerError Error checking notifications enabled status
   * @apiErrorExample {json} InternalServerError
   *  HTTP/1.1 500 InternalServerError
   * {
   *  "error": "Error checking notifications enabled status"
   * }
   */
  param('id').isNumeric().withMessage('id must be a number'),
  validationErrors,
  notificationCheckEnabled
)

notificationRouter
.route('/toggle-enabled')
.put(
  /**
   * @api {put} /notifications/user/enabled Toggle Notifications Enabled
   * @apiName ToggleNotificationsEnabled
   * @apiGroup notificationGroup
   * @apiVersion 1.0.0
   * @apiDescription Toggle notifications enabled status for a user. Status is set to true or false based on query made in the backend.
   * @apiPermission token
   * @apiHeader {String} Authorization Bearer token
   *
   * @apiUse token
   * @apiUse unauthorized
   *
   * @apiSuccess {String} message Success message
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *  "message": "Settings updated successfully"
   * }
   *
   * @apiError (Error 400) {String} BadRequest Invalid request body
   * @apiErrorExample {json} BadRequest
   *   HTTP/1.1 400 BadRequest
   * {
   *  "error": "Invalid request body"
   * }
   *
   * @apiError (Error 404) {String} NotFound User not found
   * @apiErrorExample {json} NotFound
   *   HTTP/1.1 404 NotFound
   *  {
   *  "error": "User not found"
   *  }
   * @apiError (Error 500) {String} InternalServerError Error toggling notifications enabled status
   * @apiErrorExample {json} InternalServerError
   *  HTTP/1.1 500 InternalServerError
   * {
   *  "error": "Error toggling notifications enabled status"
   * }
   */
  authenticate,
  notificationToggleEnabled
)

export default notificationRouter;
