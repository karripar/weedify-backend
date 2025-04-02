import { RowDataPacket } from 'mysql2';
import { DietType} from 'hybrid-types/DBTypes';
import { promisePool } from '../../lib/db';
import CustomError from '../../classes/customError';
import { ERROR_MESSAGES } from '../../utils/errorMessages';


const fetchAllDietTypes = async (): Promise<DietType[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & DietType[]>(
    'SELECT * FROM DietTypes',
  );
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.DIETARY.NOT_FOUND, 404);
  }
  return rows;
}


const fetchDietTypesByRecipeId = async (id: number): Promise<DietType[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & DietType[]>(
    `SELECT dt.*
     FROM DietTypes dt
     JOIN RecipeDietTypes rdt ON dt.diet_type_id = rdt.diet_type_id
     WHERE rdt.recipe_id = ?`,
    [id],
  );
  return rows.length > 0 ? rows : [];
};


const fetchMostPopularDietTypes = async (limit: number): Promise<DietType[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & DietType[]>(
    `SELECT dt.*, COUNT(rdt.recipe_id) AS recipe_count
     FROM DietTypes dt
     JOIN RecipeDietTypes rdt ON dt.diet_type_id = rdt.diet_type_id
     GROUP BY dt.diet_type_id
     ORDER BY recipe_count DESC
     LIMIT ?`,
    [limit]
  );
  return rows.length > 0 ? rows : [];
};

export {
  fetchAllDietTypes,
  fetchDietTypesByRecipeId,
  fetchMostPopularDietTypes
}


