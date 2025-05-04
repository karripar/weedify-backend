import {ERROR_MESSAGES} from '../../utils/errorMessages';
import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {Recipe, RecipeWithDietaryIds, UserLevel} from 'hybrid-types/DBTypes';
import {promisePool} from '../../lib/db';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import {fetchData, safeJsonParse} from '../../lib/functions';
const uploadPath = process.env.UPLOAD_URL;

// Fetch all recipes with this hell of a query
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
    rp.portions,
    rp.created_at,
    dl.level_name AS difficulty_level,
    (SELECT COUNT(*) FROM Likes WHERE Likes.recipe_id = rp.recipe_id) AS likes_count,
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
                'fineli_id', i.fineli_id,
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
    ) AS diet_types,
    (
        SELECT JSON_OBJECT(
            'energy_kcal', rn.energy_kcal,
            'protein', rn.protein,
            'fat', rn.fat,
            'carbohydrate', rn.carbohydrate,
            'fiber', rn.fiber,
            'sugar', rn.sugar
        )
        FROM RecipeNutrition rn
        WHERE rn.recipe_id = rp.recipe_id
    ) AS nutrition
FROM RecipePosts rp
LEFT JOIN DifficultyLevels dl ON rp.difficulty_level_id = dl.difficulty_level_id
CROSS JOIN (SELECT ? AS base_url) AS v
`;

const fetchAllRecipes = async (
  page: number | undefined = undefined,
  limit: number | undefined = undefined,
): Promise<Recipe[]> => {
  const offset = page && limit ? (page - 1) * limit : 0;

  // Use BASE_QUERY
  const sql = limit ? `${BASE_QUERY} LIMIT ? OFFSET ?` : BASE_QUERY;

  const params = limit ? [uploadPath, limit, offset] : [uploadPath];

  const stmt = await promisePool.format(sql, params);

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  rows.forEach((row) => {
    row.ingredients = safeJsonParse(row.ingredients || '[]');
    row.diet_types = safeJsonParse(row.diet_types || '[]');
    row.screenshots = safeJsonParse(row.screenshots || '[]');
    row.nutrition = safeJsonParse(row.nutrition || null); // Lisää tämä rivi
  });

  return rows;
};
// Fetch a recipe by its ID
const fetchRecipeById = async (recipe_id: number): Promise<Recipe> => {
  const sql = `${BASE_QUERY} WHERE rp.recipe_id = ? GROUP BY rp.recipe_id`;

  const params = [uploadPath, recipe_id];
  const stmt = await promisePool.format(sql, params);

  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_FOUND, 404);
  }

  rows.forEach((row) => {
    row.ingredients = safeJsonParse(row.ingredients || '[]'); // NOTICE THIS, OTHERWISE INGREDIENT WILL BE IN UGLY JSON
    row.diet_types = safeJsonParse(row.diet_types || '[]');
    row.screenshots = safeJsonParse(row.screenshots || '[]');
    row.nutrition = safeJsonParse(row.nutrition || 'null');
  });

  return rows[0];
};

interface IngredientWithNutrition {
  ingredient_id: number;
  fineli_id: number; // Reference to Fineli database
  name: string;
  amount: number;
  unit: string;
  energy_kcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber: number;
  sugar: number;
}

// Interface for nutrition totals with index signature
interface NutritionTotals {
  energy_kcal: number;
  protein: number;
  fat: number;
  carbohydrate: number;
  fiber: number;
  sugar: number;
  [key: string]: number; // index signature to allow string indexing
}

const postRecipe = async (
  user_id: number,
  recipeData: RecipeWithDietaryIds,
  ingredients: IngredientWithNutrition[],
): Promise<{message: string; recipe_id: number}> => {
  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    // Insert recipe basic info
    const {
      filename,
      filesize,
      media_type,
      title,
      instructions,
      cooking_time,
      difficulty_level_id,
      portions,
    } = recipeData;

    if (!difficulty_level_id) {
      throw new Error('Missing difficulty_level_id'); // Prevent inserting null
    }

    // Insert the recipe
    const sql = `
      INSERT INTO RecipePosts (user_id, filename, filesize, media_type, title, instructions, cooking_time, difficulty_level_id, portions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      user_id,
      filename || null,
      filesize || null,
      media_type || null,
      title,
      instructions,
      cooking_time,
      difficulty_level_id,
      portions,
    ];

    console.log('SQL Query:', sql);
    console.log('Params:', params);

    const [result] = await connection.execute<ResultSetHeader>(sql, params);
    if (!result.affectedRows) {
      throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
    }
    const recipeId = result.insertId;

    // Calculate recipe nutritional info totals (per portion)
    const totalNutrition: NutritionTotals = ingredients.reduce(
      (acc, ingredient) => {
        return {
          energy_kcal: acc.energy_kcal + ingredient.energy_kcal,
          protein: acc.protein + ingredient.protein,
          fat: acc.fat + ingredient.fat,
          carbohydrate: acc.carbohydrate + ingredient.carbohydrate,
          fiber: acc.fiber + ingredient.fiber,
          sugar: acc.sugar + ingredient.sugar,
        };
      },
      {
        energy_kcal: 0,
        protein: 0,
        fat: 0,
        carbohydrate: 0,
        fiber: 0,
        sugar: 0,
      } as NutritionTotals,
    );

    // Calculate per portion
    const portionsCount = recipeData.portions || 1; // Renamed to avoid redeclaration
    Object.keys(totalNutrition).forEach((key) => {
      totalNutrition[key] = totalNutrition[key] / portionsCount;
    });

    // Store nutrition information for the recipe
    await connection.execute<ResultSetHeader>(
      `INSERT INTO RecipeNutrition
      (recipe_id, energy_kcal, protein, fat, carbohydrate, fiber, sugar)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        recipeId,
        totalNutrition.energy_kcal,
        totalNutrition.protein,
        totalNutrition.fat,
        totalNutrition.carbohydrate,
        totalNutrition.fiber,
        totalNutrition.sugar,
      ],
    );

    // Insert ingredients with their nutritional data
    for (const ingredient of ingredients) {
      // First check if ingredient exists by fineli_id OR name
      const [existingIngredients] = await connection.execute<RowDataPacket[]>(
        'SELECT ingredient_id FROM Ingredients WHERE fineli_id = ? OR ingredient_name = ?',
        [ingredient.fineli_id, ingredient.name],
      );

      let ingredient_id;

      if (existingIngredients.length > 0) {
        ingredient_id = existingIngredients[0].ingredient_id;

        await connection.execute(
          `UPDATE Ingredients
           SET energy_kcal = ?, protein = ?, fat = ?, carbohydrate = ?, fiber = ?, sugar = ?
           WHERE ingredient_id = ?`,
          [
            ingredient.energy_kcal,
            ingredient.protein,
            ingredient.fat,
            ingredient.carbohydrate,
            ingredient.fiber,
            ingredient.sugar,
            ingredient_id,
          ],
        );
      } else {
        // Insert new ingredient
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO Ingredients
          (ingredient_name, fineli_id, energy_kcal, protein, fat, carbohydrate, fiber, sugar)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ingredient.name,
            ingredient.fineli_id,
            ingredient.energy_kcal,
            ingredient.protein,
            ingredient.fat,
            ingredient.carbohydrate,
            ingredient.fiber,
            ingredient.sugar,
          ],
        );

        ingredient_id = result.insertId;
      }

      // Link ingredient to recipe
      await connection.execute<ResultSetHeader>(
        `INSERT INTO RecipeIngredients
        (recipe_id, ingredient_id, amount, unit)
        VALUES (?, ?, ?, ?)`,
        [recipeId, ingredient_id, ingredient.amount, ingredient.unit],
      );
    }

    // Handle dietary information (improved handling with explicit empty array)
    const dietaryIds = recipeData.dietary_id || [];
    console.log('dietary info', dietaryIds.length > 0 ? dietaryIds : 'none');

    // Insert dietary info
    if (dietaryIds.length > 0) {
      for (const diet_id of dietaryIds) {
        const [insertDietResult] = await connection.execute<ResultSetHeader>(
          `INSERT INTO RecipeDietTypes (recipe_id, diet_type_id) VALUES (?, ?)`,
          [recipeId, diet_id],
        );
        if (!insertDietResult.affectedRows) {
          throw new CustomError(ERROR_MESSAGES.RECIPE.NOT_CREATED, 500);
        }
      }
    }

    await connection.commit();
    // Fix the return type to include both required properties
    const recipe = await fetchRecipeById(recipeId);
    return {
      message: 'Recipe created',
      recipe_id: recipe.recipe_id,
    };
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

  if (user_id !== recipe.user_id && level_name !== 'Admin') {
    return new CustomError(ERROR_MESSAGES.RECIPE.NOT_AUTHORIZED, 403); // if user is not admin or owner
  }

  if (recipe.filename) {
    recipe.filename = recipe.filename.replace(
      process.env.UPLOAD_URL as string, // remove base URL
      '',
    );
  }

  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute('DELETE FROM Likes WHERE recipe_id = ?', [
      recipe_id,
    ]);
    await connection.execute('DELETE FROM Comments WHERE recipe_id = ?', [
      recipe_id,
    ]);

    // Delete recipe based on user level
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
      await connection.rollback();
      return {message: 'Media not deleted'};
    }

    if (recipe.filename) {
      try {
        const deleteResult = await fetchData<MessageResponse>(
          `${process.env.UPLOAD_SERVER}/delete/${recipe.filename}`, // use the filename without base URL
          {
            method: 'DELETE',
            headers: {Authorization: 'Bearer ' + token},
          },
        );
        console.log('deleteResult', deleteResult);
      } catch (e) {
        console.error('deleteRecipe file delete error:', (e as Error).message);
      }
    }

    await connection.commit();

    return {message: 'Recipe deleted'};
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

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

  rows.forEach((row) => {
    row.ingredients = safeJsonParse(row.ingredients || '[]');
    row.diet_types = safeJsonParse(row.diet_types || '[]');
    row.screenshots = safeJsonParse(row.screenshots || '[]');
    row.nutrition = safeJsonParse(row.nutrition || 'null');
  });

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

  rows.forEach((row) => {
    row.ingredients = safeJsonParse(row.ingredients || '[]');
    row.diet_types = safeJsonParse(row.diet_types || '[]');
    row.screenshots = safeJsonParse(row.screenshots || '[]');
    row.nutrition = safeJsonParse(row.nutrition || 'null');
  });

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

// fetch all recipes from followed users
const fetchRecipesFromFollowedUsers = async (
  user_id: number,
  page: number | undefined = undefined,
  limit: number | undefined = undefined,
): Promise<Recipe[]> => {
  const offset = page && limit ? (page - 1) * limit : 0;

  const sql = `
    SELECT
      rp.recipe_id,
      rp.user_id,
      CONCAT(v.base_url, rp.filename) AS filename,
      rp.filesize,
      rp.media_type,
      rp.title,
      rp.instructions,
      rp.cooking_time,
      rp.portions,
      rp.created_at,
      dl.level_name AS difficulty_level,
      (SELECT COUNT(*) FROM Likes WHERE Likes.recipe_id = rp.recipe_id) AS likes_count,
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
                  'fineli_id', i.fineli_id,
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
      ) AS diet_types,
      (
          SELECT JSON_OBJECT(
              'energy_kcal', rn.energy_kcal,
              'protein', rn.protein,
              'fat', rn.fat,
              'carbohydrate', rn.carbohydrate,
              'fiber', rn.fiber,
              'sugar', rn.sugar
          )
          FROM RecipeNutrition rn
          WHERE rn.recipe_id = rp.recipe_id
      ) AS nutrition
    FROM RecipePosts rp
    LEFT JOIN DifficultyLevels dl ON rp.difficulty_level_id = dl.difficulty_level_id
    CROSS JOIN (SELECT ? AS base_url) AS v
    WHERE rp.user_id IN (
      SELECT followed_id
      FROM Follows
      WHERE follower_id = ?
    )
    GROUP BY rp.recipe_id
    ORDER BY rp.created_at DESC
    ${limit ? 'LIMIT ? OFFSET ?' : ''}
  `;
  const params = limit
    ? [uploadPath, user_id, limit, offset]
    : [uploadPath, user_id];
  const stmt = promisePool.format(sql, params);
  console.log(stmt); // Debugging
  const [rows] = await promisePool.execute<RowDataPacket[] & Recipe[]>(stmt);
  rows.forEach((row) => {
    row.ingredients = safeJsonParse(row.ingredients || '[]');
    row.diet_types = safeJsonParse(row.diet_types || '[]');
    row.screenshots = safeJsonParse(row.screenshots || '[]');
    row.nutrition = safeJsonParse(row.nutrition || 'null');
  });
  return rows;
};

// Update a recipe with optional fields (choose which to update)
const updateRecipe = async (
  recipe_id: number,
  updateData: Partial<
    Omit<
      RecipeWithDietaryIds,
      'recipe_id' | 'created_at' | 'filename' | 'filesize' | 'media_type'
    >
  >,
  ingredients?: {
    name: string;
    amount: number;
    unit: string;
    fineli_id?: number;
    energy_kcal?: number;
    protein?: number;
    fat?: number;
    carbohydrate?: number;
    fiber?: number;
    sugar?: number;
  }[],
  dietary_info?: number[] | null,
): Promise<Recipe> => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const updateFields: string[] = [];
    const updateValues = [];

    // check which fields are provided
    if (updateData.title) {
      updateFields.push('title = ?');
      updateValues.push(updateData.title);
    }
    if (updateData.instructions) {
      updateFields.push('instructions = ?');
      updateValues.push(updateData.instructions);
    }
    if (updateData.cooking_time) {
      updateFields.push('cooking_time = ?');
      updateValues.push(updateData.cooking_time);
    }
    if (updateData.difficulty_level_id) {
      updateFields.push('difficulty_level_id = ?');
      updateValues.push(updateData.difficulty_level_id);
    }
    if (updateData.portions) {
      updateFields.push('portions = ?');
      updateValues.push(updateData.portions);
    }

    if (updateFields.length > 0) {
      updateValues.push(recipe_id);
      await connection.execute(
        `UPDATE RecipePosts SET ${updateFields.join(', ')} WHERE recipe_id = ?`,
        updateValues,
      );
    }

    // Update ingredients
    if (ingredients) {
      await connection.execute(
        `DELETE FROM RecipeIngredients WHERE recipe_id = ?`,
        [recipe_id],
      );

      // Calculate recipe nutritional info totals
      const totalNutrition: NutritionTotals = ingredients.reduce(
        (acc, ingredient) => {
          return {
            energy_kcal: acc.energy_kcal + (ingredient.energy_kcal || 0),
            protein: acc.protein + (ingredient.protein || 0),
            fat: acc.fat + (ingredient.fat || 0),
            carbohydrate: acc.carbohydrate + (ingredient.carbohydrate || 0),
            fiber: acc.fiber + (ingredient.fiber || 0),
            sugar: acc.sugar + (ingredient.sugar || 0),
          };
        },
        {
          energy_kcal: 0,
          protein: 0,
          fat: 0,
          carbohydrate: 0,
          fiber: 0,
          sugar: 0,
        } as NutritionTotals,
      );

      // Calculate per portion
      const portionsCount = updateData.portions || 1;
      Object.keys(totalNutrition).forEach((key) => {
        totalNutrition[key] = totalNutrition[key] / portionsCount;
      });

      // Update recipe nutrition information
      await connection.execute(
        'DELETE FROM RecipeNutrition WHERE recipe_id = ?',
        [recipe_id],
      );

      await connection.execute(
        `INSERT INTO RecipeNutrition
        (recipe_id, energy_kcal, protein, fat, carbohydrate, fiber, sugar)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          recipe_id,
          totalNutrition.energy_kcal,
          totalNutrition.protein,
          totalNutrition.fat,
          totalNutrition.carbohydrate,
          totalNutrition.fiber,
          totalNutrition.sugar,
        ],
      );

      for (const ingredient of ingredients) {
        const [rows] = await connection.execute<RowDataPacket[]>(
          `SELECT ingredient_id FROM Ingredients WHERE ingredient_name = ? OR (fineli_id = ? AND fineli_id > 0)`,
          [ingredient.name, ingredient.fineli_id || 0],
        );

        let ingredient_id: number;
        if (rows.length > 0) {
          ingredient_id = rows[0].ingredient_id;

          // Update ingredient nutritional data if available
          if (ingredient.energy_kcal !== null) {
            await connection.execute(
              `UPDATE Ingredients
               SET fineli_id = ?, energy_kcal = ?, protein = ?, fat = ?, carbohydrate = ?, fiber = ?, sugar = ?
               WHERE ingredient_id = ?`,
              [
                ingredient.fineli_id || 0,
                ingredient.energy_kcal || 0,
                ingredient.protein || 0,
                ingredient.fat || 0,
                ingredient.carbohydrate || 0,
                ingredient.fiber || 0,
                ingredient.sugar || 0,
                ingredient_id,
              ],
            );
          }
        } else {
          // Insert new ingredient with nutritional data
          const [result] = await connection.execute<ResultSetHeader>(
            `INSERT INTO Ingredients
            (ingredient_name, fineli_id, energy_kcal, protein, fat, carbohydrate, fiber, sugar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ingredient.name,
              ingredient.fineli_id || 0,
              ingredient.energy_kcal || 0,
              ingredient.protein || 0,
              ingredient.fat || 0,
              ingredient.carbohydrate || 0,
              ingredient.fiber || 0,
              ingredient.sugar || 0,
            ],
          );
          ingredient_id = result.insertId;
        }

        // Link ingredient to recipe
        await connection.execute<ResultSetHeader>(
          `INSERT INTO RecipeIngredients (recipe_id, ingredient_id, amount, unit)
           VALUES (?, ?, ?, ?)`,
          [recipe_id, ingredient_id, ingredient.amount, ingredient.unit],
        );
      }
    }

    // Update dietary info. With if statements the program will not crash if some fields are not provided
    if (dietary_info) {
      await connection.execute(
        `DELETE FROM RecipeDietTypes WHERE recipe_id = ?`,
        [recipe_id],
      );

      for (const diet_id of dietary_info) {
        await connection.execute<ResultSetHeader>(
          `INSERT INTO RecipeDietTypes (recipe_id, diet_type_id) VALUES (?, ?)`,
          [recipe_id, diet_id],
        );
      }
    }

    await connection.commit();
    return await fetchRecipeById(recipe_id);
  } catch (error) {
    await connection.rollback();
    console.error('Failed to update recipe:', error);
    throw new CustomError('Failed to update recipe', 500);
  } finally {
    connection.release();
  }
};

export {
  fetchAllRecipes,
  fetchRecipeById,
  postRecipe,
  deleteRecipe,
  fetchRecipesByUserId,
  fetchRecipesByUsername,
  fetchRecipesByTagname,
  updateRecipe,
  fetchRecipesFromFollowedUsers,
};
