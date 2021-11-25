import express from 'express';
import chalk from 'chalk';
import http from 'http';
import { COOKIE_KEYS, CLIENT_URL, port, DATABASE_URL } from './config/keys';
import useMiddleWare from './middleware/index';
import mongoose from 'mongoose';
import apiRoutes from './routes/apiRoutes';
import authRoutes from './routes/authRoutes';
import './service/passport';
import connectDB from './config/connectDatabase';
import './Models/User';
import socketioService from './service/socket-io-service';

const app = express();
const httpServer = new http.Server(app);

connectDB();
useMiddleWare(app);

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);
socketioService(httpServer);

app.use('/', (req, res) =>
  res.send(`
  <h1>Server is Running :)))</h1>
  <div>The website is now hosted on netlify
    <a href="https://caucus.netlify.app/">https://caucus.netlify.app/</a>
  </div>
`),
);

httpServer.listen(port, () =>
  console.log(chalk.blueBright(`Express Server listening to port ${port}`)),
);

export type ServerType = typeof httpServer;
