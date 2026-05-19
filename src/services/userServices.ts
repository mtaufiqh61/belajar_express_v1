import pool from '../config/dbConfig';
import { SearchUsersQuery } from '../types/type';
import AppError from '../utils/errorHandling';
import { redis } from '../utils/sessionStore';

export async function getUsers({ page = 1, limit = 10, searchName, searchEmail }: SearchUsersQuery) {
    const offset = (page - 1) * limit;

    let query = `SELECT id, name, email, avatar_url, created_at, updated_at FROM users WHERE 1=1`;
    let countQuery = `SELECT COUNT(id) FROM users WHERE 1=1`;

    const values = [];
    let index = 1;


    if (searchName) {
        query += ` AND name ILIKE $${index}`;
        countQuery += ` AND name ILIKE $${index}`;
        values.push(`${searchName}%`);
        index++
    }

    if (searchEmail) {
        query += ` AND email ILIKE $${index}`;
        countQuery += ` AND email ILIKE $${index}`;
        values.push(`${searchEmail}%`);
        index++
    }

    query += ` LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const dataQuery = await pool.query(query, values);
    const countResult = await pool.query(
        countQuery,
        values.slice(0, index - 1) // tanpa limit & offset
    );

    const total = parseInt(countResult.rows[0].count);

    if (total === 0) {
        return {
            result: [],
            total,
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
        await redis.set(`users:${JSON.stringify({ searchName, searchEmail, page, limit })}`, JSON.stringify({
            result: dataQuery.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }), 'EX', 120);

    } catch (err) {
        console.error('redis error: ', err);
    }

    return {
        result: dataQuery.rows,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

export async function getUserById(id: string) {
    const data = await pool.query(`SELECT id, name, email, avatar_url, created_at, updated_at FROM users where id = $1`, [id]);

    try {
        await redis.set(`userId:${id}`, JSON.stringify(data.rows[0]), 'EX', 120);
    } catch (err) {
        console.error('Redis error: ', err);
    }

    if (data.rows.length === 0) {
        throw new AppError('Data Not Found', 404, []);
    }

    return data.rows[0];
}

export async function deleteUserById(id: string) {
    const data = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING *`, [id]);

    if (data.rows.length === 0) {
        throw new AppError('Data Not Found', 404, []);
    }

    return data.rows[0];
}

export async function getCacheUsers({ searchName, searchEmail, page = 1, limit = 10 }: SearchUsersQuery) {
    try {
        const value = await redis.get(`users:${JSON.stringify({ searchName, searchEmail, page, limit })}`);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.error('Redis error: ', err);
        return null;
    }
}

export async function getCacheUserById(id: string) {
    try {
        const value = await redis.get(`userId:${id}`);
        return value ? JSON.parse(value) : null;
    } catch (err) {
        console.error('Redis error: ', err);
        return null;
    }
}