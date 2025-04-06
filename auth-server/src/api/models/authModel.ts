import bcrypt from 'bcryptjs';
import {v4 as uuidv4} from 'uuid';
import { promisePool } from '../../lib/db';
import { RowDataPacket } from 'mysql2';
import { MessageResponse } from 'hybrid-types/MessageTypes';
import { ResetToken } from 'hybrid-types/DBTypes';

const createResetToken = async (
  user_id: number,
): Promise<string> => {
  try {
    const token = uuidv4();

    const expiration = new Date(Date.now() + 3600 * 1000); // 1 hour from now

    await promisePool.execute(`
      INSERT INTO ResetTokens
      (user_id, token, expires_at)
      VALUES (?, ?, ?)`, [user_id, token, expiration])

    return token;
  } catch (error) {
    console.error('Error creating reset token:', error);
    throw new Error('Error creating reset token');
  }
}

const verifyResetToken = async (
  token: string,
): Promise<ResetToken> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & ResetToken[]>(
      'SELECT * FROM ResetTokens WHERE token = ? AND expires_at > NOW()',
      [token],
    );
    return rows[0];
  } catch (error) {
    console.error('Error verifying reset token:', error);
    throw new Error('Error verifying reset token');
  }
}

const updatePassword = async (
  user_id: number,
  password: string,
): Promise<MessageResponse> => {
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await promisePool.execute(
      'UPDATE Users SET password = ? WHERE user_id = ?', [hashedPassword, user_id]);
    await promisePool.execute(
      'DELETE FROM ResetTokens WHERE user_id = ?', [user_id]);
    return {
      message: 'Password updated successfully',
    };
  } catch (error) {
    console.error('Error updating password:', error);
    throw new Error('Error updating password');
  }
}


export {
  createResetToken,
  verifyResetToken,
  updatePassword,
}
