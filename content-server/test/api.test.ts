import dotenv from 'dotenv';
dotenv.config();
import {Like, Recipe, UserWithNoPassword, User} from 'hybrid-types/DBTypes';
import app from '../src/app';
import randomstring from 'randomstring';
import {UploadResponse} from 'hybrid-types/MessageTypes';
import {
  registerUser,
  loginUser,
  deleteUser,
  getUserByToken,
} from './controllers/testUser';
import {
  uploadFile,
  getRecipeById,
  getRecipes,
  postRecipe,
  deleteRecipe,
  getNotFoundRecipe,
  deleteNotFoundMediaItem,
  postInvalidMediaItem,
  getRecipesByUserId,
  getRecipesByToken,
} from './controllers/testRecipe';

if (!process.env.AUTH_SERVER || !process.env.UPLOAD_SERVER) {
  throw new Error(
    'Missing some of following variables: AUTH_SERVER, UPLOAD_SERVER, CONTENT_SERVER',
  );
}

/*
*******************************************************************************************************

Files in testfiles are in gitignore, so you need to add them manually. Add one image and name it "kissa.jpg"
and one video and name it "ducks.mp4"

*******************************************************************************************************
*/

const authApi = process.env.AUTH_SERVER;
const uploadApi = process.env.UPLOAD_SERVER;

describe('Content Server API Tests', () => {
  let token: string;
  let user: UserWithNoPassword;
  const testUser: Partial<User> = {
    username: 'Test_' + randomstring.generate(5),
    email: randomstring.generate(5) + '@test.com',
    password: 'Abcd-1234',
  };
  it('should create a new user', async () => {
    await registerUser(authApi, '/users', testUser);
  });

  it('should login the user and return user details and token', async () => {
    const loginResponse = await loginUser(authApi, '/auth/login', {
      email: testUser.email!,
      password: testUser.password!,
    });
    token = loginResponse.token;
    user = loginResponse.user;
  });

  let uploadRespponse: UploadResponse;
  it('It should upload a media file', async () => {
    const mediaFile = './testfiles/kissa.jpg';
  });
});
