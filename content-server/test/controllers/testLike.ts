


import {MessageResponse} from 'hybrid-types/MessageTypes';
import request from 'supertest';
import {Application} from 'express';
import {Like} from 'hybrid-types/DBTypes';

const postLike = (
  url: string | Application,
  recipeId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(`/api/v1/likes`)
      .send({recipe_id: recipeId})
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Like added');
          resolve(message);
        }
      });
  });
};


const getLikesByUser = (
  url: string | Application,
  userId: number
): Promise<Like[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get('/api/v1/likes/user/' + userId)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const likes: Like[] = response.body;
          expect(Array.isArray(likes)).toBe(true);
          likes.forEach((like) => {
            expect(like.like_id).toBeGreaterThan(0);
            expect(like.recipe_id).toBeGreaterThan(0);
            expect(like.user_id).toBe(userId);
          });
          resolve(likes);
        }
      });
  });
};


const getLikeByRecipeIdAndUserId = (
  url: string | Application,
  recipeId: number,
  userId: number,
): Promise<Like> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/likes/${recipeId}/user/${userId}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const like: Like = response.body;
          expect(like.like_id).toBeGreaterThan(0);
          expect(like.recipe_id).toBe(recipeId);
          expect(like.user_id).toBe(userId);
          resolve(like);
        }
      });
  });
};




const deleteLike = (
  url: string | Application,
  like_id: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/likes/${like_id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Like deleted');
          resolve(message);
        }
      });
  });
};

const getNotFoundLike = (
  url: string | Application,
  recipeId: number,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/likes/${recipeId}`)
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

const postInvalidLike = (
  url: string | Application,
  recipeId: string,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(`/api/v1/likes/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
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

export {
  postLike,
  deleteLike,
  getNotFoundLike,
  postInvalidLike,
  getLikesByUser,
  getLikeByRecipeIdAndUserId,
};
