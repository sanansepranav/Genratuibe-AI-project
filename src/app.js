const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

app.use(express.json());
app.use(require('cookie-parser')());

const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS || "").split(",").map((origin) => origin.trim()),
].filter(Boolean));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,}));

// require all routes here
const authRoutes = require("./routes/auth.routes");
const interviewRoutes = require("./routes/interview.routes");

app.get("/", (req, res) => {
    res.send("Interview AI API is running");
});
 
// all routes
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);




module.exports = app;