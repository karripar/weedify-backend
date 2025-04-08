import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Follow, UserLevel, FollowResponse} from 'hybrid-types/DBTypes';
import { promisePool } from '../../lib/db';
import { MessageResponse } from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import { ERROR_MESSAGES } from '../../utils/errorMessages';
import { checkNotificationsEnabled, postNotification } from './notificationModel';
import { getUsernameById } from './utilModel';
// Request a list of followers by user ID
const fetchFollowersByUserId = async (user_id: number): Promise<Follow[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Follow[]>(
    'SELECT * FROM Follows WHERE followed_id = ?', [user_id]
  );
  return rows;
};


const fetchFollowedUsersByUsername = async (username: string): Promise<Follow[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Follow[]>(
    `SELECT f.follow_id, f.follower_id, f.followed_id, f.created_at
     FROM Follows f
     JOIN Users u ON f.follower_id = u.user_id
     WHERE u.username = ?`, [username]
  );
  return rows;
};

const fetchFollowersByUsername = async (username: string): Promise<Follow[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Follow[]>(
    `SELECT f.follow_id, f.follower_id, f.followed_id, f.created_at
     FROM Follows f
     JOIN Users u ON f.followed_id = u.user_id
     WHERE u.username = ?`, [username]
  );
  return rows;
};


// Request a list of followed users by user ID
const fetchFollowedUsersByUserId = async (user_id: number): Promise<Follow[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Follow[]>(
    'SELECT * FROM Follows WHERE follower_id = ?', [user_id]
  );
  console.log(rows);
  return rows;

};


// Add a follow
const addFollow = async (follower_id: number, followed_id: number): Promise<FollowResponse> => {
  if (follower_id === followed_id) {
    throw new CustomError(ERROR_MESSAGES.FOLLOW.SELF_FOLLOW, 400);
  }
  const [existingFollow] = await promisePool.execute<RowDataPacket[] & Follow[]>(
    'SELECT * FROM Follows WHERE follower_id = ? AND followed_id = ?', [follower_id, followed_id]
  )

  if (existingFollow.length > 0) {
    throw new CustomError(ERROR_MESSAGES.FOLLOW.ALREADY_EXISTS, 400);
  }

  const result = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO Follows (follower_id, followed_id) VALUES (?, ?)', [follower_id, followed_id]
  );

  // Check if notifications are enabled for the followed user
  const notificationsAllowed = await checkNotificationsEnabled(followed_id);
  if (notificationsAllowed) {
    // Send a notification to the followed user
    const followerUsername = await getUsernameById(follower_id);
    const notificationText = `${followerUsername.username} started following you`;
    await postNotification(followed_id, notificationText, 3);
  } else {
    console.log('Notifications are disabled for this user');
  }

  if (result[0].affectedRows === 1) {
    return {
      message: 'Follow added',
      follow_id: result[0].insertId,
    };
  } else {
    throw new CustomError(ERROR_MESSAGES.FOLLOW.NOT_CREATED, 500);
  }
};


const removeFollow = async (
  follow_id: number,
  user_id: number,
  user_level: UserLevel['level_name'],
): Promise<MessageResponse> => {
  const sql = user_level === 'Admin' ? 'DELETE FROM Follows WHERE follow_id = ?' : 'DELETE FROM Follows WHERE follow_id = ? AND follower_id = ?';

  const params = user_level === 'Admin' ? [follow_id] : [follow_id, user_id];

  const [result] = await promisePool.execute<ResultSetHeader>(sql, params);

  if (result.affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.FOLLOW.NOT_DELETED, 400);
  }

  return { message: 'Follow removed' };
};



export {
  fetchFollowersByUserId,
  fetchFollowedUsersByUserId,
  addFollow,
  removeFollow,
  fetchFollowedUsersByUsername,
  fetchFollowersByUsername
};
