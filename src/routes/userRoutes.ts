import express from 'express';
import * as UserController from '../controllers/userControllers';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/', authMiddleware, UserController.getUsersData);

router.get('/:id', authMiddleware, UserController.getUserDataById);

router.delete('/:id', authMiddleware, UserController.deleteUserData)

export default router;
