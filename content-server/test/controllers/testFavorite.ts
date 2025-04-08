import {Recipe} from 'hybrid-types/DBTypes';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import request from 'supertest';
import {Application} from 'express';

const postFavorite = (
  url: string | Application,
  recipeId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(`/api/v1/favorites`)
      .set('Authorization', `Bearer ${token}`)
      .send({recipe_id: recipeId})
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Favorite added');
          resolve(message);
        }
      });
  });
};

const getFavoritesByUserId = (
  url: string | Application,
  userId: number,
  token: string,
): Promise<Recipe[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/favorites/byuser`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const favorites: Recipe[] = response.body;
          expect(Array.isArray(favorites)).toBe(true);
          favorites.forEach((favorite) => {
            expect(favorite.recipe_id).toBeGreaterThan(0);
            expect(favorite.user_id).toBe(userId);
            expect(favorite.title).not.toBe('');
            expect(favorite.instructions).not.toBe('');
            expect(favorite.filename).not.toBe('');
            expect(favorite.media_type).not.toBe('');
            expect(favorite.filesize).toBeGreaterThan(0);
            expect(favorite.created_at).not.toBe('');
          }
          );
          resolve(favorites);
        }
      });
  });
};

const deleteFavorite = (
  url: string | Application,
  recipeId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/favorites/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Favorite removed');
          resolve(message);
        }
      });
  });
};

const getNegativeFavoriteStatus = (
  url: string | Application,
  recipeId: number,
  token: string,
): Promise<{favorite: boolean}> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/favorites/byuser/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const result: {favorite: boolean} = response.body;
          expect(result.favorite).toBe(false);
          resolve(result);
        }
      });
  });
};


export {postFavorite, getFavoritesByUserId, deleteFavorite, getNegativeFavoriteStatus};
