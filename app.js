import express from "express";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser())
app.use("/api/v1")

app.get("/", (req, res) => {
  res.json({
    title: "The NTCOGK Backend API",
    body: "Welcome to the NTCOGK Backend API"
  })
})

app.listen(PORT, () => {
  console.log(`The NTCOGK Backend API is running on http://localhost:${PORT}`)
})

export default app;