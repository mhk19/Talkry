import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { getUsers, createUsers, getToken } from './service.js';
import cors from 'cors';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
var __dirname = process.cwd();
const path = __dirname + '/views/';
app.use(express.static(path));

var corsOptions = {
  origin: 'http://localhost:3001',
};

app.use(cors(corsOptions));

app.get('/', (req, res) => {
  res.sendFile(path + 'index.html');
});

app.get('/user', (req, res) => {
  console.log('request in users');
  getUsers(req, res);
});

app.put('/user', (req, res) => {
  createUsers(req, res);
});

app.get('/token', (req, res) => {
  console.log('request in token');
  getToken(req, res);
});

export default app;