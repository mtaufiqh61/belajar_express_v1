import { getUsers, deleteUserById, getUserById, getCacheUsers, getCacheUserById } from '../services/userServices';
import { Request, Response, NextFunction } from 'express';
import { SearchUsersQuery } from '../types/type';

export async function getUsersData(req: Request, res: Response, next: NextFunction) {
    try {
        const { page, limit, searchName, searchEmail } = req.query as SearchUsersQuery;
        req.log.info({ page, limit, searchName, searchEmail }, 'Get users request');

        const resultCache = await getCacheUsers({searchName, searchEmail, page, limit});

        let data: any;

        if(!resultCache) {
            data = await getUsers({ page, limit, searchName, searchEmail })
        } else {
            data = resultCache
        }

        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        } as any;

        const createdAtConvertedData = data.result.map((item: any) => ({
            ...item,
            created_at: new Date(item.created_at).toLocaleString('id-ID', options),
            updated_at: new Date(item.updated_at).toLocaleString('id-ID', options),
        }));

        if(resultCache) {
            req.log.info({ searchName, searchEmail, total: data.total, page: data.page, totalPages: data.totalPages }, 'Get users from redis cache success');

            return res.status(200).json({
                message: "Data Found",
                status: "OK",
                data: createdAtConvertedData,
                metadata: {
                    total: data.total,
                    page: data.page,
                    totalPages: data.totalPages
                }
            });
        } else {
            req.log.info({ total: data.total, page: data.page, limit }, 'Get users response');

            return res.status(200).json({
                message: "Data Found",
                status: "OK",
                data: createdAtConvertedData,
                metadata: {
                    total: data.total,
                    page: data.page,
                    totalPages: data.totalPages
                }
            })
        }
    } catch (err) {
        req.log.error(err, 'Get users failed');
        next(err);
    }
}

export async function getUserDataById(req: Request, res: Response, next: NextFunction) {
    try {
        const idUser = req.params.id as string;
        req.log.info({ idUser }, 'Get user by ID request');

        const resultCache = await getCacheUserById(idUser);

        if(resultCache) {
            req.log.info({ idUser, email: resultCache.email }, 'Get user by ID from redis cache success');

            return res.status(200).json({
                message: "Data Found",
                status: "OK",
                data: resultCache
            })
        } else {
            const data = await getUserById(idUser);

            req.log.info({ idUser, email: data.email }, 'Get user by ID from database success');

            // response
            return res.status(200).json({
                message: "Data Found",
                status: "OK",
                data
            })
        }

    } catch (err) {
        req.log.error(err, 'Get user by ID failed');
        next(err);
    }
}

export async function deleteUserData(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id as string;
        req.log.info({ id }, 'Delete user request');

        const data = await deleteUserById(id);

        req.log.info({ id }, 'Delete user success');

        // response
        return res.status(200).json({
            message: "Data Deleted",
            status: "OK",
            data: data
        })

    } catch (err) {
        req.log.error(err, 'Delete user failed');
        next(err);
    }
}