import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/dbConfig';
import { generateId } from '../utils/ulid';
import AppError from '../utils/errorHandling';
import { redis } from '../utils/sessionStore';
import { channel } from '../config/rabbitmq';

async function getUserByEmail(email: string): Promise<{ id: string; name: string; email: string; password: string } | null> {
    let data: any;
    try {
        data = await pool.query(`SELECT id, name, email, password FROM users where email = $1 LIMIT 1`, [email]);
    } catch (err) {
        console.error('Database error: ', err);
        throw new AppError('Internal Server Error', 500, []);
    }

    if (data.rows.length === 0) {
        return null;
    }

    return data.rows[0];

}

export async function loginUser({ email, password }: { email: string; password: string }) {

    const user = await getUserByEmail(email);

    if (!user) {
        throw new AppError('Invalid email or password', 404, []);
    }

    console.log('LOGIN APP:', process.env.INSTANCE_NAME);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 404, []);
    }

    const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.SECRET_KEY || 'default_secret_key',
        { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.REFRESH_SECRET_KEY || 'default_refresh_secret_key',
        { expiresIn: '7d' }
    );


    try {
        await redis.set(`session:${accessToken}`, user.id, 'EX', 1800); // Set session to expire in 30 minutes (1800 seconds)
        await redis.set(`refresh-session:${refreshToken}`, user.id, 'EX', 604800); // Set session to expire in 7 days (604800 seconds)
        await redis.set(`refresh-access:${refreshToken}`, accessToken); // Map refresh token to access token for easy invalidation
        await redis.lpush(`user-session:${user.id}`, accessToken, refreshToken); // Store both access and refresh tokens in the user's session list 
    } catch (error) {
        console.error('Error occurred while setting Redis keys:', error);
    }

    return {
        user: { id: user.id, email: user.email },
        accessToken,
        refreshToken
    }
}

export async function registerUser(newUser: { name: string; email: string; password: string; avatar_url: string }) {

    const id = generateId();
    const saltRound = 12;
    const existingUser = await getUserByEmail(newUser.email);
    if (existingUser) {
        throw new AppError('User already exists', 409, []);
    }

    const hashedPassword = await bcrypt.hash(newUser.password, saltRound);

    await pool.query(
        `INSERT INTO users (id, name, email, password, avatar_url) 
        VALUES ($1, $2, $3, $4, $5)`,
        [id, newUser.name, newUser.email, hashedPassword, newUser.avatar_url]
    );


    // ✅ hanya kirim job ke queue
    const payload = {
        type: 'SEND_EMAIL',
        email: newUser.email
    };

    channel.sendToQueue('email_queue', Buffer.from(JSON.stringify(payload)));

    return { id };
}

export async function logoutUser(token: string, refreshToken: string, userId: string) {
    try {
        await redis.del(`session:${token}`);
        await redis.del(`refresh-session:${refreshToken}`);
        await redis.del(`refresh-access:${refreshToken}`);
        await redis.lrem(`user-session:${userId}`, 0, token);
    } catch (err) {
        console.error('Redis error: ', err);
        throw new AppError('Logout failed', 500, []);
    }

}

export async function serviceLogoutAllDevices(userId: string, refreshToken: string) {
    try {
        const userSession = await redis.lrange(`user-session:${userId}`, 0, -1);
        for (const token of userSession) {
            await redis.del(`session:${token}`);
        }
        await redis.del(`refresh-session:${refreshToken}`);
        await redis.del(`refresh-access:${refreshToken}`);
        await redis.del(`user-session:${userId}`);
    } catch (err) {
        console.error('Redis error: ', err);
        throw new AppError('Logout all devices failed', 500, []);
    }
}

export async function invalidateRefreshToken(refreshToken: string, userId: string) {
    try {
        const userSession = await redis.get(`refresh-session:${refreshToken}`);
        if (!userSession) {
            throw new AppError('Session expired or invalid', 401, [{ field: 'refreshToken', message: 'Session expired or invalid' }] as any);
        }

        // Invalidate old access token session
        const value = await redis.get(`refresh-access:${refreshToken}`);
        await redis.del(`session:${value}`); // Remove old access token session
        await redis.del(`refresh-access:${refreshToken}`); // Remove old refresh-access mapping
        await redis.lrem(`user-session:${userId}`, 0, value || 0); // Remove old access token from user's session list
    } catch (err) {
        console.error('Redis error: ', err);
    }
}

export async function validateRefreshToken(newAccessToken: string, refreshToken: string, userId: string) {
    // Store new access token session in Redis
    try {
        await redis.set(`session:${newAccessToken}`, userId, 'EX', 1800); // Set new session to expire in 30 minutes (1800 seconds)
        await redis.set(`refresh-access:${refreshToken}`, newAccessToken); // Update refresh-access mapping with new access token
        await redis.lpush(`user-session:${userId}`, newAccessToken); // Store new access token in the user's session list
    } catch (err) {
        console.error('Redis error: ', err);
    }
}