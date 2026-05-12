import express from "express";
import { PORT } from "./config/env.js";

const app = express()

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
