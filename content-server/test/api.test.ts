import dotenv from 'dotenv';
dotenv.config();
import {Like, Recipe, UserWithNoPassword, User} from 'hybrid-types/DBTypes';
import app from '../src/app';
import randomstring from 'randomstring';
import { UploadResponse } from 'hybrid-types/MessageTypes';

if (!process.env.AUTH_SERVER || !process.env.UPLOAD_SERVER) {
  throw new Error('Missing some of following variables: AUTH_SERVER, UPLOAD_SERVER, CONTENT_SERVER');
}

const authApi = process.env.AUTH_SERVER;
const uploadApi = process.env.UPLOAD_SERVER;

describe('Content Server API Tests', () => {
  let token: string;
  let user: UserWithNoPassword;
  const testUser: Partial<User> = {
    username: 'Test_'+randomstring.generate(5),
    email: randomstring.generate(5)+'@test.com',
    password: 'Abcd-1234'
  };
  it ('should create a new user', async () => {
    //await registerUser(authApi, '/users', testUser) needs to be implemented
  })
})
