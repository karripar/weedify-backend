import {Comment} from 'hybrid-types/DBTypes';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import request from 'supertest';
import {Application} from 'express';

const postComment = (
  url: string | Application,
  recipeId: number,
  token: string,
  comment: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(`/api/v1/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({comment: comment, recipe_id: recipeId})
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Comment added');
          resolve(message);
        }
      });
  });
};

const getUserComments = (
  url: string | Application,
  token: string,
): Promise<Comment[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get('/api/v1/comments/byuser')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const comments: Comment[] = response.body;
          expect(Array.isArray(comments)).toBe(true);
          comments.forEach((comment) => {
            expect(comment.comment_id).toBeGreaterThan(0);
            expect(comment.recipe_id).toBeGreaterThan(0);
            expect(comment.user_id).toBeGreaterThan(0);
            expect(comment.comment_text).not.toBe('');
            expect(comment.created_at).not.toBe('');
          });
          resolve(comments);
        }
      });
  });
};

const getComments = (
  url: string | Application,
  recipeId: number,
): Promise<Comment[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/comments/byrecipe/${recipeId}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const comments: Comment[] = response.body;
          expect(Array.isArray(comments)).toBe(true);
          comments.forEach((comment) => {
            expect(comment.comment_id).toBeGreaterThan(0);
            expect(comment.recipe_id).toBe(recipeId);
            expect(comment.user_id).toBeGreaterThan(0);
            expect(comment.comment_text).not.toBe('');
            expect(comment.created_at).not.toBe('');
          });
          resolve(comments);
        }
      });
  });
};

const deleteComment = (
  url: string | Application,
  commentId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message = response.body;
          resolve(message);
        }
      });
  });
};

const getNotFoundComment = (
  url: string | Application,
  recipeId: number,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/comments/${recipeId}`)
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

const postInvalidComment = (
  url: string | Application,
  recipeId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(`/api/v1/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({recipe_id: recipeId}) // Empty comment
      .expect(400, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message = response.body;
          resolve(message);
        }
      });
  });
};

const deleteInvalidComment = (
  url: string | Application,
  commentId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(401, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message = response.body;
          resolve(message);
        }
      });
  });
};

export {
  postComment,
  getComments,
  deleteComment,
  getNotFoundComment,
  postInvalidComment,
  deleteInvalidComment,
  getUserComments,
};
