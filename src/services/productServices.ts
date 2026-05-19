import fs from 'fs/promises';
import pool from '../config/dbConfig';
import { generateId } from '../utils/ulid';
import AppError from '../utils/errorHandling';
import { redis } from '../utils/sessionStore';
import { channel } from '../config/rabbitmq';
import { SearchProductsQuery } from '../types/type';

export async function getDataProducts({ page = 1, limit = 10, prodName, priceStart = 0, priceEnd = 99999999, prodDesc }: SearchProductsQuery) {
    if (priceStart < 0 || priceEnd < 0) {
        throw new AppError('Price must be greater than or equal to 0', 400, []);
    }

    const offset = (page - 1) * limit;

    let query = `SELECT * FROM products WHERE 1=1`;
    let queryCount = `SELECT COUNT(*) FROM products WHERE 1=1`;
    let index = 1;
    let values = [];

    if (prodName) {
        query += ` AND name ilike $${index}`;
        queryCount += ` AND name ilike $${index}`;
        values.push(`${prodName.toLowerCase()}%`);
        index++;
    };
    if (priceStart) {
        query += ` AND price >= $${index}`;
        queryCount += ` AND price >= $${index}`;
        values.push(priceStart);
        index++;
    };

    if (priceEnd) {
        query += ` AND price <= $${index}`;
        queryCount += ` AND price <= $${index}`;
        values.push(priceEnd);
        index++;
    }


    if (prodDesc) {
        query += ` AND description ilike $${index}`;
        queryCount += ` AND description ilike $${index}`;
        values.push(`${prodDesc.toLowerCase()}%`);
        index++;
    };


    query += ` ORDER BY id LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    const countQuery = await pool.query(queryCount, values.slice(0, index - 1));

    const total = parseInt(countQuery.rows[0].count);

    if (total === 0) {
        return {
            data: [],
            total: 0,
            page,
            totalPages: 0
        };
    }

    if (page < 1 || page > Math.ceil(total / limit)) {
        throw new AppError('Page Not Found', 404, []);
    }

    if (limit < 1) {
        throw new AppError('Limit must be greater than 0', 400, []);
    }

    try {
        await redis.set(`products:${JSON.stringify({ prodName, priceStart, priceEnd, prodDesc, page, limit })}`, JSON.stringify({
            data: result.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }), 'EX', 120); // Cache hasil query selama 2 menit
    } catch (err) {
        console.error('Redis error: ', err);
    }

    return {
        data: result.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };

}

export async function createDataProduct(newProduct: { name: string; price: number; description: string; email: string }) {
    const id = generateId();

    const result = await pool.query(
        `INSERT INTO products (id, name, price, description) VALUES ($1, $2, $3, $4)`,
        [id, newProduct.name, newProduct.price, newProduct.description]
    );

    if (result.rowCount === 0) {
        throw new AppError('Failed to create data', 500, []);
    }

    const userEmail = newProduct.email;

    const payload = {
        type: 'SEND_EMAIL',
        email: userEmail,
        subject: 'Product Created',
        text: `Your product "${newProduct.name}" has been created successfully!`
    }

    channel.sendToQueue('email_queue', Buffer.from(JSON.stringify(payload)));

    return;
}

export async function getProductDataById(id: string) {
    const data = await pool.query(`SELECT * FROM products WHERE id = $1`, [id]);

    const item = data.rows[0];

    if (!item) {
        throw new AppError('Data Not Found', 404, []);
    }

    try {
        await redis.set(`productId:${id}`, JSON.stringify(item), 'EX', 120); // Cache hasil query selama 2 menit
    } catch (err) {
        console.error('Redis error: ', err);
    }

    return item;
}

export async function deleteProductDataById(id: string) {
    const data = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING *`, [id]);

    const item = data.rows[0];

    if (!item) {
        throw new AppError('Data Not Found', 404, []);
    }

    return item;
}

export async function getCacheProducts({ prodName, priceStart = 0, priceEnd = 99999999, prodDesc, page = 1, limit = 10 }: SearchProductsQuery) {
    try {
        const value = await redis.get(`products:${JSON.stringify({ prodName, priceStart, priceEnd, prodDesc, page, limit })}`);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.error('Redis error: ', err);
    }
}

export async function getCacheProductById(id: string) {
    try {
        const value = await redis.get(`productId:${id}`);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.error('Redis error: ', err);
    }
}