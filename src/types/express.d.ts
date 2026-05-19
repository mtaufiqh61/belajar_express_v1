import { User } from "./type";

declare global {
    namespace Express {
        interface Request {
            user?: User;
            token?: string;
            validatedBody?: any;
        }
    }
}

export {};