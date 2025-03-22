import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {promisePool} from '../../lib/db';
import {
  UserWithLevel,
  User,
  UserWithNoPassword,
  UserWithProfilePicture,
  ProfilePicture,
} from 'hybrid-types/DBTypes';
import {UserDeleteResponse, MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/CustomError';
import {customLog, fetchData} from '../../lib/functions';

const profilePicDir = process.env.PROFILE_UPLOAD_URL;

const getUserById = async (
  user_id: number,
): Promise<UserWithProfilePicture> => {
  const [rows] = await promisePool.execute<
    RowDataPacket[] & UserWithProfilePicture[]
  >(
    `SELECT Users.user_id, Users.username, Users.email, Users.bio, UserLevels.level_name, ProfilePicture.filename, Users.bio FROM Users
    JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
    LEFT JOIN ProfilePicture ON Users.user_id = ProfilePicture.user_id
    WHERE Users.user_id = ?`,
    [user_id],
  );
  if (rows.length === 0) {
    throw new CustomError('User not found', 404);
  }
  return rows[0];
};

const getUserByEmail = async (email: string): Promise<UserWithLevel> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & UserWithLevel[]>(
    `SELECT Users.user_id, Users.username, Users.bio, Users.email, Users.created_at, UserLevels.level_name, ProfilePictures.filename
     FROM Users
     JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
     LEFT JOIN ProfilePictures ON Users.user_id = ProfilePictures.user_id
     WHERE Users.email = ?`,
    [email],
  );
  if (rows.length === 0) {
    customLog('getUserByEmail: User not found');
    throw new CustomError('User not found', 404);
  }
  return rows[0];
};

const createUser = async (
  user: Pick<User, 'username' | 'email' | 'password'>,
  user_level_id: 2, // Default to User level
): Promise<UserWithNoPassword> => {
  const sql = `INSERT INTO Users (username, email, password_hash, user_level_id) VALUES (?, ?, ?, ?)`;
  const stmt = promisePool.format(sql, [
    user.username,
    user.email,
    user.password,
    user_level_id,
  ]);
  const [result] = await promisePool.execute<ResultSetHeader>(stmt);

  if (result.affectedRows === 0) {
    throw new CustomError('User not created', 500);
  }

  return await getUserById(result.insertId);
};

const getUserByUsername = async (
  username: string,
): Promise<UserWithNoPassword> => {
  const [rows] = await promisePool.execute<
    RowDataPacket[] & UserWithNoPassword[]
  >(
    `SELECT Users.user_id, Users.username, Users.bio, Users.email, Users.created_at, UserLevels.level_name, ProfilePictures.filename
     FROM Users
     JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
     LEFT JOIN ProfilePictures ON Users.user_id = ProfilePictures.user_id
     WHERE Users.username = ?`,
    [username],
  );
  if (rows.length === 0) {
    customLog('getUserByUsername: User not found');
    throw new CustomError('User not found', 404);
  }
  return rows[0];
};

export {getUserById, getUserByEmail, createUser, getUserByUsername};
