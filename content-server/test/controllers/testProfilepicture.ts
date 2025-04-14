import {ProfilePicture, Recipe} from 'hybrid-types/DBTypes';
import {UploadResponse} from 'hybrid-types/MessageTypes';
import request from 'supertest';
import {Application} from 'express';


const uploadProfilePictureFile = (
  url: string | Application,
  path: string,
  file: string,
  token: string,
): Promise<UploadResponse> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', file)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const upload: UploadResponse = response.body;
          expect(upload.message).toBe('File uploaded');
          expect(upload.data.filename).not.toBe('');
          expect(upload.data.filesize).toBeGreaterThan(0);
          resolve(upload);
        }
      });
  });
}


const postProfilePicture = (
  url: string | Application,
  path: string,
  token: string,
  pic: Partial<Recipe>,
): Promise<{message: string, profile_picture_id: number}> => {
  return new Promise((resolve, reject) => {
    request(url)
      .post(path)
      .set('Authorization', `Bearer ${token}`)
      .send(pic)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const message: {message: string, profile_picture_id: number} = response.body;
          expect(message.message).toBe('Profile picture uploaded');
          expect(message.profile_picture_id).toBeGreaterThan(0);
          resolve(message);
        }
      });
  });
};

const putProfilePicture = (
  url: string | Application,
  path: string,
  token: string,
  pic: Partial<ProfilePicture>,
): Promise<ProfilePicture> => {
  return new Promise((resolve, reject) => {
    request(url)
      .put(path)
      .set('Authorization', `Bearer ${token}`)
      .send(pic)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const profilePicture: ProfilePicture = response.body;
          expect(profilePicture.profile_picture_id).toBeGreaterThan(0);
          expect(profilePicture.user_id).toBeGreaterThan(0);
          expect(profilePicture.filename).not.toBe('');
          resolve(profilePicture);
        }
      });
  });
};

const getProfilePicture = (
  url: string | Application,
  path: string,
  user_id: number,
): Promise<ProfilePicture | null> => {
  return new Promise((resolve, reject) => {
    request(url)
      .get(path + user_id)
      .expect(200, (err, response) => {
        if (err) {
          reject(err);
        } else {
          const profilePicture: ProfilePicture = response.body;
          console.log('profilePicture: ', profilePicture);
          expect(profilePicture.user_id).toBe(user_id);
          expect(profilePicture.filename).not.toBe('');
          resolve(profilePicture);
        }
      });
  });
}


export {uploadProfilePictureFile, postProfilePicture, putProfilePicture, getProfilePicture};
