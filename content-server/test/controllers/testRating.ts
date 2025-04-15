import {Rating} from 'hybrid-types/DBTypes';
import request from 'supertest';
import {Application} from 'express';
import { MessageResponse } from 'hybrid-types/MessageTypes';

const postRating = (
  url: string | Application,
  recipeId: number,
  rating: {rating: number, review: string},
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(`/api/v1/ratings`)
      .set('Authorization', `Bearer ${token}`)
      .send({recipe_id: recipeId, rating})
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Rating added');
          resolve(message);
        }
      }
    );
  });
};

const getRatingByUserId = (
  url: string | Application,
  token: string,
): Promise<Rating[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get('/api/v1/ratings/user')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const ratings: Rating[] = response.body;
          expect(Array.isArray(ratings)).toBe(true);
          ratings.forEach((rating) => {
            expect(rating.rating_id).toBeGreaterThan(0);
            expect(rating.recipe_id).toBeGreaterThan(0);
            expect(rating.user_id).toBeGreaterThan(0);
            expect(rating.rating).toBeGreaterThan(0);
            expect(rating.rating).toBeLessThan(6);
            expect(rating.review).not.toBe('');
          });
          resolve(ratings);
        }
      });
  });
};

const checkIfRatingExists = (
  url: string | Application,
  recipeId: number,
  token: string,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/ratings/check-exists/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        console.log('response:', response.body);
        if (err) {
          reject(err);
        } else {
          const exists: boolean = response.body;
          expect(exists).toBe(true);
          resolve(exists);
        }
      });
  });
}

const deleteRating = (
  url: string | Application,
  rating_id: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/ratings/recipe/${rating_id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Rating deleted');
          resolve(message);
        }
      });
  });
};


const getRatingsByRecipeId = (
  url: string | Application,
  recipeId: number,
): Promise<Rating[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/ratings/recipe/${recipeId}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const ratings: Rating[] = response.body;
          expect(Array.isArray(ratings)).toBe(true);
          ratings.forEach((rating) => {
            expect(rating.rating_id).toBeGreaterThan(0);
            expect(rating.recipe_id).toBe(recipeId);
            expect(rating.user_id).toBeGreaterThan(0);
            expect(rating.rating).toBeGreaterThan(0);
            expect(rating.rating).toBeLessThan(6);
            expect(rating.review).not.toBe('');
          });
          resolve(ratings);
        }
      });
  });
}

export {
  postRating,
  getRatingByUserId,
  checkIfRatingExists,
  deleteRating,
  getRatingsByRecipeId,
};
