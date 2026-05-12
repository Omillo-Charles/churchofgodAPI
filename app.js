import express from "express";

const app = express()

app.get("/", (req, res) => {
    res.json({
        title: "The NTCOGK Backend API",
        body: "Welcome to the NTCOGK Backend API, be blessed!"
    })
})

app.listen(5500, () => {
    console.log("The NTCOGK Backend API is running on http://localhost:5500")
})

export default app;
