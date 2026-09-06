const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

app.use(express.json());
app.use(require('cookie-parser')());

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS policy does not allow access from this origin."));
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