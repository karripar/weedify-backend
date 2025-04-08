import {Follow} from 'hybrid-types/DBTypes';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import request from 'supertest';
import {Application} from 'express';


const postFollow = (
  url: string | Application,
  userId: number,
  token: string,
): Promise<Follow> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(`/api/v1/follows`)
      .set('Authorization', `Bearer ${token}`)
      .send({user_id: userId})
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const follow: Follow = response.body;
          expect(follow.follow_id).toBeGreaterThan(0);
          expect(follow.followed_id).toBe(userId);
          expect(follow.follower_id).toBeGreaterThan(0);
          return resolve(follow);
        }
      });
  });
};

const getFollowersWithToken = (
  url: string | Application,
  token: string,
): Promise<Follow[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/follows/bytoken/followers`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const followers: Follow[] = response.body;
          expect(Array.isArray(followers)).toBe(true);
          followers.forEach((follower) => {
            expect(follower.follow_id).toBeGreaterThan(0);
            expect(follower.follower_id).toBeGreaterThan(0);
            expect(follower.followed_id).toBeGreaterThan(0);
          });
          resolve(followers);
        }
      });
  });
}

const getFollowingWithToken = (
  url: string | Application,
  token: string,
): Promise<Follow[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/follows/bytoken/followed`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const following: Follow[] = response.body;
          expect(Array.isArray(following)).toBe(true);
          resolve(following);
        }
      });
  });
}

const deleteFollow = (
  url: string | Application,
  followId: number,
  token: string,
): Promise<MessageResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(`/api/v1/follows/${followId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: MessageResponse = response.body;
          expect(message.message).toBe('Follow removed');
          resolve(message);
        }
      });
  });
};

const getFollowersWithInvalidUserId = (
  url: string | Application,
  userId: number,
): Promise<Follow[]> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/follows/byuser/followers/${userId}`)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const followers: Follow[] = response.body;
          expect(Array.isArray(followers)).toBe(true);
          expect(followers.length).toBe(0);
          resolve(followers);
        }
      });
  });
}

export {postFollow, getFollowersWithToken, getFollowingWithToken, deleteFollow, getFollowersWithInvalidUserId};
