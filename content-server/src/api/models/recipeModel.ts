import {ERROR_MESSAGES} from '../../utils/errorMessages';
import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Recipe, UserLevel} from 'hybrid-types/DBTypes';
import {promisePool} from '../../lib/db';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import {fetchData} from '../../lib/functions';
const uploadPath = process.env.UPLOAD_URL;

const BASE_QUERY = `
  SELECT
    rp.recipe_id,
    rp.user_id,
    rp.filename,
    rp.filesize,
    rp.media_type,
    rp.title,
    rp.instructions,
    rp.diet_type,
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

// Request a list of recipes and files related to the recipe
const fetchAllRecipes = async (
  page: number | undefined = undefined,
  limit: number | undefined = undefined,
): Promise<Recipe[]> => {
  const offset = page && limit ? (page - 1) * limit : undefined;
  const sql = `${BASE_QUERY}
  ${limit ? 'LIMIT ? OFFSET ?' : ''}`;
  const params = [uploadPath, limit, offset];

  const stmt = await promisePool.format(sql, params);

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  return rows;
}


const fetchRecipeById = async (recipe_id: number): Promise<Recipe> => {
  const sql = `${BASE_QUERY} WHERE rp.recipe_id = ?`;
  const params = [uploadPath, recipe_id];
  const stmt = await promisePool.format(sql, params);

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_FOUND, 404);
  }
  return rows[0];
}


// Post a new recipe
const postRecipe = async (
  recipe: Omit<Recipe, 'recipe_id' | 'created_at' | 'thumbnail'>,
): Promise<Recipe> => {
  const {user_id, filename, filesize, media_type, title, instructions, diet_type, cooking_time} = recipe;
  const sql = `
    INSERT INTO RecipePosts (user_id, filename, filesize, media_type, title, instructions, diet_type, cooking_time
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const params = [user_id, filename, filesize, media_type, title, instructions, diet_type, cooking_time];
  const stmt = await promisePool.format(sql, params);

  console.log('stmt', stmt);
  const [result] = await promisePool.execute<ResultSetHeader>(stmt);
  if (!result.affectedRows) {
    throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
  }
  return await fetchRecipeById(result.insertId);
}


const deleteRecipe = async (
  recipe_id: number,
  user_id: number,
  token: string,
  level_name: UserLevel['level_name'],
): Promise<MessageResponse> => {
  const recipe = await fetchRecipeById(recipe_id);

  if (!recipe) {
    return new CustomError(ERROR_MESSAGES.RECIPE.NOT_FOUND, 404);
  }

  recipe.filename = recipe?.filename.replace(
    process.env.UPLOAD_URL as string,
    '',
  );

  const connection = await promisePool.getConnection();
  await connection.beginTransaction();

  await connection.execute('DELETE FROM Likes WHERE recipe_id = ?', [recipe_id]);
  await connection.execute('DELETE FROM Comments WHERE recipe_id = ?;', [
    recipe_id,
  ]);

  await connection.execute('DELETE FROM MediaTags WHERE recipe_id = ?;', [
    recipe_id,
  ]);

  const sql =
    level_name === 'Admin'
      ? connection.format('DELETE FROM RecipePosts WHERE recipe_id = ?', [
          recipe_id,
        ])
      : connection.format(
          'DELETE FROM RecipePosts WHERE recipe_id = ? AND user_id = ?',
          [recipe_id, user_id],
        );

  const [result] = await connection.execute<ResultSetHeader>(sql);

  if (result.affectedRows === 0) {
    return {message: 'Media not deleted'};
  }

  const options = {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + token,
    },
  };

  try {
    const deleteResult = await fetchData<MessageResponse>(
      `${process.env.UPLOAD_SERVER}/delete/${recipe.filename}`,
      options,
    );

    console.log('deleteResult', deleteResult);
  } catch (e) {
    console.error('deleteRecipe file delete error:', (e as Error).message);
  }

  await connection.commit();

  return {
    message: 'Recipe deleted',
  };
}


// Fetch all recipes for a user
const fetchRecipesByUserId = async (user_id: number): Promise<Recipe[]> => {
  console.log('user_id', user_id);

  if (!user_id) {
    throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_FOUND, 404);
  }

  if (!uploadPath) {
    throw new CustomError('Upload path is missing', 500);
  }

  const sql = `${BASE_QUERY} WHERE rp.user_id = ?`;
  const params = [uploadPath, user_id];

  console.log('Executing SQL:', promisePool.format(sql, params)); // Debugging

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(
    sql,
    params,
  );
  return rows;
};

// Fetch all recipes for a user by username
const fetchRecipesByUsername = async (username: string): Promise<Recipe[]> => {
  const sql = `${BASE_QUERY} WHERE user_id = (SELECT user_id FROM Users WHERE username = ?)`;
  const params = [uploadPath, username];
  const stmt = promisePool.format(sql, params);
  console.log(stmt);

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  if (!rows.length) {
    throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_FOUND, 404);
  }
  return rows;
};

// Fetch all recipes by tag name
const fetchRecipesByTagname = async (tagname: string): Promise<Recipe[]> => {
  const sql = `${BASE_QUERY}
    JOIN MediaTags mt ON rp.recipe_id = mt.recipe_id
    JOIN Tags t ON mt.tag_id = t.tag_id
    WHERE LOWER(t.tag_name) = LOWER(?)`; // Convert both to lowercase

  const params = [uploadPath, tagname.toLowerCase()]; // Ensure lowercase input
  const stmt = promisePool.format(sql, params);
  console.log(stmt); // Debugging

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  return rows;
};

export {
  fetchAllRecipes,
  fetchRecipeById,
  postRecipe,
  deleteRecipe,
  fetchRecipesByUserId,
  fetchRecipesByUsername,
  fetchRecipesByTagname,
}
