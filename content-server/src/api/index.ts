import express, {Request, Response} from 'express';
import {MessageResponse} from 'hybrid-types/MessageTypes';
import likeRouter from './routes/likeRoute';
import recipeRouter from './routes/recipeRoute';
import commentRouter from './routes/commentRoute';
import followRouter from './routes/followRoute';
import favoriteRouter from './routes/favoriteRouter';
import notificationRouter from './routes/notificationRoute';
import dietaryRouter from './routes/dietaryRoute';
import ratingRouter from './routes/ratingRouter';
import ingredientRouter from './routes/ingredientRoute';
/*
import routes here from other files
 */

const router = express.Router();

router.get('/', (req: Request, res: Response<MessageResponse>) => {
  res.json({
    message: 'Routes in use: /recipes, /likes, /ratings, /comments, /follows, /notifications, /favorites, /dietary, /ingredients',
  });
});

//  commented ones not created yet, see auth-server for example structure and apidoc examples
//  remove comments when needed
//  routers are missing endpoints as well, check which ones are needed

router.use('/recipes', recipeRouter);
router.use('/likes', likeRouter);
router.use('/ratings', ratingRouter);
router.use('/comments', commentRouter);
router.use('/follows', followRouter);
router.use('/notifications', notificationRouter);
router.use('/favorites', favoriteRouter);
router.use('/dietary', dietaryRouter);
router.use('/ingredients', ingredientRouter);

export default router;
