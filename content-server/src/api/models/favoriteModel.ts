import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Favorite, Recipe} from 'hybrid-types/DBTypes';
import { promisePool } from '../../lib/db';
import { MessageResponse } from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import { ERROR_MESSAGES } from '../../utils/errorMessages';

const uploadPath = process.env.UPLOAD_URL;

const BASE_RECIPE_QUERY = `
  SELECT
    rp.recipe_id,
    rp.user_id,
    rp.filename,
    rp.filesize,
    rp.media_type,
    rp.title,
    rp.instructions,
    rp.cooking_time,
    rp.created_at,
    CONCAT(v.base_url, rp.filename) AS filename,
    CASE
      WHEN rp.media_type LIKE '%image%'
      THEN CONCAT(v.base_url, rp.filename, '-thumb.png')
      ELSE CONCAT(v.base_url, rp.filename, '-animation.gif')
    END AS thumbnail,
    CASE
      WHEN rp.media_type NOT LIKE '%image%'
      THEN JSON_ARRAY(
          CONCAT(v.base_url, rp.filename, '-thumb-1.png'),
          CONCAT(v.base_url, rp.filename, '-thumb-2.png'),
          CONCAT(v.base_url, rp.filename, '-thumb-3.png'),
          CONCAT(v.base_url, rp.filename, '-thumb-4.png'),
          CONCAT(v.base_url, rp.filename, '-thumb-5.png')
        )
      ELSE NULL
    END AS screenshots
  FROM RecipePosts rp
  CROSS JOIN (SELECT ? AS base_url) AS v
`;



// Request a list of favorites
const fetchAllFavorites = async (): Promise<Favorite[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Favorite[]>(
    'SELECT * FROM Favorites',
  );
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.FAVORITE.NOT_FOUND, 404);
  }
  return rows;
};

const fetchFavoriteStatus = async (user_id: number, recipe_id: number): Promise<boolean> => {
  const [rows] = await promisePool.execute<RowDataPacket[]>(
    'SELECT * FROM Favorites WHERE user_id = ? AND recipe_id = ?',
    [user_id, recipe_id],
  );
  return rows.length > 0;
};

// Request a list of favorites by user id
const fetchFavoritesByUserId = async (user_id: number): Promise<Recipe[]> => {

  const query = `
    ${BASE_RECIPE_QUERY}
    INNER JOIN Favorites f ON rp.recipe_id = f.recipe_id
    WHERE f.user_id = ?;
  `;

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(query, [uploadPath, user_id]);

  if (rows.length === 0) {
    throw new CustomError('No favorites found for this user', 404);
  }

  return rows;
};

// Add a favorite
const addFavorite = async (user_id: number, recipe_id: number): Promise<MessageResponse> => {
  // Check if the favorite already exists
  const [existing] = await promisePool.execute<RowDataPacket[]>(
    'SELECT * FROM Favorites WHERE user_id = ? AND recipe_id = ?',
    [user_id, recipe_id]
  );

  if (existing.length > 0) {
    throw new CustomError(ERROR_MESSAGES.FAVORITE.ALREADY_EXISTS, 400);
  }

  const [result] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO Favorites (user_id, recipe_id) VALUES (?, ?)',
    [user_id, recipe_id],
  );

  if (result.affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.FAVORITE.NOT_CREATED, 500);
  }

  return { message: 'Favorite added' };
};

const countFavorites = async (recipe_id: number): Promise<number> => {
  const [rows] = await promisePool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM Favorites WHERE recipe_id = ?',
    [recipe_id],
  );
  return rows[0].count;
}

// Remove a favorite
const removeFavorite = async (user_id: number, recipe_id: number): Promise<MessageResponse> => {
  // Check if the favorite exists and belongs to the user
  const [rows] = await promisePool.execute<RowDataPacket[]>(
    'SELECT * FROM Favorites WHERE user_id = ? AND recipe_id = ?',
    [user_id, recipe_id],
  );
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.FAVORITE.UNAUTHORIZED, 404);
  }

  // Proceed to remove the favorite
  const [result] = await promisePool.execute<ResultSetHeader>(
    'DELETE FROM Favorites WHERE user_id = ? AND recipe_id = ?',
    [user_id, recipe_id],
  );
  if (result.affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.FAVORITE.NOT_DELETED, 500);
  }
  return { message: 'Favorite removed' };
};



export {
  fetchAllFavorites,
  fetchFavoritesByUserId,
  addFavorite,
  removeFavorite,
  countFavorites,
  fetchFavoriteStatus,
};
