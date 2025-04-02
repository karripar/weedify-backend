import {
  fetchAllDietTypes,
  fetchDietTypesByRecipeId,
  fetchMostPopularDietTypes
} from '../models/dietaryModel';
import {DietType} from 'hybrid-types/DBTypes';
import { Request, Response, NextFunction } from 'express';


const dietaryListGet = async (
  req: Request,
  res: Response<DietType[]>,
  next: NextFunction,
) => {
  try {
    const dietary = await fetchAllDietTypes();
    res.json(dietary);
  } catch (error) {
    next(error);
  }
}

const dietaryListByRecipeIdGet = async (
  req: Request<{id: string}>,
  res: Response<DietType[]>,
  next: NextFunction,
) => {
  try {
    const dietary = await fetchDietTypesByRecipeId(Number(req.params.id));
    res.json(dietary);
  } catch (error) {
    next(error);
  }
};

const dietaryMostPopularGet = async (
  req: Request<{limit: string}>,
  res: Response<DietType[]>,
  next: NextFunction,
) => {
  try {
    const limit = Number(req.params.limit);
    const dietary = await fetchMostPopularDietTypes(limit);
    res.json(dietary);
  } catch (error) {
    next(error);
  }
};

export {
  dietaryListGet,
  dietaryListByRecipeIdGet,
  dietaryMostPopularGet
}
