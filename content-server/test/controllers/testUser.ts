import dotenv from 'dotenv';
dotenv.config();
import {
  User,
  UserWithDietaryIds,
  UserWithDietaryInfo,
} from 'hybrid-types/DBTypes';
import request from 'supertest';
import {Application} from 'express';
import {
  LoginResponse,
  UserDeleteResponse,
  UserResponse,
} from 'hybrid-types/MessageTypes';

// registerUser function is used to register a new user and check the response
const registerUser = (
  url: string | Application,
  path: string,
  user: Partial<User>,
): Promise<UserResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(path)
      .send(user)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const newUser: UserResponse = res.body;
          expect(newUser.message).toBe('User created');
          expect(newUser.user.username).toBe(user.username);
          expect(newUser.user.email).toBe(user.email);
          expect(newUser.user.user_id).toBeGreaterThan(0);
          resolve(newUser);
        }
      });
  });
};

// This function is used to login a user and check the response
const loginUser = (
  url: string | Application,
  path: string,
  user: {email: string; password: string},
): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(path)
      .send(user)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const login: LoginResponse = res.body;
          expect(login.message).toBe('Login successful');
          expect(login.token).not.toBe('');
          expect(login.user.username).not.toBe('');
          expect(login.user.email).not.toBe('');
          expect(login.user.user_id).toBeGreaterThan(0);
          resolve(login);
        }
      });
  });
};

// This function is used to delete a user and check the response
const deleteUser = (
  url: string | Application,
  path: string,
  token: string,
): Promise<UserDeleteResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .delete(path)
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const deleteResponse: UserDeleteResponse = res.body;
          resolve(deleteResponse);
        }
      });
  });
};

// This function is used to get a user by token and check the response
const getUserByToken = (
  url: string | Application,
  token: string,
): Promise<Partial<User>> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get('/users/bytoken')
      .set('Authorization', `Bearer ${token}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const user: Partial<User> = res.body;
          expect(user.username).not.toBe('');
          expect(user.email).not.toBe('');
          expect(user.user_id).toBeGreaterThan(0);
          expect(user.user_level_id).toBe(2);
          expect(user.created_at).not.toBe('');
          resolve(user);
        }
      });
  });
};

const checkIfEmailExists = (
  url: string | Application,
  email: string,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/users/email/${email}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const exists: {exists: boolean} = res.body;
          expect(exists.exists).toBe(true);
          resolve(exists.exists);
        }
      });
  });
};

const checkIfUsernameExists = (
  url: string | Application,
  username: string,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/users/username/${username}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const exists: {exists: boolean} = res.body;
          expect(exists.exists).toBe(true);
          resolve(exists.exists);
        }
      });
  });
};

const updateUser = (
  url: string | Application,
  token: string,
  user: Partial<UserWithDietaryIds>,
): Promise<UserWithDietaryInfo> => {
  return new Promise((resolve, reject) => {
    request(url)
      .put('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send(user)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const updatedUser: UserWithDietaryInfo = res.body;
          expect(updatedUser.username).toBe(user.username);
          expect(updatedUser.email).toBe(user.email);
          resolve(updatedUser);
        }
      });
  });
};

const getUserById = (
  url: string | Application,
  userId: number,
): Promise<UserWithDietaryInfo> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(`/api/v1/users/byuserid/${userId}`)
      .expect(200, (err, res) => {
        if (err) {
          reject(err);
        } else {
          const user: UserWithDietaryInfo = res.body;
          expect(user.username).not.toBe('');
          expect(user.email).not.toBe('');
          expect(user.user_id).toBe(userId);
          expect(user.user_level_id).toBe(2);
          expect(user.dietary_restrictions).not.toBe('');
          expect(user.created_at).not.toBe('');
          expect(user.user_level_id).toBeGreaterThan(0);
          resolve(user);
        }
      });
  });
};

export {
  registerUser,
  loginUser,
  deleteUser,
  getUserByToken,
  checkIfEmailExists,
  checkIfUsernameExists,
  updateUser,
  getUserById,
};
