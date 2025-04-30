import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import {corsSettings} from './lib/functions';
import api from './api';
import {errorHandler, notFound} from './middlewares';

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors(corsSettings));

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
    },
  }),
);

app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);

export default app;
