import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import {corsSettings} from './utils/settings';
import {notFound, errorHandler} from './middlewares';
import api from './api';

const app = express();
app.use(express.json());

app.use(morgan('dev'));
app.use(cors(corsSettings));
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: ['*'],
      },
    },
  })
);

app.use('/uploads', express.static('uploads'));
app.use('/uploads/profile', express.static('uploads/profile'));

app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);

export default app;
