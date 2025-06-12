import express from 'express';
import { registerUser,loginUser,deleteUser,updateUser } from '../controllers/users.controller';
const userRouter = express.Router();

userRouter.post('/register',registerUser);
userRouter.post('/login',loginUser);
userRouter.delete('/:id',deleteUser);
userRouter.put('/:id',updateUser);

export default userRouter;