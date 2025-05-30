/* eslint-disable @typescript-eslint/no-unused-vars */
import dotenv from 'dotenv';
dotenv.config();
import {
  Like,
  Recipe,
  UserWithNoPassword,
  User,
  RecipeWithDietaryIds,
  RecipeWithDietaryInfo,
  ProfilePicture,
  UserWithDietaryIds,
  UserWithDietaryInfo,
} from 'hybrid-types/DBTypes';
import app from '../src/app';
import randomstring from 'randomstring';
import {UploadResponse} from 'hybrid-types/MessageTypes';
import {describe} from 'node:test';
import {
  registerUser,
  loginUser,
  deleteUser,
  getUserByToken,
  getUserWithInvalidToken,
  checkIfEmailAvailable,
  checkIfUsernameAvailable,
  getEmailNotAvailable,
  getUsernameNotAvailable,
  updateUser
} from './controllers/testUser';
import {
  uploadFile,
  getRecipeById,
  getRecipes,
  postRecipe,
  deleteRecipe,
  getNotFoundRecipe,
  deleteNotFoundMediaItem,
  postInvalidRecipe,
  getRecipesByUserId,
  getRecipesByToken,
  updateRecipe,
  getFollowedUsersRecipes
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
  getUserComments,
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
  toggleNotificationEnabled,
  getAllNotifications
} from './controllers/testNotification';

import {
  postRating,
  getRatingByUserId,
  checkIfRatingExists,
  deleteRating,
  getRatingsByRecipeId,
} from './controllers/testRating';

import {
  postFollow,
  getFollowersWithToken,
  getFollowingWithToken,
  deleteFollow,
  getFollowersWithInvalidUserId,
} from './controllers/testFollow';

