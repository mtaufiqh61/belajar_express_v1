import express from 'express';
import * as ProductController from '../controllers/productControllers';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { schemaCreateProduct } from '../validations/joiValidation';


const router = express.Router();


router.get('/', authMiddleware, ProductController.getProducts);

router.post('/', authMiddleware, validate(schemaCreateProduct), ProductController.createProduct);

router.get('/:id', authMiddleware, ProductController.getProductById);

router.delete('/:id', authMiddleware, ProductController.deleteProductById);

export default router;