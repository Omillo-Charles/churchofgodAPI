import express from "express";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env.js";
import { connectDB } from "./database/Neon.js";
import authRouter from "./routes/auth.route.js";

const app = express()

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);

// Connect to Database
connectDB();

app.get("/", (req, res) => {
    res.json({
        title: "The NTCOGK Backend API",
        body: "Welcome to the NTCOGK Backend API, be blessed!"
    })
})

app.listen(PORT, () => {
    console.log(`The NTCOGK Backend API is running on http://localhost:${PORT}`)
})

export default app;
