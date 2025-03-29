import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Comment, UserLevel } from 'hybrid-types/DBTypes';
import { promisePool } from '../../lib/db';
import { MessageResponse } from 'hybrid-types/MessageTypes';
import CustomError from '../../classes/customError';
import { ERROR_MESSAGES } from '../../utils/errorMessages';

// Request a list of comments
const fetchAllComments = async (): Promise<Comment[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Comment[]>(
    'SELECT * FROM Comments',
  );
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.COMMENT.NOT_FOUND, 404);
  }
  return rows;
};

// Request a list of comments by Recipe ID
const fetchCommentsByRecipeId = async (id: number): Promise<Comment[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Comment[]>(
    'SELECT * FROM Comments WHERE recipe_id = ?',
    [id],
  );
  return rows.length > 0 ? rows : [];
};

// Request a count of comments by Recipe ID
const fetchCommentsCountByRecipeId = async (id: number): Promise<number> => {
  const [rows] = await promisePool.execute<
    RowDataPacket[] & { commentsCount: number }[]
  >(
    'SELECT COUNT(*) AS commentsCount FROM Comments WHERE recipe_id = ?',
    [id]
  );
  return rows[0].commentsCount;
};

// Request a list of comments by user ID
const fetchCommentsByUserId = async (id: number): Promise<Comment[]> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Comment[]>(
    'SELECT * FROM Comments WHERE user_id = ?',
    [id],
  );
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.COMMENT.NOT_FOUND_USER, 404);
  }
  return rows;
};

// Request a comment by ID
const fetchCommentById = async (id: number): Promise<Comment> => {
  const [rows] = await promisePool.execute<RowDataPacket[] & Comment[]>(
    'SELECT * FROM Comments WHERE comment_id = ?',
    [id],
  );
  if (rows.length === 0) {
    throw new CustomError(ERROR_MESSAGES.COMMENT.NOT_FOUND, 404);
  }
  return rows[0];
};

// Create a new comment
const postComment = async (
  recipe_id: number,
  user_id: number,
  comment: string,
  reference_comment_id?: number | null,
): Promise<MessageResponse> => {
  const [result] = await promisePool.execute<ResultSetHeader>(
    'INSERT INTO Comments (recipe_id, user_id, comment, reference_comment_id) VALUES (?, ?, ?, ?)',
    [recipe_id, user_id, comment, reference_comment_id],
  );
  if (result.affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.COMMENT.NOT_CREATED, 500);
  }
  return { message: 'Comment added' };
};

// Update a comment
const updateComment = async (
  comment: string,
  comment_id: number,
  user_id: number,
  user_level: UserLevel['level_name'],
): Promise<MessageResponse> => {
  let sql = '';
  if (user_level === 'Admin') {
    sql = 'UPDATE Comments SET comment = ? WHERE comment_id = ?';
  } else {
    sql =
      'UPDATE Comments SET comment = ? WHERE comment_id = ? AND user_id = ?';
  }
  const params =
    user_level === 'Admin'
      ? [comment, comment_id]
      : [comment, comment_id, user_id];

  const [result] = await promisePool.execute<ResultSetHeader>(sql, params);

  if (result.affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.COMMENT.NOT_UPDATED, 404);
  }
  return { message: 'Comment updated' };
};

// Delete a comment
const deleteComment = async (
  id: number,
  user_id: number,
  user_level: UserLevel['level_name'],
): Promise<MessageResponse> => {

  if (user_level !== 'Admin') {
    throw new CustomError(ERROR_MESSAGES.COMMENT.NOT_AUTHORIZED, 401);
  }

  const sql = 'DELETE FROM Comments WHERE comment_id = ?';

  const params = user_level === 'Admin' ? [id] : [id, user_id];

  const [result] = await promisePool.execute<ResultSetHeader>(sql, params);

  if (result.affectedRows === 0) {
    throw new CustomError(ERROR_MESSAGES.COMMENT.NOT_DELETED, 404);
  }
  return { message: 'Comment deleted' };
};

export {
  fetchAllComments,
  fetchCommentsByRecipeId,
  fetchCommentsCountByRecipeId,
  fetchCommentsByUserId,
  fetchCommentById,
  postComment,
  updateComment,
  deleteComment,
};
