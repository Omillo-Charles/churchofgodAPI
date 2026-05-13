import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { PORT } from './config/env.js';
import prisma from './database/postgresql.js';

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/api/v1', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to the NTCOGK API'
    });
});

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
