import express from 'express';
import * as AuthControllers from "../controllers/authControllers";
import { validate } from '../middlewares/validate';
import { schemaRegisterUser, schemaLoginUser, schemaRefreshToken } from '../validations/joiValidation';
import multer from 'multer';
import path from 'node:path';
import { authMiddleware } from '../middlewares/authMiddleware';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('path.dirname("public/uploads"):', path.dirname('public/uploads'));
    cb(null, path.join(path.dirname('public/uploads'), '/uploads'))
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '_' + uniqueSuffix + ext)
  }
});

const upload = multer({ storage: storage })

const router = express.Router();

router.post('/register', upload.single('avatar_url'), validate(schemaRegisterUser), AuthControllers.register);

router.post('/login', validate(schemaLoginUser), AuthControllers.login);

router.post('/logout', authMiddleware, AuthControllers.logout);

router.post('/logout-all-devices', authMiddleware, AuthControllers.logoutAllDevices);

router.post('/refresh-token', validate(schemaRefreshToken), AuthControllers.fnRefreshToken);

export default router;