import express, {Request, Response} from "express";
import { MessageResponse } from "hybrid-types/MessageTypes";
import likeRouter from "./routes/likeRoute";
import recipeRouter from "./routes/recipeRoute";
import commentRouter from "./routes/commentRoute";
import followRouter from "./routes/followRoute";
import favoriteRouter from "./routes/favoriteRouter";
import notificationRouter from "./routes/notificationRoute";
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

//  commented ones not created yet, see auth-server for example structure and apidoc examples
//  remove comments when needed
//  routers are missing endpoints as well, check which ones are needed

router.use('/recipes', recipeRouter);
router.use('/likes', likeRouter)
//router.use('/tags', tagRouter);
//router.use('/ratings', ratingRouter);
router.use('/comments', commentRouter);
router.use('/follows', followRouter);
router.use('/notifications', notificationRouter);
router.use('/favorites', favoriteRouter);


export default router;
