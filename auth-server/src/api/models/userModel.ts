import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {promisePool} from '../../lib/db';
import {
  UserWithLevel,
  User,
  UserWithNoPassword,
  ProfilePicture,
  UserWithDietaryInfo,
  UserCheck,
} from 'hybrid-types/DBTypes';
import {UserDeleteResponse, MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/CustomError';
import {customLog, fetchData, safeJsonParse} from '../../lib/functions';

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

const getUserById = async (user_id: number): Promise<UserWithDietaryInfo> => {
  const [rows] = await promisePool.execute<
    UserWithDietaryInfo[] & RowDataPacket[]
  >(
    `SELECT
      Users.user_id,
      Users.username,
      Users.bio,
      Users.email,
      Users.created_at,
      UserLevels.level_name,
      ProfilePicture.filename,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'dietary_restriction_id', dr.dietary_restriction_id,
            'name', dr.restriction_name
          )
        )
        FROM UserDietaryRestrictions udr
        LEFT JOIN DietaryRestrictions dr ON udr.dietary_restriction_id = dr.dietary_restriction_id
        WHERE udr.user_id = Users.user_id
      ) AS dietary_restrictions
    FROM Users
    JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
    LEFT JOIN ProfilePicture ON Users.user_id = ProfilePicture.user_id
    WHERE Users.user_id = ?;`,
    [user_id],
  );

  const user = rows[0];
  if (user && user.filename) {
    user.filename = `${profilePicDir}${user.filename}`;
  }
  // dietary info is only for the user
  rows.forEach((row) => {
    if (row.dietary_restrictions) {
      row.dietary_restrictions = safeJsonParse(row.dietary_restrictions || '[]');
    }
  });

  return rows[0]; // Handle case where user is not found
};

const getUserByEmail = async (email: string): Promise<UserWithLevel | null> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & UserWithLevel[]>(
    `SELECT Users.user_id, Users.username, Users.bio, Users.password, Users.email, Users.user_level_id, Users.created_at, UserLevels.level_name, ProfilePicture.filename
     FROM Users
     JOIN UserLevels ON Users.user_level_id = UserLevels.user_level_id
     LEFT JOIN ProfilePicture ON Users.user_id = ProfilePicture.user_id
     WHERE Users.email = ?`,
    [email],
  );
  if (rows.length === 0) {
    customLog('getUserByEmail: User not found');
    return null;
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
): Promise<UserWithNoPassword | null> => {
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
    return null;
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
      `SELECT filename FROM RecipePosts WHERE user_id = ?`,
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
          `${process.env.UPLOAD_SERVER}/profile/${existingProfilePic.filename}`,
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
    await connection.execute('DELETE FROM Notifications WHERE user_id = ?', [
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
      'DELETE FROM Comments WHERE recipe_id IN (SELECT recipe_id FROM RecipePosts WHERE user_id = ?);',
      [user_id],
    );

    await connection.execute(
      'DELETE FROM Likes WHERE recipe_id IN (SELECT recipe_id FROM RecipePosts WHERE user_id = ?);',
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
      pp.filename,
      pp.filesize,
      pp.media_type,
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
  const {user_id, filename, filesize, media_type} = media; // media_type is always 'image' so no need to pass it in
  const sql = `INSERT INTO ProfilePicture (user_id, filename, filesize, media_type) VALUES (?, ?, ?, ?)`;
  const stmt = promisePool.format(sql, [
    user_id,
    filename,
    filesize,
    media_type,
  ]);
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

const getProfilePicByUserId = async (
  user_id: number,
): Promise<ProfilePicture> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & ProfilePicture[]>(
    `SELECT
      pp.profile_picture_id,
      pp.user_id,
      pp.filename,
      pp.filesize,
      pp.media_type,
      CONCAT(v.base_url, pp.filename) AS filename
    FROM ProfilePicture pp
    CROSS JOIN (SELECT ? AS base_url) AS v
    WHERE pp.user_id = ?`,
    [profilePicDir, user_id],
  );
  if (rows.length === 0) {
    customLog('getProfilePicByUserId: Profile picture not found');
  }
  return rows[0];
};

const putProfilePic = async (
  media: ProfilePicture,
  user_id: number,
): Promise<ProfilePicture> => {
  const {filename, filesize, media_type} = media;

  const existingProfilePic = await checkProfilePicExists(user_id);
  console.log('existingProfilePic', existingProfilePic);

  let sql;
  let stmt;

  if (existingProfilePic) {
    sql = `UPDATE ProfilePicture
           SET filename = ?, filesize = ?, media_type = ?
           WHERE user_id = ?`;
    stmt = promisePool.format(sql, [filename, filesize, media_type, user_id]);
  } else {
    sql = `INSERT INTO ProfilePicture (user_id, filename, filesize, media_type) VALUES (?, ?, ?, ?)`;
    stmt = promisePool.format(sql, [user_id, filename, filesize, media_type]);
  }

  const [result] = await promisePool.execute<ResultSetHeader>(stmt);
  console.log('result', result);

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

      const deleteResult = await fetchData<MessageResponse>(
        `${process.env.UPLOAD_SERVER}/profile/picture/${absolutePath}`,
        options,
      );
      console.log('deleteResult', deleteResult);
    } catch (error) {
      console.error((error as Error).message);
    }
  }

  return await getProfilePicByUserId(user_id);
};

const updateUserDetails = async (
  user_id: number,
  userDetails: Partial<Pick<User, 'username' | 'email' | 'bio'>>,
  dietaryRestrictions: number[], // Array of dietary restriction IDs
): Promise<UserWithDietaryInfo> => {
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    // Update user details (username, email, bio)
    const updateFields = [];
    const updateValues = [];

    if (userDetails.username) {
      updateFields.push('username = ?');
      updateValues.push(userDetails.username);
    }
    if (userDetails.email) {
      updateFields.push('email = ?');
      updateValues.push(userDetails.email);
    }
    if (userDetails.bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(userDetails.bio);
    }

    if (updateFields.length > 0) {
      updateValues.push(user_id);
      await connection.execute(
        `UPDATE Users SET ${updateFields.join(', ')} WHERE user_id = ?`,
        updateValues,
      );
    }

    // Remove existing dietary restrictions
    await connection.execute(
      `DELETE FROM UserDietaryRestrictions WHERE user_id = ?`,
      [user_id],
    );

    // Insert new dietary restrictions
    if (dietaryRestrictions.length > 0) {
      const placeholders = dietaryRestrictions.map(() => '(?, ?)').join(', ');
      const values = dietaryRestrictions.flatMap((restrictionId) => [
        user_id,
        restrictionId,
      ]);

      await connection.execute(
        `INSERT INTO UserDietaryRestrictions (user_id, dietary_restriction_id) VALUES ${placeholders}`,
        values,
      );
    }

    await connection.commit();

    return await getUserById(user_id);
  } catch (error) {
    await connection.rollback();
    console.error(error);
    throw new CustomError('Failed to update user details', 500);
  } finally {
    connection.release();
  }
};

const getUserExistsByEmail = async (
  email: string,
): Promise<Partial<UserCheck>> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Partial<User>[]>(
    'SELECT user_id, email FROM Users WHERE email = ?',
    [email],
  );

  return rows[0];
};

const getUsernameById = async (user_id: number): Promise<Partial<User>> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Partial<User>[]>(
    'SELECT username FROM Users WHERE user_id = ?',
    [user_id],
  );
  return rows[0];
};

const changeUserLevel = async (
  user_id: number,
  user_level_id: number,
): Promise<MessageResponse> => {
  const sql = `UPDATE Users SET user_level_id = ? WHERE user_id = ?`;
  const stmt = promisePool.format(sql, [user_level_id, user_id]);
  const [result] = await promisePool.execute<ResultSetHeader>(stmt);

  if (result.affectedRows === 0) {
    throw new CustomError('User not updated', 500);
  }

  return {message: 'User level updated successfully'};
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
  updateUserDetails,
  getUserExistsByEmail,
  getUsernameById,
  changeUserLevel,
};
