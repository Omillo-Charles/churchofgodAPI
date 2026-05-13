import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { PORT, NODE_ENV } from './config/env.js';
import prisma from './database/postgresql.js';
import authRoutes from './routes/auth.routes.js';
import contactRoutes from './routes/contact.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { generalLimiter } from './middlewares/limit.middleware.js';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(generalLimiter);

// Allow Next.js frontend to make credentialed requests
app.use((req, res, next) => {
    const allowedOrigins = ['http://localhost:3000'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.get('/api/v1', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the NTCOGK API'
    });
});

// Auth routes
app.use('/api/v1/auth', authRoutes);

// Contact routes
app.use('/api/v1/contact', contactRoutes);

// Error middleware
app.use(errorMiddleware);

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');

        const serverPort = PORT || 5500;
        app.listen(serverPort, () => {
            console.log(`The NTCOGK API is running on http://localhost:${serverPort}/api/v1`);
        });
    } catch (error) {
        console.error('Failed to connect to the database', error);
        process.exit(1);
    }
};

startServer();

export default app;
