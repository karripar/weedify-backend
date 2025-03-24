import express, {Request, Response} from "express";
import { MessageResponse } from "hybrid-types/MessageTypes";
/*
import routes here from other files
 */

const router = express.Router();

router.get("/", (req: Request, res: Response<MessageResponse>) => {
  res.json({
    message: "routes: under construction",
  });
}
);

/*  routers not created yet

router.use('/recipes', recipeRouter);
router.use('/likes', likeRouter);
router.use('/tags', tagRouter);
router.use('/ratings', ratingRouter);
router.use('/comments', commentRouter);
router.use('/follows', followRouter);
router.use('/notifications', notificationRouter);
router.use('/favorites', favoriteRouter);

*/

export default router;
