const errorMiddleware = (err, req, res, next) => {
    try {
        let error = { ...err };

        error.message = err.message;

        console.error(err);

        // Prisma unique constraint error
        if (err.code === 'P2002') {
            const message = `Duplicate field value entered`;
            error = new Error(message);
            error.statusCode = 400;
        }

        // Prisma record not found error
        if (err.code === 'P2025') {
            const message = `Record not found`;
            error = new Error(message);
            error.statusCode = 404;
        }

        // JWT expired error
        if (err.name === 'TokenExpiredError') {
            const message = 'Your token has expired. Please log in again.';
            error = new Error(message);
            error.statusCode = 401;
        }

        // JWT invalid error
        if (err.name === 'JsonWebTokenError') {
            const message = 'Invalid token. Please log in again.';
            error = new Error(message);
            error.statusCode = 401;
        }

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Internal Server Error',
        });
    } catch (e) {
        next(e);
    }
};

export default errorMiddleware;
