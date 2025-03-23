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

export default router;
