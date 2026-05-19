import { createDataProduct, deleteProductDataById, getCacheProductById, getCacheProducts, getDataProducts, getProductDataById } from "../services/productServices";
import { SearchProductsQuery } from "../types/type";
import { Request, Response, NextFunction } from 'express';


export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { prodName, priceStart, priceEnd, prodDesc, page, limit } = req.query as SearchProductsQuery;
        req.log.info({ prodName, priceStart, priceEnd, prodDesc, page, limit }, 'Get products request');

        const resultCache = await getCacheProducts({ prodName, priceStart, priceEnd, prodDesc, page, limit });

        if (resultCache) {
            req.log.info({ prodName, priceStart, priceEnd, prodDesc, total: resultCache.total, page: resultCache.page, totalPages: resultCache.totalPages }, 'Get products from redis cache success');

            return res.status(200).json({
                message: "Data found",
                status: "OK",
                data: resultCache.data,
                metadata: {
                    total: resultCache.total,
                    page: resultCache.page,
                    totalPages: resultCache.totalPages
                }
            });
        } else {
            const result = await getDataProducts({ page, limit, prodName, priceStart, priceEnd, prodDesc });
            req.log.info({ prodName, priceStart, priceEnd, prodDesc, total: result.total, page: result.page, totalPages: result.totalPages }, 'Get products from database success');

            return res.status(200).json({
                message: "Data found",
                status: "OK",
                data: result.data,
                metadata: {
                    total: result.total,
                    page: result.page,
                    totalPages: result.totalPages
                }
            });
        }
    } catch (err) {
        req.log.error(err, 'Get products failed');
        next(err);
    }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, price, description } = req.validatedBody;
        req.log.info({ name }, 'Create product request');

        const { email } = req.user ? req.user : { email: 'Unknown' };

        await createDataProduct({ name, price, description, email });

        req.log.info({ name, price, description }, 'Product created successfully');

        return res.status(201).json({
            message: "Product created successfully",
            status: "Created",
            data: req.validatedBody
        })
    } catch (err) {
        req.log.error(err, 'Create product failed');
        next(err);
    }
}

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        req.log.info({ id }, 'Get product by ID request');

        const resultCache = await getCacheProductById(id);

        if (resultCache) {
            req.log.info({ id }, 'Get product by id from redis cache success');

            return res.status(200).json({
                message: "Data found",
                status: "OK",
                data: resultCache
            })
        } else {
            const result = await getProductDataById(id);

            req.log.info({ id }, 'Get product by ID from database success');

            return res.status(200).json({
                message: "Data found",
                status: "OK",
                data: result
            });
        }
    } catch (err) {
        req.log.error(err, 'Get product by ID failed');
        next(err);
    }
}

export const deleteProductById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id as string;
        req.log.info({ id }, 'Delete product request');

        const result = await deleteProductDataById(id);

        req.log.info({ id }, 'Delete product success');

        return res.status(200).json({
            message: "Data deleted successfully",
            status: "OK",
            data: result
        });
    } catch (err) {
        req.log.error(err, 'Delete product failed');
        next(err);
    }
}