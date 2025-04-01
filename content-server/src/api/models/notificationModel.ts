import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Notification } from 'hybrid-types/DBTypes';
import { promisePool } from '../../lib/db';
import { MessageResponse } from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import { ERROR_MESSAGES } from '../../utils/errorMessages';


// Request a list of notifications for a user

const fetchNotificationByUserId = async (
  user_id: number,
  onlyUnread: boolean = false,
) : Promise<Notification[]> => {
  const sql = `
    SELECT n.notification_id, n.notification_text, n.is_read, n.is_archived, n.created_at, nt.type_name
    FROM Notifications n
    JOIN NotificationTypes nt ON n.notification_type_id = nt.notification_type_id
    WHERE n.user_id = ?
    ${onlyUnread ? "AND n.is_read = FALSE" : ""}
    ORDER BY n.created_at DESC`;

  const [rows] = await promisePool.execute<RowDataPacket[] & Notification[]>(sql, [user_id]);
  return rows;
};

// Post a new notification
const postNotification = async (
  user_id: number,
  text: string,
  typeId: number,
): Promise<MessageResponse> => {
  const sql = `
    INSERT INTO Notifications (user_id, notification_text, notification_type_id)
    VALUES (?, ?, ?)`;
  const params = [user_id, text, typeId];
  const [result] = await promisePool.execute<ResultSetHeader>(sql, params);

  if (!result.affectedRows) {
    throw new CustomError(ERROR_MESSAGES.NOTIFICATION.NOT_CREATED, 500);
  }
  return {
    message: "Notification created successfully",
  };
};

// Mark a notification as read
const markAsRead = async (
  notification_id: number,
): Promise<MessageResponse> => {
  const sql = `
    UPDATE Notifications
    SET is_read = TRUE
    WHERE notification_id = ?`;
  const params = [notification_id];
  const [result] = await promisePool.execute<ResultSetHeader>(sql, params);
  if (!result.affectedRows) {
    throw new CustomError(ERROR_MESSAGES.NOTIFICATION.NOT_UPDATED, 500);
  }
  return {
    message: "Notification marked as read",
  };
};

// Mark a notification as archived
const markAsArchived = async (
  notification_id: number,
): Promise<MessageResponse> => {
  const sql = `
    UPDATE Notifications
    SET is_archived = TRUE
    WHERE notification_id = ?`;
  const params = [notification_id];
  const [result] = await promisePool.execute<ResultSetHeader>(sql, params);
  if (!result.affectedRows) {
    throw new CustomError(ERROR_MESSAGES.NOTIFICATION.NOT_UPDATED, 500);
  }
  return {
    message: "Notification marked as archived",
  };
};


// delete old notifications
const deleteOldNotifications = async (): Promise<MessageResponse> => {
  const sql = `
    DELETE FROM Notifications
    WHERE is_archived = TRUE
    AND created_at < NOW() - INTERVAL 30 DAY`;
  const [result] = await promisePool.execute<ResultSetHeader>(sql);
  if (!result.affectedRows) {
    throw new CustomError(ERROR_MESSAGES.NOTIFICATION.NOT_DELETED, 500);
  }
  return {
    message: "Old notifications deleted successfully",
  };
};



export {
  fetchNotificationByUserId,
  postNotification,
  markAsRead,
  markAsArchived,
  deleteOldNotifications,
}
