import {Request, Response, NextFunction} from 'express';
import {
  fetchNotificationByUserId,
  postNotification,
  markAsRead,
  markAsArchived,
  deleteOldNotifications,
  checkNotificationsEnabled,
  toggleNotificationsEnabled,
} from '../models/notificationModel';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import {Notification, TokenContent} from 'hybrid-types/DBTypes';


// list of notifications by user id
const notificationListByUserGet = async (
  req: Request<{id: string}, Notification[]>,
  res: Response<Notification[], {user: TokenContent}>,
  next: NextFunction,
) => {
  try {
    const notifications = await fetchNotificationByUserId(
      Number(res.locals.user.user_id),
      true);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

// create a new notification
const notificationPost = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const {user_id, text, typeId} = req.body;
    const response = await postNotification(user_id, text, typeId);
    res.json(response);
  } catch (error) {
    next(error);
  }
}


// mark a notification as read
const notificationMarkAsRead = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const response = await markAsRead(Number(req.params.id));
    res.json(response);
  } catch (error) {
    next(error);
  }
}

// mark a notification as archived
const notificationMarkAsArchived = async (
  req: Request<{id: string}>,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const response = await markAsArchived(Number(req.params.id));
    res.json(response);
  } catch (error) {
    next(error);
  }
}

// delete old notifications
const notificationDeleteOld = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const response = await deleteOldNotifications();
    res.json(response);
  } catch (error) {
    next(error);
  }
}

// check if notifications are enabled
const notificationCheckEnabled = async (
  req: Request,
  res: Response<{enabled: boolean}>,
  next: NextFunction,
) => {
  try {
    const user_id = Number(req.params.id)
    const enabled = await checkNotificationsEnabled(user_id);
    res.json({enabled});
  } catch (error) {
    next(error);
  }
}

// toggle notifications enabled
const notificationToggleEnabled = async (
  req: Request,
  res: Response<MessageResponse>,
  next: NextFunction,
) => {
  try {
    const user_id = Number(res.locals.user.user_id);
    const enabled = await toggleNotificationsEnabled(user_id);
    res.json(enabled);
  } catch (error) {
    next(error);
  }
}

export {
  notificationListByUserGet,
  notificationPost,
  notificationMarkAsRead,
  notificationMarkAsArchived,
  notificationDeleteOld,
  notificationCheckEnabled,
  notificationToggleEnabled,
};
