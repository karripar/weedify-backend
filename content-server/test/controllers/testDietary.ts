import {DietType} from 'hybrid-types/DBTypes';
import request from 'supertest';
import {Application} from 'express';


const getRecipeDietTypes = (
  url: string | Application,
  recipeId: number,
): Promise<DietType[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/dietary/recipe/${recipeId}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const dietTypes: DietType[] = response.body;
          expect(Array.isArray(dietTypes)).toBe(true);
          dietTypes.forEach((dietType) => {
            expect(dietType.diet_type_id).toBeGreaterThan(0);
            expect(dietType.diet_type_name).not.toBe('');
          });
          resolve(dietTypes);
        }
      });
  });
};


const getAllDietTypes = (
  url: string | Application,
): Promise<DietType[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/dietary`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const dietTypes: DietType[] = response.body;
          expect(Array.isArray(dietTypes)).toBe(true);
          dietTypes.forEach((dietType) => {
            expect(dietType.diet_type_id).toBeGreaterThan(0);
            expect(dietType.diet_type_name).not.toBe('');
          });
          resolve(dietTypes);
        }
      });
  });
};


const GetMostPopularDietaryTypes = (
  url: string | Application,
): Promise<DietType[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/dietary/popular/${10}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const dietTypes: DietType[] = response.body;
          expect(Array.isArray(dietTypes)).toBe(true);
          dietTypes.forEach((dietType) => {
            expect(dietType.diet_type_id).toBeGreaterThan(0);
            expect(dietType.diet_type_name).not.toBe('');
          });
          resolve(dietTypes);
        }
      });
  });
};

export {
  getRecipeDietTypes,
  getAllDietTypes,
  GetMostPopularDietaryTypes,
};

