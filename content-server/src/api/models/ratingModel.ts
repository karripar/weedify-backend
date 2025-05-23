import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Rating, UserLevel} from 'hybrid-types/DBTypes';
import {promisePool} from '../../lib/db';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import {ERROR_MESSAGES} from '../../utils/errorMessages';
import {getUsernameById} from './utilModel';
import {postNotification} from './notificationModel';
import {fetchRecipeById} from './recipeModel';

// fetch all ratings for a recipe
const fetchRatingsByRecipeId = async (id: number): Promise<Rating[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
    'SELECT * FROM Ratings WHERE recipe_id = ?',
    [id],
  );
  return rows;
};

// fetch all ratings by user id
const fetchRatingsByUserId = async (user_id: number): Promise<Rating[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
    'SELECT * FROM Ratings WHERE user_id = ?',
    [user_id],
  );
  return rows;
};

// post a new rating
const postRating = async (
  recipe_id: number,
  user_id: number,
  rating: Omit<Rating, 'rating_id' | 'created_at'>,
): Promise<MessageResponse> => {
  try {
    // Check if the user has already rated the recipe
    const [existingRating] = await promisePool.execute<
      RowDataPacket[] & Rating[]
    >('SELECT * FROM Ratings WHERE recipe_id = ? AND user_id = ?', [
      recipe_id,
      user_id,
    ]);
    if (existingRating.length > 0) {
      throw new CustomError(ERROR_MESSAGES.RATING.ALREADY_EXISTS, 400);
    }

    const params = [recipe_id, user_id, rating.rating, rating.review];

    // Insert the new rating
    const result = await promisePool.execute<ResultSetHeader>(
      'INSERT INTO Ratings (recipe_id, user_id, rating, review) VALUES (?, ?, ?, ?)',
      params,
    );

    // get the username of the user who rated
    const recipeOwner = await getUsernameById(user_id);
    // get the recipe owner id
    const recipe = await fetchRecipeById(recipe_id);
    const recipeOwnerId = recipe.user_id;

    // Fetch the correct notification_type_id for 'Rating'
    const [notificationTypeRows] = await promisePool.execute<RowDataPacket[]>(
      'SELECT notification_type_id FROM NotificationTypes WHERE type_name = ?',
      ['Rating'],
    );

    if (notificationTypeRows.length === 0) {
      throw new CustomError('Notification type "Rating" not found', 500);
    }

    const notificationTypeId = notificationTypeRows[0].notification_type_id;

    // Use the correct ID when posting the notification
    await postNotification(
      recipeOwnerId,
      `${recipeOwner.username} rated your recipe (${recipe.title})`,
      notificationTypeId,
    );
    if (result[0].affectedRows === 0) {
      throw new CustomError(ERROR_MESSAGES.RATING.NOT_CREATED, 500);
    }
    return {message: 'Rating added'};
  } catch (error) {
    console.error('Error posting rating:', error);
    throw new CustomError(ERROR_MESSAGES.RATING.NOT_CREATED, 500);
  }
};

// Delete a rating
const deleteRating = async (
  rating_id: number,
  user_id: number,
  user_level: UserLevel['level_name'],
): Promise<MessageResponse> => {
  try {
    const sql =
      user_level === 'Admin'
        ? 'DELETE FROM Ratings WHERE rating_id = ?'
        : 'DELETE FROM Ratings WHERE rating_id = ? AND user_id = ?';
    const params = user_level === 'Admin' ? [rating_id] : [rating_id, user_id];
    console.log('rating params', params);
    const [result] = await promisePool.execute<ResultSetHeader>(sql, params);
    if (!result.affectedRows) {
      throw new CustomError(ERROR_MESSAGES.RATING.NOT_DELETED, 500);
    }
    return {
      message: 'Rating deleted',
    };
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw new CustomError(ERROR_MESSAGES.RATING.NOT_DELETED, 500);
  }
};

const checkRatingExists = async (
  recipe_id: number,
  user_id: number,
): Promise<boolean> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Rating[]>(
    'SELECT * FROM Ratings WHERE recipe_id = ? AND user_id = ?',
    [recipe_id, user_id],
  );
  return rows.length > 0;
};

export {
  fetchRatingsByRecipeId,
  fetchRatingsByUserId,
  postRating,
  deleteRating,
  checkRatingExists,
};
