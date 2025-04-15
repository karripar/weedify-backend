import {Notification} from 'hybrid-types/DBTypes';
import request from 'supertest';
import {Application} from 'express';
import { MessageResponse } from 'hybrid-types/MessageTypes';

const checkIfNotificationsEnabled = (
  url: string | Application,
  user_id: number,
): Promise<{enabled: boolean}> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/notifications/user/enabled/${user_id}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const enabled: {enabled: boolean} = response.body;
          expect(enabled.enabled).toBe(true);
          resolve(enabled);
        }
      });
  });
}

const getUserNotifications = (
  url: string | Application,
  token: string,
): Promise<Notification[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get('/api/v1/notifications/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const notifications: Notification[] = response.body;
          expect(Array.isArray(notifications)).toBe(true);
          notifications.forEach((notification) => {
            expect(notification.notification_id).toBeGreaterThan(0);
            expect(notification.user_id).toBeGreaterThan(0);
            expect(notification.notification_type_id).toBeGreaterThan(0);
            expect(notification.notification_text).not.toBe('');
            expect(notification.created_at).not.toBe('');
            expect(notification.is_read).toBe(0);
            expect(notification.is_archived).toBe(0);
          });
          resolve(notifications);
        }
      });
  });
}


const getAllNotifications = (
  url: string | Application,
): Promise<Notification[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get('/api/v1/notifications')
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const notifications: Notification[] = response.body;
          expect(Array.isArray(notifications)).toBe(true);
          notifications.forEach((notification) => {
            expect(notification.notification_id).toBeGreaterThan(0);
            expect(notification.user_id).toBeGreaterThan(0);
            expect(notification.notification_text).not.toBe('');
            expect(notification.created_at).not.toBe('');
            expect(notification.is_read).toBe(0);
            expect(notification.is_archived).toBe(0);
          });
          resolve(notifications);
        }
      });
  });
}


const MarkNotificationAsArchived = (
  url: string | Application,
  notificationId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .put(`/api/v1/notifications/user/${notificationId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Notification marked as archived');
          resolve(message);
        }
      });
  });
}

const MarkNotificationAsRead = (
  url: string | Application,
  notificationId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .put(`/api/v1/notifications/user/${notificationId}/mark-read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Notification marked as read');
          resolve(message);
        }
      });
  });
};

const toggleNotificationEnabled = (
  url: string | Application,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .put('/api/v1/notifications/settings/toggle-enabled')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Notification settings updated successfully');
          resolve(message);
        }
      });
  });
};

export {
  checkIfNotificationsEnabled,
  getUserNotifications,
  MarkNotificationAsArchived,
  MarkNotificationAsRead,
  toggleNotificationEnabled,
  getAllNotifications,
}
