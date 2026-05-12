import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { PORT, FRONTEND_LOCAL_URL } from "./config/env.js";
import { connectDB } from "./database/Neon.js";
import authRouter from "./routes/auth.routes.js";

const app = express()

app.use(cors({
    origin: FRONTEND_LOCAL_URL,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
    res.json({
        title: "The NTCOGK Backend API",
        body: "Welcome to the NTCOGK Backend API, be blessed!"
    })
})

app.listen(PORT, async () => {
    console.log(`The NTCOGK Backend API is running on http://localhost:${PORT}`)
    await connectDB();
})

export default app;
