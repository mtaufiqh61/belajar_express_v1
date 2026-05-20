import { invalidateRefreshToken, loginUser, logoutUser, registerUser, serviceLogoutAllDevices, validateRefreshToken } from "../services/authServices";
import AppError from "../utils/errorHandling";
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from "../types/type";

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.validatedBody;
        req.log.info({ email }, 'Login request');

        const result = await loginUser({ email, password });

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        req.log.info({
            userId: result.user.id,
            email
        }, 'User Login Success');

        return res.status(200).json({
            message: "Berhasil Login",
            status: "OK",
            data: {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken
            }
        })
    } catch (err: any) {
        if (err.message === 'Invalid email or password') {
            req.log.warn({ email: req.validatedBody.email }, 'Invalid login attempt');
        }

        req.log.error(err, 'Login failed');
        next(err);
    }
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.validatedBody;
        req.log.info({ email }, 'register request');
        
        if(!req.file) {
            throw new AppError('Avatar file is required', 400, [{ field: 'avatar_url', message: 'Avatar file is required' }] as any);
        }

        if(!['image/jpeg', 'image/jpg', 'image/png'].includes(req.file.mimetype)) {
            throw new AppError('Invalid file type. Only JPEG, JPG, and PNG are allowed.', 400, [{ field: 'avatar_url', message: 'Invalid file type. Only JPEG, JPG, and PNG are allowed.' }] as any);
        }

        if (req.file.size > 5 * 1024 * 1024) {
            throw new AppError('File too large', 400, [{ field: 'avatar_url', message: 'File too large. Maximum size is 5MB.' }] as any );
        }

        const result = await registerUser({ name, email, password, avatar_url: req.file.path });

        req.log.info({
            userId: result.id,
            name,
            email
        }, 'User register Success');

        return res.status(201).json({
            message: "Create user successfully",
            status: "Created",
            data: {
                userId: result.id,
                name,
                email
            }
        })
    } catch (err: any) {
        if (err.message === 'User already exists') {
            req.log.warn({ email: req.validatedBody.email }, 'Invalid register ');
        }

        req.log.error(err, 'register failed');
        next(err);
    }
}

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, id } = req.user ? req.user : { email: 'Unknown', id: 'Unknown' };
        const token = req.token;
        req.log.info({ email }, 'Request logout');
        const refreshToken = req.cookies.refreshToken;

        if (!token || !refreshToken) {
            throw new AppError('Missing token or refresh token', 400, [{ field: 'token', message: 'Token and refresh token are required' }] as any);
        }

        await logoutUser(token, refreshToken, id);
        res.clearCookie('refreshToken');
        
        req.log.info({ email }, 'Logout success');

        return res.status(200).json({
            message: "Logout Success",
            status: "OK",
            data: {
                email
            }
        })
    } catch (err: any) {
        req.log.error(err, 'Logout failed');
        next(err);
    }
}

// export const fnRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { refreshToken } = req.body;
//         req.log.info('Request refresh token');

//         const decoded =  jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY || "default_refresh_secret_key") as JwtPayload;

//         // Invalidate old access token session
//         await invalidateRefreshToken(refreshToken, decoded.id); // Invalidate old access token session

//         // Generate new access token
//         const newAccessToken = jwt.sign(
//             { id: decoded.id, email: decoded.email },
//             process.env.SECRET_KEY || "default_secret_key",
//             { expiresIn: '30m'}
//         );

//         // Update session with new access token
//         await validateRefreshToken(newAccessToken, refreshToken, decoded.id); // Validate refresh token and update session

//         req.log.info({ email: decoded.email }, 'Refresh token success');

//         return res.status(200).json({
//             message: "Token refreshed successfully",
//             status: "OK",
//             data: {
//                 accessToken: newAccessToken
//             }
//         })
//     } catch (err: any) {
//         if(err.name === 'JsonWebTokenError') {
//             throw new AppError('Invalid refresh token', 401, [{ field: 'refreshToken', message: 'Invalid refresh token' }] as any);
//             req.log.warn(err.name, 'Invalid refresh token attempt');
//         } else if (err.name === 'TokenExpiredError') {
//             throw new AppError('Refresh token expired', 401, [{ field: 'refreshToken', message: 'Refresh token expired' }] as any);
//             req.log.warn('Expired refresh token attempt');
//         }
//         req.log.error(err, 'Refresh token failed');
//         next(err);
//     }
// }

export const fnRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        req.log.info('Request refresh token');

        if (!refreshToken) {
            throw new AppError('Refresh token is required', 400, [{ field: 'refreshToken', message: 'Refresh token is required' }] as any);
        }

        let decoded: JwtPayload;

        try {
            decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY || "default_refresh_secret_key") as JwtPayload;
        } catch (jwtErr: any) {
            if (jwtErr.name === 'JsonWebTokenError') {
                throw new AppError('Invalid refresh token', 401, [{ field: 'refreshToken', message: 'Invalid refresh token' }] as any);
            } else if (jwtErr.name === 'TokenExpiredError') {
                throw new AppError('Refresh token expired', 401, [{ field: 'refreshToken', message: 'Refresh token expired' }] as any);
            }
            throw jwtErr;
        }

        // Invalidate old access token session
        await invalidateRefreshToken(refreshToken, decoded.id);

        // Generate new access token
        const newAccessToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.SECRET_KEY || "default_secret_key",
            { expiresIn: '30m' }
        );

        // Update session with new access token
        await validateRefreshToken(newAccessToken, refreshToken, decoded.id);

        req.log.info({ email: decoded.email }, 'Refresh token success');

        return res.status(200).json({
            message: "Token refreshed successfully",
            status: "OK",
            data: {
                accessToken: newAccessToken
            }
        });
    } catch (err: any) {
        req.log.error(err, 'Refresh token failed');
        next(err);
    }
}

export const logoutAllDevices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, id } = req.user ? req.user : { email: 'Unknown', id: 'Unknown' };
        req.log.info({ email }, 'Request logout all device');

        const refreshToken = req.cookies.refreshToken;

        await serviceLogoutAllDevices(id, refreshToken);

        req.log.info({ email }, 'Logout all device success');

        return res.status(200).json({
            message: "Logout all device Success",
            status: "OK",
            data: {
                email
            }
        })
    } catch (err: any) {
        req.log.error(err, 'Logout all device failed');
        next(err);
    }
}

