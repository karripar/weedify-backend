/* eslint-disable @typescript-eslint/no-unused-vars */
import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {promisePool} from '../../lib/db';
import {
  User,
} from 'hybrid-types/DBTypes';
import {UserDeleteResponse, MessageResponse} from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import {customLog, fetchData} from '../../lib/functions';

const getUsernameById = async (
  user_id: number,
): Promise<Partial<User>> => {
  const [rows] = await promisePool.execute<
    RowDataPacket[] & Partial<User>[]>(
      'SELECT username FROM Users WHERE user_id = ?',
    [user_id],
    );
    return rows[0];
}

export {
  getUsernameById
}