if (!process.env.AUTH_SERVER || !process.env.UPLOAD_SERVER) {
  throw new Error(
    'Missing some of following env variables: AUTH_SERVER, UPLOAD_SERVER',
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
const testName = 'Test_' + randomstring.generate(5);
const testEmail = randomstring.generate(5) + '@test.com';

describe('Content Server API Tests', () => {
  let token: string;
  let user: UserWithNoPassword;
  const testUser: Partial<User> = {
    username: 'Test_' + randomstring.generate(5),
    email: randomstring.generate(5) + '@test.com',
    password: 'Abcd-1234',
  };

  it('It should result in email being available', async () => {
    await checkIfEmailAvailable(authApi, testEmail);
  });

  it('It should result in username being available', async () => {
    await checkIfUsernameAvailable(authApi, testName);
  });

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

  it('should get username not available', async () => {
    await getUsernameNotAvailable(authApi, user.username);
  });

  it('should get email not available', async () => {
    await getEmailNotAvailable(authApi, user.email);
  });

  let uploadResponse: UploadResponse;
  it('It should upload a media file', async () => {
    const mediaFile = './test/testfiles/kissa.jpg';

    uploadResponse = await uploadFile(uploadApi, '/upload', mediaFile, token);
  });

  let testRecipeItem: {message: string; recipe_id: number};

  it('Should post a recipe item with file response', async () => {
    if (uploadResponse.data) {
      const recipe = {
        title: 'Test recipe',
        instructions:
          'These are the instructions for the test recipe. Please follow them carefully.',
        cooking_time: 10,
        filename: 'recipe.jpg',
        filesize: 12345,
        media_type: 'image/jpeg',
        difficulty_level_id: 1,
        portions: 4,
        ingredients: [
          {
            name: 'Avokado',
            amount: 1,
            unit: 'kpl',
            fineli_id: 345,
            energy_kcal: 100,
            protein: 5,
            fat: 1,
            carbohydrate: 10,
            fiber: 2,
            sugar: 5},
          {
            name: 'Kananmuna',
            amount: 2,
            unit: 'kpl',
            fineli_id: 34,
            energy_kcal: 100,
            protein: 5,
            fat: 1,
            carbohydrate: 10,
            fiber: 2,
            sugar: 5
          },
        ],
        dietary_info: [1, 2],
      };

      const response = await postRecipe(
        app, // app wasn't working for some reason
        '/api/v1/recipes',
        token,
        recipe,
      );

      console.log('recipe post response:', response);

      expect(response.message).toBe('Recipe created');
      expect(response.recipe_id).toBeGreaterThan(0);
      testRecipeItem = response;
    }
  });

  it('should get the recipe by id', async () => {
    const recipe_id = testRecipeItem.recipe_id;
    await getRecipeById(app, recipe_id);
  });

  it('should get all recipes', async () => {
    await getRecipes(app);
  });

  it('should get recipes by user id', async () => {
    await getRecipesByUserId(app, user.user_id);
  });

  it('should get recipes by token', async () => {
    await getRecipesByToken(app, token);
  });

  it('should get not found recipe', async () => {
    await getNotFoundRecipe(app, 99999999);
  });

  it('should get user by token', async () => {
    await getUserByToken(authApi, token);
  });

  const invalidRecipe = {
    title: 'Test recipe',
    instructions:
      'These are the instructions for the test recipe. Please follow them carefully.',
    cooking_time: 10,
    filename: '', // invalid filename
    filesize: 12345,
    media_type: 'image/jpeg',
    difficulty_level_id: 19, // invalid difficulty level
    portions: 0, // invalid portions
    ingredients: [
      {name: 'Kurkku', amount: 1, unit: 'kpl'},
      {name: 'Appelsiini', amount: 2, unit: 'kpl'}, // missing required fields
    ],
    dietary_info: [1, 2],
  };

  it('should post invalid recipe and fail', async () => {
    await postInvalidRecipe(app, token, invalidRecipe);
  });

  it('should post a like to a recipe', async () => {
    await postLike(app, testRecipeItem.recipe_id, token);
  });

  let likeId: number;
  it('should get likes by user id', async () => {
    const like = await getLikesByUser(app, user.user_id);
    if (like) {
      likeId = like[0].like_id;
    }
  });

  it('should get like by recipe id and user id', async () => {
    await getLikeByRecipeIdAndUserId(
      app,
      testRecipeItem.recipe_id,
      token,
      user.user_id,
    );
  });

  it('should get not found like', async () => {
    await getNotFoundLike(app, 99999999);
  });

  it('should update the recipe', async () => {
    const updatedRecipe = {
      title: 'Updated test recipe',
      instructions: 'These are the updated instructions for the test recipe. Please follow them carefully.',
      cooking_time: 20,
      difficulty_level_id: 2,
      portions: 4,
      ingredients: [
        {
          name: 'Updated ingredient',
          amount: 2,
          unit: 'kpl',
          fineli_id: 123,
          energy_kcal: 200,
          protein: 10,
          fat: 2,
          carbohydrate: 20,
          fiber: 4,
          sugar: 10,
        },
        {
          name: 'Another updated ingredient',
          amount: 3,
          unit: 'kpl',
          fineli_id: 456,
          energy_kcal: 300,
          protein: 15,
          fat: 3,
          carbohydrate: 30,
          fiber: 6,
          sugar: 15,
        },
      ],
      dietary_info: [1, 2],
    };

    await updateRecipe(
      app,
      '/api/v1/recipes/' + testRecipeItem.recipe_id,
      token,
      testRecipeItem.recipe_id,
      updatedRecipe,
    );
  });

  it('should post invalid like and fail', async () => {
    await postInvalidLike(app, 9999, token);
  });

  it('should delete the like', async () => {
    await deleteLike(app, likeId, token);
  });

  let testComment;
  it('should post a comment to a recipe', async () => {
    await postComment(
      app,
      testRecipeItem.recipe_id,
      token,
      'This is a test comment',
    );
  });

  let testCommentId: number;

  it('should get user comments', async () => {
    const comment = await getUserComments(app, token);
    if (comment) {
      testCommentId = comment[0].comment_id;
    }
  });

  it('should get comments for a recipe', async () => {
    await getComments(app, testRecipeItem.recipe_id);
  });

  it('should get not found comment', async () => {
    await getNotFoundComment(app, 99999999);
  });

  it('should post invalid comment and fail', async () => {
    await postInvalidComment(app, 99999999, token);
  });

  it('should delete invalid comment and fail', async () => {
    await deleteInvalidComment(app, 99999999, token);
  });

  it('deleting comment should be unauthorized', async () => {
    await deleteComment(app, testCommentId, token);
  });

  it('Should follow a user', async () => {
    await postFollow(app, 1, token);
  });

  it('Should get followers with token', async () => {
    await getFollowersWithToken(app, token);
  });

  let testFollowId: number;
  it('Should get following with token', async () => {
    const response = await getFollowingWithToken(app, token);
    if (response.length > 0) {
      testFollowId = response[0].follow_id;
    }
  });

  it('Should get followed users recipes', async () => {
    await getFollowedUsersRecipes(app, token);
  });

  it('Should delete the follow', async () => {
    await deleteFollow(app, testFollowId, token);
  });

  it('Should get followers with invalid user id', async () => {
    await getFollowersWithInvalidUserId(app, 99999999);
  });

  it('Should get recipe diet types', async () => {
    await getRecipeDietTypes(app, testRecipeItem.recipe_id);
  });

  it('Should get all diet types', async () => {
    await getAllDietTypes(app);
  });

  it('Should get most popular dietary types', async () => {
    await GetMostPopularDietaryTypes(app);
  });

  let profileResponse: UploadResponse;
  it('Should upload a profile picture file', async () => {
    const mediaFile = './test/testfiles/kissa.jpg';

    profileResponse = await uploadProfilePictureFile(
      uploadApi,
      '/upload/profile',
      mediaFile,
      token,
    );
  });

  it('Should post a profile picture', async () => {
    if (profileResponse.data) {
      const profileItem: Partial<ProfilePicture> = {
        filename: profileResponse.data.filename,
        filesize: profileResponse.data.filesize,
        media_type: profileResponse.data.media_type,
      };

      await postProfilePicture(
        authApi,
        '/users/profilepicture',
        token,
        profileItem,
      );
    }
  });

  it('Should put a profile picture', async () => {
    if (profileResponse.data) {
      const profileItem: Partial<ProfilePicture> = {
        filename: profileResponse.data.filename,
        filesize: profileResponse.data.filesize,
        media_type: profileResponse.data.media_type,
      };

      await putProfilePicture(
        authApi,
        '/users/profilepicture/change',
        token,
        profileItem,
      );
    }
  });

  it('should update user details', async () => {
    const updatedUser = {
      username: 'Updated_' + randomstring.generate(5),
      email: randomstring.generate(5) + '@test.com',
      bio: 'This is an updated bio',
      dietary_info: [1, 2],
    };
    await updateUser(authApi, '/users/user/update', token, updatedUser);
  });

  it('Should get profile picture', async () => {
    await getProfilePicture(authApi, '/users/profilepicture/', user.user_id);
  });

  it('should fail to access a protected route with an invalid token (jwt malformed)', async () => {
    await getUserWithInvalidToken(authApi, 'invalid_token');
  });

  it('should check if notifications are enabled', async () => {
    await checkIfNotificationsEnabled(app, user.user_id);
  });

  it('should toggle notification enabled', async () => {
    await toggleNotificationEnabled(app, token);
  });

  it('should get all notifications', async () => {
    await getAllNotifications(app);
  });

  const rating = {
    rating: 5,
    review: 'This is a test review',
  }
  it('Should post a rating to a recipe', async () => {
    await postRating(app, testRecipeItem.recipe_id, rating, token);
  });

  let ratingId: number;
  it('Should get rating by user id', async () => {
    const rating = await getRatingByUserId(app, token);
    if (rating) {
      ratingId = rating[0].rating_id;
    }
  });

  it('Should check if rating exists', async () => {
    await checkIfRatingExists(app, testRecipeItem.recipe_id, token);
  });

  it('Should get ratings by recipe id', async () => {
    await getRatingsByRecipeId(app, testRecipeItem.recipe_id);
  });

  it('Should delete the rating', async () => {
    await deleteRating(app, ratingId, token);
  });

  it('should post a favorite to a recipe', async () => {
    await postFavorite(app, testRecipeItem.recipe_id, token);
  });

  let favoriteId: number;
  it('should get favorites by user id', async () => {
    await getFavoritesByUserId(app, user.user_id, token);
  });

  it('should get negative favorite status', async () => {
    await getNegativeFavoriteStatus(app, 999, token);
  });

  it('should delete the favorite', async () => {
    await deleteFavorite(app, testRecipeItem.recipe_id, token);
  });

  it('should delete the recipe', async () => {
    await deleteRecipe(app, testRecipeItem.recipe_id, token);
  });

  it('should fail to delete the already deleted recipe', async () => {
    await deleteNotFoundMediaItem(app, testRecipeItem.recipe_id, token);
  });

  it('should delete the user', async () => {
    await deleteUser(authApi, '/users', token);
  });
})

