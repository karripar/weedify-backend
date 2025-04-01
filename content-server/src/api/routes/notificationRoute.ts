import express from 'express';
import {
  notificationDeleteOld,
  notificationListByUserGet,
  notificationMarkAsArchived,
  notificationMarkAsRead,
  notificationPost,
} from '../controllers/notificationController'
import {authenticate, validationErrors} from '../../middlewares';
import {body, param} from 'express-validator';

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
  .post(
    /**
     * @api {post} /notifications/user Create Notification
     * @apiName CreateNotification
     * @apiGroup notificationGroup
     * @apiVersion 1.0.0
     * @apiDescription Create a new notification
     * @apiPermission token
     * @apiHeader {String} Authorization Bearer token
     *
     * @apiUse token
     * @apiUse unauthorized
     *
     * @apiBody {Number} notification_text Notification text
     * @apiBody {Number} user_id User ID
     * @apiBody {Number} notification_type_id Notification type ID
     *
     * @apiSuccess {String} message Success message
     * @apiSuccessExample {json} Success-Response:
     * HTTP/1.1 200 OK
     * {
     *   "message": "Notification created successfully"
     * }
     *
     * @apiError (Error 401) {String} Unauthorized User is not authorized to access the resource
     * @apiErrorExample {json} Unauthorized
     *   HTTP/1.1 401 Unauthorized
     *  {
     *   "error": "Unauthorized"
     * }
     * @apiError (Error 500) {String} InternalServerError Error creating notification
     * @apiErrorExample {json} InternalServerError
     *   HTTP/1.1 500 InternalServerError
     *  {
     *   "error": "Error creating notification"
     * }
     */
    authenticate,
    body('user_id').isNumeric().withMessage('user_id must be a number'),
    body('text').isString().withMessage('text must be a string'),
    body('notification_type_id')
      .isNumeric()
      .withMessage('notification_type_id must be a number'),
    validationErrors,
    notificationPost,
  );

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

export default notificationRouter;
