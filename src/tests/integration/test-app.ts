import express from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import routes from '../../app/routes/routes';
import HttpException from '../../app/models/http-exception.model';

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(routes);

  app.get('/', (req: express.Request, res: express.Response) => {
    res.json({ status: 'API is running on /api' });
  });

  /* eslint-disable */
  app.use(
    (
      err: Error | HttpException,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err && (err as any).name === 'UnauthorizedError') {
        return res.status(401).json({
          status: 'error',
          message: 'missing authorization credentials',
        });
      } else if (err && (err as any).errorCode) {
        res.status((err as any).errorCode).json(err.message);
      } else if (err) {
        res.status(500).json(err.message);
      }
    },
  );

  return app;
};

export default createApp;
