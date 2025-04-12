import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Like, UserLevel} from 'hybrid-types/DBTypes';
import {promisePool} from '../../lib/db';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import {ERROR_MESSAGES} from '../../utils/errorMessages';

// Likes by recipe_id
const fetchLikesByRecipeId = async (id: number): Promise<Like[]> => {
  console.log('SELECT * FROM Likes WHERE recipe_id = ' + id);
  const [rows] = await promisePool.execute<RowDataPacket[] & Like[]>(
    'SELECT * FROM Likes WHERE recipe_id = ?',
    [id],
  );
  return rows.length > 0 ? rows : [];
};

// Likes by user_id
const fetchLikesByUserId = async (id: number): Promise<Like[]> => {
  console.log('SELECT * FROM Likes WHERE user_id = ' + id);
  const [rows] = await promisePool.execute<RowDataPacket[] & Like[]>(
    'SELECT * FROM Likes WHERE user_id = ?',
    [id],
  );
  return rows;
};

// post a new like
const postLike = async (
  recipe_id: number,
  user_id: number,
): Promise<MessageResponse> => {
  const [existingLike] = await promisePool.execute<RowDataPacket[] & Like[]>(
    'SELECT * FROM Likes WHERE recipe_id = ? AND user_id = ?',
    [recipe_id, user_id],
  );

  if (existingLike.length > 0) {
    throw new CustomError(ERROR_MESSAGES.LIKE.ALREADY_EXISTS, 400);
  }

  // recipe -> recipe_id
  const result = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO Likes (recipe_id, user_id) VALUES (?, ?)',
    [recipe_id, user_id],
  );

  if (result[0].affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.LIKE.NOT_CREATED, 500);
  }

  return {message: 'Like added'};
};

// Delete a like
const deleteLike = async (
  like_id: number,
  user_id: number,
  user_level: UserLevel['level_name'],
): Promise<MessageResponse> => {
  const sql =
    user_level === 'Admin'
      ? 'DELETE FROM Likes WHERE like_id = ?'
      : 'DELETE FROM Likes WHERE like_id = ? AND user_id = ?';

  const params = user_level === 'Admin' ? [like_id] : [like_id, user_id];

  const [result] = await promisePool.execute<ResultSetHeader>(sql, params);

  if (result.affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.LIKE.NOT_DELETED, 400);
  }

  return {message: 'Like deleted'};
};

// likes by recipe_id and user_id
const fetchLikeByRecipeIdAndUserId = async (
  recipe_id: number,
  user_id: number,
): Promise<Like | null> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Like[]>(
    'SELECT * FROM Likes WHERE recipe_id = ? AND user_id = ?',
    [recipe_id, user_id],
  );

  // Return if found otherwise null
  return rows.length > 0 ? rows[0] : null;
};

export {
  fetchLikesByRecipeId,
  fetchLikesByUserId,
  postLike,
  deleteLike,
  fetchLikeByRecipeIdAndUserId,
};
