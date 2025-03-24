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

const getUsers = async (): Promise<UserWithNoPassword[]> => {
  const [rows] = await promisePool.execute<
    RowDataPacket[] & UserWithNoPassword[]
  >(
    `SELECT Users.user_id, Users.username, Users.email, Users.created_at, UserLevels.level_name, ProfilePicture.filename
     FROM Users
     JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
     LEFT JOIN ProfilePicture ON Users.user_id = ProfilePicture.user_id`,
  );
  return rows;
};

const getUserById = async (
  user_id: number,
): Promise<UserWithProfilePicture> => {
  const [rows] = await promisePool.execute<
    UserWithProfilePicture[] & RowDataPacket[]
  >(
    `SELECT
    Users.user_id, Users.username, Users.bio, Users.email, Users.created_at,
    UserLevels.level_name, ProfilePicture.filename
    FROM Users
    JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
    LEFT JOIN ProfilePicture ON Users.user_id = ProfilePicture.user_id
    WHERE Users.user_id = ?;`,
    [user_id],
  );

  return rows[0]; // Handle case where user is not found
};

const getUserByEmail = async (email: string): Promise<UserWithLevel> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & UserWithLevel[]>(
    `SELECT Users.user_id, Users.username, Users.bio, Users.password, Users.email, Users.created_at, UserLevels.level_name, ProfilePicture.filename
     FROM Users
     JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
     LEFT JOIN ProfilePicture ON Users.user_id = ProfilePicture.user_id
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
): Promise<UserWithNoPassword> => {
  const sql = `INSERT INTO Users (username, email, password, user_level_id) VALUES (?, ?, ?, ?)`;
  const stmt = promisePool.format(sql, [
    user.username,
    user.email,
    user.password,
    2,
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
    `SELECT Users.user_id, Users.username, Users.bio, Users.email, Users.created_at, UserLevels.level_name, ProfilePicture.filename
     FROM Users
     JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
     LEFT JOIN ProfilePicture ON Users.user_id = ProfilePicture.user_id
     WHERE Users.username = ?`,
    [username],
  );
  if (rows.length === 0) {
    customLog('getUserByUsername: User not found');
    throw new CustomError('User not found', 404);
  }
  return rows[0];
};

const deleteUser = async (
  user_id: number,
  token: string,
): Promise<UserDeleteResponse> => {
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    // join user_id from RecipePosts
    const [recipeFiles] = await connection.execute<RowDataPacket[]>(
      `SELECT filename FROM RecipeMedia
      JOIN RecipePosts ON RecipeMedia.media_id = RecipePosts.media_id
      WHERE RecipePosts.user_id = ?`,
      [user_id],
    );

    // delete recipe files
    if (recipeFiles.length > 0) {
      recipeFiles.forEach(async (file) => {
        const filename = file.filename.replace(
          process.env.UPLOAD_URL as string,
          '',
        );
        console.log('filename', filename);
        const options = {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        };

        // delete file from upload server
        try {
          const response = await fetchData<MessageResponse>(
            `${process.env.UPLOAD_SERVER}/delete/${filename}`,
            options,
          );

          console.log('response', response);
        } catch (error) {
          console.error((error as Error).message);
        }
      });
    }

    const options = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({user_id}),
    };

    // delete profile picture
    const existingProfilePic = await checkProfilePicExists(user_id);

    if (existingProfilePic?.filename) {
      try {
        const response = await fetchData<MessageResponse>(
          `${process.env.UPLOAD_SERVER}/profilepicture/delete`,
          options,
        );
        console.log('response', response);
      } catch (error) {
        console.error((error as Error).message);
      }
    }

    // delete user content from content server
    await connection.execute('DELETE FROM Comments WHERE user_id = ?', [
      user_id,
    ]);
    await connection.execute('DELETE FROM RecipePosts WHERE user_id = ?', [
      user_id,
    ]);
    await connection.execute('DELETE FROM ProfilePicture WHERE user_id = ?', [
      user_id,
    ]);
    await connection.execute('DELETE FROM Likes WHERE user_id = ?', [user_id]);
    await connection.execute('DELETE FROM Ratings WHERE user_id = ?', [
      user_id,
    ]);

    await connection.execute(
      'DELETE FROM MediaTags WHERE media_id IN (SELECT media_id FROM MediaItems WHERE user_id = ?);',
      [user_id],
    );

    await connection.execute(
      'DELETE FROM Comments WHERE media_id IN (SELECT media_id FROM MediaItems WHERE user_id = ?);',
      [user_id],
    );

    await connection.execute(
      'DELETE FROM Likes WHERE media_id IN (SELECT media_id FROM MediaItems WHERE user_id = ?);',
      [user_id],
    );

    const [result] = await connection.execute<ResultSetHeader>(
      'DELETE FROM Users WHERE user_id = ?',
      [user_id],
    );

    await connection.commit();

    if (result.affectedRows === 0) {
      throw new CustomError('User not deleted', 500);
    }

    return {message: 'User deleted successfully', user: {user_id}};
  } catch (error) {
    console.error((error as Error).message);
    throw new CustomError('Error deleting user', 500);
  } finally {
    connection.release();
  }
};

// Check if user has a profile picture already
const checkProfilePicExists = async (
  user_id: number,
): Promise<ProfilePicture | null> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & ProfilePicture[]>(
    `
    SELECT
      pp.profile_picture_id,
      pp.user_id,
      pp.filename
      CONCAT(v.base_url, pp.filename) AS filename
    FROM ProfilePicture pp
    CROSS JOIN (SELECT ? AS base_url) AS v
    WHERE pp.user_id = ?
    `,
    [profilePicDir, user_id],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

// Post profile picture
const postProfilePic = async (
  media: Omit<ProfilePicture, 'profile_picture_id' | 'created_at'>,
): Promise<ProfilePicture> => {
  const {user_id, filename, filesize} = media; // media_type is always 'image' so no need to pass it in
  const sql = `INSERT INTO ProfilePicture (user_id, filename, filesize, media_type) VALUES (?, ?, ?, ?)`;
  const stmt = promisePool.format(sql, [user_id, filename, filesize]);
  const [result] = await promisePool.execute<ResultSetHeader>(stmt);

  if (result.affectedRows === 0) {
    throw new CustomError('Profile picture not created', 500);
  }

  return await getProfilePicById(result.insertId);
};

// Get profile picture by id
const getProfilePicById = async (
  profile_picture_id: number,
): Promise<ProfilePicture> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & ProfilePicture[]>(
    `SELECT * FROM ProfilePicture WHERE profile_picture_id = ?`,
    [profile_picture_id],
  );

  if (rows.length === 0) {
    customLog('getProfilePicById: Profile picture not found');
    throw new CustomError('Profile picture not found', 404);
  }

  return rows[0];
};

const putProfilePic = async (
  media: ProfilePicture,
  user_id: number,
): Promise<ProfilePicture> => {
  const {filename, filesize} = media;

  const existingProfilePic = await checkProfilePicExists(user_id);
  console.log('existingProfilePic', existingProfilePic);

  let sql;
  let stmt;

  if (existingProfilePic) {
    sql = `UPDATE ProfilePicture
           SET filename = ?, filesize = ?
           WHERE user_id = ?`;
    stmt = promisePool.format(sql, [filename, filesize, user_id]);
  } else {
    sql = `INSERT INTO ProfilePicture (user_id, filename, filesize) VALUES (?, ?, ?)`;
    stmt = promisePool.format(sql, [user_id, filename, filesize]);
  }

  const [result] = await promisePool.execute<ResultSetHeader>(stmt);

  if (result.affectedRows === 0) {
    throw new CustomError('Profile picture not updated or inserted', 500);
  }

  // delete existing profile picture
  if (existingProfilePic?.filename && existingProfilePic.user_id === user_id) {
    try {
      const absolutePath = existingProfilePic.filename.split('/').pop();
      const options = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({user_id}),
      };

      //
      const deleteResult = await fetchData<MessageResponse>(
        `${process.env.UPLOAD_SERVER}/profile/picture/${absolutePath}`,
        options,
      );
      console.log('deleteResult', deleteResult);
    } catch (error) {
      console.error((error as Error).message);
    }
  }

  return await getProfilePicById(result.insertId);
};


export {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  getUserByUsername,
  deleteUser,
  checkProfilePicExists,
  postProfilePic,
  getProfilePicById,
  putProfilePic,
};
