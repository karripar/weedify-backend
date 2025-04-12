/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from 'dotenv';
dotenv.config();
import {Like, Recipe, UserWithNoPassword, User, RecipeWithDietaryIds, RecipeWithDietaryInfo} from 'hybrid-types/DBTypes';
import app from '../src/app';
import randomstring from 'randomstring';
import {UploadResponse} from 'hybrid-types/MessageTypes';
import { describe } from 'node:test';
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
import {
  postLike,
  deleteLike,
  getNotFoundLike,
  postInvalidLike,
  getLikesByUser,
  getLikeByRecipeIdAndUserId,
} from './controllers/testLike';
import {
  postComment,
  getComments,
  deleteComment,
  getNotFoundComment,
  postInvalidComment,
  deleteInvalidComment,
} from './controllers/testComment';
import {
  getRecipeDietTypes,
  getAllDietTypes,
  GetMostPopularDietaryTypes,
} from './controllers/testDietary';
import {
  uploadProfilePictureFile,
  postProfilePicture,
  putProfilePicture,
  getProfilePicture,
} from './controllers/testProfilepicture';

import {
  postFavorite,
  getFavoritesByUserId,
  deleteFavorite,
  getNegativeFavoriteStatus,
} from './controllers/testFavorite';
import {
  checkIfNotificationsEnabled,
  getUserNotifications,
  MarkNotificationAsArchived,
  MarkNotificationAsRead,
  toggleNotificationEnabled,
} from './controllers/testNotification';

import {
  postRating,
  getRatingByUserId,
  checkIfRatingExists,
  deleteRating,
  getRatingsByRecipeId,
} from './controllers/testRating';

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


  let uploadResponse: UploadResponse;
  it('It should upload a media file', async () => {
    const mediaFile = './test/testfiles/kissa.jpg';

    uploadResponse = await uploadFile(
      uploadApi,
      '/upload',
      mediaFile,
      token,
    )
  });

  let testRecipeItem: {message: string; recipe_id: number};

  it('Should post a recipe item with file response', async () => {
    if (uploadResponse.data) {
      const recipe = {
        title: 'Test recipe',
        instructions: 'These are the instructions for the test recipe. Please follow them carefully.',
        cooking_time: 10,
        filename: 'recipe.jpg',
        filesize: 12345,
        media_type: 'image/jpeg',
        difficulty_level_id: 1,
        ingredients: [
          { name: 'Avokado', amount: 1, unit: 'kpl' },
          { name: 'Kananmuna', amount: 2, unit: 'kpl' },
        ],
        dietary_info: [1, 2],
      };


      const response = await postRecipe(
        app, // app wasn't working for some reason
        '/api/v1/recipes',
        token,
        recipe
      )

      console.log('recipe post response:', response);

      expect(response.message).toBe('Recipe created');
      expect(response.recipe_id).toBeGreaterThan(0);
      testRecipeItem = response;
    }
  });


});
