import express from "express";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env.js";

const app = express();

app.use(cookieParser())
app.use("/api/v1", (req, res, next) => {
  next();
});

app.get("/", (req, res) => {
  res.json({
    title: "The NTCOGK Backend API",
    body: "Welcome to the NTCOGK Backend API"
  })
})

app.listen(PORT || 5500, () => {
  console.log(`The NTCOGK Backend API is running on http://localhost:${PORT || 5500}`)
})

export default app;