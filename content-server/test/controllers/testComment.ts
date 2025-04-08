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
      .send({comment_text: comment, media_id: recipeId})
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

const getComments = (
  url: string | Application,
  recipeId: number,
): Promise<Comment[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/comments/bymedia/${recipeId}`)
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
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Comment deleted');
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
      .post(`/api/v1/comments/${recipeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({}) // Empty comment
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

const deleteInvalidComment = (
  url: string | Application,
  commentId: string,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/comments/${commentId}`)
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
  postComment,
  getComments,
  deleteComment,
  getNotFoundComment,
  postInvalidComment,
  deleteInvalidComment,
};
