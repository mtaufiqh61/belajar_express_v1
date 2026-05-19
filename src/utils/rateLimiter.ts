import rateLimit from "express-rate-limit";
import { redis } from "./sessionStore";
import { RedisStore } from 'rate-limit-redis';

function rateLimiterFn(type: string) {
    let rl;
    if (type === 'auth') {
        rl = rateLimit({
            windowMs: 10 * 60 * 1000,
            limit: 5,
            statusCode: 429,
            message: {
                message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
                status: "error",
                errors: [{ field: 'email', message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti.' }]
            },
            store: redis.status === 'ready' ? new RedisStore({
                sendCommand: (...args: [string, ...string[]]) => redis.call(...args) as Promise<any>,
                prefix: 'auth-limiter:' // Prefix khusus untuk rate limiter auth
            }) : undefined,
        })
    } else if (type === 'general') {
        rl = rateLimit({
            windowMs: 15 * 60 * 1000,
            limit: 300,
            statusCode: 429,
            message: {
                message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
                status: "error",
                errors: [{ field: 'general', message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' }]
            },
            store: redis.status === 'ready' ? new RedisStore({
                sendCommand: (...args: [string, ...string[]]) => redis.call(...args) as Promise<any>,
                prefix: 'api-limiter:' // Prefix khusus untuk rate limiter umum
            }) : undefined,
        })
    } else {
        throw new Error(`Unknown rate limiter type: ${type}`);
    }

    return rl;
}


export default rateLimiterFn;