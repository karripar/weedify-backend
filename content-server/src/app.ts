import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import {corsSettings} from './lib/functions';
import {notFound, errorHandler} from './middlewares';
import api from './api';

const app = express();
app.use(express.json());

app.use(morgan('dev'));
app.use(cors(corsSettings));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'http://localhost:5173'],
    },
  }),
);

app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);

export default app;
