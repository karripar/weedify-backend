import express, {Request, Response} from 'express';

import userRoute from './routes/userRoute';
import authRoute from './routes/authRoute';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Routes in use: users, auth',
  })
}
);

router.use('/users', userRoute);
router.use('/auth', authRoute);

export default router;
