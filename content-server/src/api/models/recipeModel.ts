
import {ERROR_MESSAGES} from '../../utils/errorMessages';
import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Recipe, RecipeWithDietaryIds, UserLevel} from 'hybrid-types/DBTypes';
import {promisePool} from '../../lib/db';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import {fetchData} from '../../lib/functions';
const uploadPath = process.env.UPLOAD_URL;

const BASE_QUERY = `
  SELECT
    rp.recipe_id,
    rp.user_id,
    CONCAT(v.base_url, rp.filename) AS filename,
    rp.filesize,
    rp.media_type,
    rp.title,
    rp.instructions,
    rp.cooking_time,
    rp.created_at,
    dl.level_name AS difficulty_level,
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
    END AS screenshots,
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'ingredient_id', i.ingredient_id,
                'name', i.ingredient_name,
                'amount', ri.amount,
                'unit', ri.unit
            )
        )
        FROM RecipeIngredients ri
        LEFT JOIN Ingredients i ON ri.ingredient_id = i.ingredient_id
        WHERE ri.recipe_id = rp.recipe_id
    ) AS ingredients,
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'diet_type_id', dt.diet_type_id,
                'name', dt.diet_type_name
            )
        )
        FROM RecipeDietTypes rdt
        LEFT JOIN DietTypes dt ON rdt.diet_type_id = dt.diet_type_id
        WHERE rdt.recipe_id = rp.recipe_id
    ) AS diet_types
FROM RecipePosts rp
LEFT JOIN DifficultyLevels dl ON rp.difficulty_level_id = dl.difficulty_level_id
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
  rows.forEach((row) => {
    row.ingredients = JSON.parse(row.ingredients || '[]'); // NOTICE THIS, OTHERWISE INGREDIENT WILL BE IN UGLY JSON
    row.diet_types = JSON.parse(row.diet_types || '[]');
  });
  return rows;
}


const fetchRecipeById = async (recipe_id: number): Promise<Recipe> => {
  const sql = `${BASE_QUERY} WHERE rp.recipe_id = ? GROUP BY rp.recipe_id`;
  const params = [uploadPath, recipe_id];
  const stmt = await promisePool.format(sql, params);

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_FOUND, 404);
  }

  rows.forEach((row) => {
    row.ingredients = JSON.parse(row.ingredients || '[]'); // NOTICE THIS, OTHERWISE INGREDIENT WILL BE IN UGLY JSON
    row.diet_types = JSON.parse(row.diet_types || '[]');
  });
  return rows[0];
}


// Post a new recipe with ingredients
const postRecipe = async (
  recipe: Omit<RecipeWithDietaryIds, 'recipe_id' | 'created_at' | 'thumbnail'>,
  ingredients: { name: string; amount: number; unit: string }[],
  dietary_info: number[], // dietary id's 
): Promise<Recipe> => {
  const { user_id, filename, filesize, media_type, title, instructions, cooking_time, difficulty_level_id } = recipe;

  console.log('postRecipe:', recipe); // Debugging

  if (!difficulty_level_id) {
    throw new Error("Missing difficulty_level_id"); // Prevent inserting null
  }

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert the recipe
    const sql = `
      INSERT INTO RecipePosts (user_id, filename, filesize, media_type, title, instructions, cooking_time, difficulty_level_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      user_id,
      filename || null,
      filesize || null,
      media_type || null,
      title,
      instructions,
      cooking_time,
      difficulty_level_id
    ];

    console.log('SQL Query:', sql);
    console.log('Params:', params);

    const [result] = await connection.execute<ResultSetHeader>(sql, params);
    if (!result.affectedRows) {
      throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
    }
    const recipeId = result.insertId;

    // Insert the ingredients
    for (const ingredient of ingredients) {
      const [ingredientRows] = await connection.execute<RowDataPacket[] & Recipe[]>(
        'SELECT ingredient_id FROM Ingredients WHERE ingredient_name = ?',
        [ingredient.name],
      );

      let ingredientId: number;

      if (ingredientRows.length > 0) {
        ingredientId = ingredientRows[0].ingredient_id;
      } else {
        // Insert new ingredient
        const [insertIngredientResult] = await connection.execute<ResultSetHeader>(
          'INSERT INTO Ingredients (ingredient_name) VALUES (?)',
          [ingredient.name]
        );
        if (!insertIngredientResult.affectedRows) {
          throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
        }
        ingredientId = insertIngredientResult.insertId;
      }

      // Insert into RecipeIngredients
      const [insertRecipeIngredientResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO RecipeIngredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, ?, ?)`,
        [recipeId, ingredientId, ingredient.amount, ingredient.unit]
      );
      if (!insertRecipeIngredientResult.affectedRows) {
        throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
      }
    }

    // Insert dietary info
    for (const diet_id of dietary_info) {
      const [insertDietResult] = await connection.execute<ResultSetHeader>(
        `INSERT INTO RecipeDietTypes (recipe_id, diet_type_id) VALUES (?, ?)`,
        [recipeId, diet_id]
      );
      if (!insertDietResult.affectedRows) {
        throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
      }
    }

    await connection.commit();
    return await fetchRecipeById(recipeId);
  } catch (error) {
    await connection.rollback();
    console.error('Error in postRecipeWithIngredients:', error);
    throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
  } finally {
    connection.release();
  }
};


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
