import { NextFunction, Request, Response } from 'express';

export const notFound = (_req: Request, res: Response, _next: NextFunction) => {
    res.status(404).json({ message: 'Resource not found' });
};