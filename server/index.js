import express from 'express';
import {createServer} from 'http';
import "dotenv/config.js"
import cors from 'cors';
import connectDB from './config/mongoDB.js';
import userRouter from './routes/user.routes.js';
const app = express();
const server = createServer(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();
app.use(cors());
const PORT = process.env.PORT || 5000;

app.use('/api/users',userRouter);
server.listen(PORT, () => {
  console.log('Server is running on Port',PORT);
})