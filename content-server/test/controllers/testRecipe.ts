import {
  RecipeWithDietaryInfo,
  RecipeWithDietaryIds
} from 'hybrid-types/DBTypes';
import {MessageResponse, UploadResponse} from 'hybrid-types/MessageTypes';
import request from 'supertest';
import {Application} from 'express';

const uploadFile = (
  url: string | Application,
  path: string,
  file: string,
  token: string,
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(path)
      .attach('file', file)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const message: UploadResponse = res.body;
          expect(message.message).toBe('File uploaded');
          expect(message.data.filename).not.toBe('');
          expect(message.data.filesize).toBeGreaterThan(0);
          expect(message.data.media_type).not.toBe('');
          resolve(message);
        }
      });
  });
};

const getRecipes = (
  urL: string | Application,
): Promise<RecipeWithDietaryInfo[]> => {
  return new Promise((resolve, reject) => {
    request(urL)
      .get('/api/v1/recipes')
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const recipes: RecipeWithDietaryInfo[] = res.body;
          expect(recipes.length).toBeGreaterThan(0);
          recipes.forEach((recipe) => {
            expect(recipe.recipe_id).toBeGreaterThan(0);
            expect(recipe.title).not.toBe('');
            expect(recipe.instructions).not.toBe('');
            expect(recipe.cooking_time).toBeGreaterThan(0);
            expect(recipe.filename).not.toBe('');
            expect(recipe.filesize).toBeGreaterThan(0);
            expect(recipe.media_type).not.toBe('');
            expect(recipe.dietary_info).not.toBe('');
            expect(recipe.user_id).toBeGreaterThan(0);
            expect(recipe.difficulty_level_id).toBeGreaterThan(0);
          });
          resolve(recipes);
        }
      });
  });
};

const getRecipeById = (
  urL: string | Application,
  recipeId: number,
): Promise<RecipeWithDietaryInfo> => {
  return new Promise((resolve, reject) => {
    request(urL)
      .get(`/api/v1/recipes/${recipeId}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const recipe: RecipeWithDietaryInfo = res.body;
          expect(recipe.recipe_id).toBe(recipeId);
          expect(recipe.title).not.toBe('');
          expect(recipe.instructions).not.toBe('');
          expect(recipe.cooking_time).toBeGreaterThan(0);
          expect(recipe.filename).not.toBe('');
          expect(recipe.filesize).toBeGreaterThan(0);
          expect(recipe.media_type).not.toBe('');
          expect(recipe.dietary_info).not.toBe('');
          expect(recipe.user_id).toBeGreaterThan(0);
          expect(recipe.difficulty_level_id).toBeGreaterThan(0);
          resolve(recipe);
        }
      });
  });
};

const postRecipe = (
  url: string | Application,
  path: string,
  token: string,
  recipe: RecipeWithDietaryIds,
): Promise<MessageResponse & {recipe_id: number}> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(recipe)
      .expect(200)
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res.body);
        }
      });
  });
};

const deleteRecipe = (
  url: string | Application,
  id: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/recipes/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = res.body;
          expect(message.message).toBe('Recipe deleted');
          resolve(message);
        }
      });
  });
};


const getNotFoundRecipe = (
  urL: string | Application,
  recipeId: number,
): Promise<RecipeWithDietaryInfo> => {
  return new Promise((resolve, reject) => {
    request(urL)
      .get(`/api/v1/recipes/${recipeId}`)
      .expect(404, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = res.body;
          expect(message.message).not.toBe('');
        }
      });
    });
};

const deleteNotFoundMediaItem = (
  url: string | Application,
  id: number,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/recipes/${id}`) // Updated path
      .expect(404, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).not.toBe('');
          resolve(message);
        }
      });
  });
};


const postInvalidMediaItem = (
  url: string | Application,
  media_name: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post('/api/v1/recipes') // Updated path
      .send({media_name})
      .expect(400, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).not.toBe('');
          resolve(message);
        }
      });
  });
};


const getRecipesByUserId = (
  url: string | Application,
  userId: number,
): Promise<RecipeWithDietaryInfo[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/recipes/byuser/${userId}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const recipes: RecipeWithDietaryInfo[] = res.body;
          expect(recipes.length).toBeGreaterThan(0);
          recipes.forEach((recipe) => {
            expect(recipe.user_id).toBe(userId);
          });
          resolve(recipes);
        }
      });
  });
};

const getRecipesByToken = (
  url: string | Application,
  token: string,
): Promise<RecipeWithDietaryInfo[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get('/api/v1/recipes/bytoken')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const recipes: RecipeWithDietaryInfo[] = res.body;
          expect(recipes.length).toBeGreaterThan(0);
          recipes.forEach((recipe) => {
            expect(recipe.recipe_id).toBeGreaterThan(0);
            expect(recipe.title).not.toBe('');
            expect(recipe.instructions).not.toBe('');
            expect(recipe.cooking_time).toBeGreaterThan(0);
            expect(recipe.filename).not.toBe('');
            expect(recipe.filesize).toBeGreaterThan(0);
            expect(recipe.media_type).not.toBe('');
            expect(recipe.dietary_info).not.toBe('');
            expect(recipe.user_id).toBeGreaterThan(0);
          });
          resolve(recipes);
        }
      });
  });
};

const getRecipesByUsername = (
  url: string | Application,
  username: string,
): Promise<RecipeWithDietaryInfo[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/recipes/byusername/${username}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const recipes: RecipeWithDietaryInfo[] = res.body;
          expect(recipes.length).toBeGreaterThan(0);
          recipes.forEach((recipe) => {
            expect(recipe.user_id).toBeGreaterThan(0);
            expect(recipe.title).not.toBe('');
            expect(recipe.instructions).not.toBe('');
            expect(recipe.cooking_time).toBeGreaterThan(0);
            expect(recipe.filename).not.toBe('');
            expect(recipe.filesize).toBeGreaterThan(0);
            expect(recipe.media_type).not.toBe('');
            expect(recipe.dietary_info).not.toBe('');
            expect(recipe.difficulty_level_id).toBeGreaterThan(0);
          });
          resolve(recipes);
        }
      });
  });
};





export {uploadFile, getRecipeById, getRecipes, postRecipe, deleteRecipe, getNotFoundRecipe, deleteNotFoundMediaItem, postInvalidMediaItem, getRecipesByUserId, getRecipesByToken, getRecipesByUsername};
