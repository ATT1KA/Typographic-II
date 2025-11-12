import { ErrorRequestHandler } from 'express';

type AppError = Error & { statusCode?: number };

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const { statusCode = 500, message = 'Internal Server Error' } = err as AppError;

    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message,
    });

    // Optionally log the error for debugging
    console.error(err);
};