const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(require('cookie-parser')());

const path = require("path");
const fs = require("fs");

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error("CORS policy does not allow access from this origin."));
    },
    credentials: true,
}));

// require all routes here
const authRoutes = require("./routes/auth.routes");
const interviewRoutes = require("./routes/interview.routes");
const adminRoutes = require("../routes/admin.routes");

app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// all routes
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/admin", adminRoutes);

// Serve static frontend in production or when dist build is present
const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use((req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(path.join(distPath, "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.send("Interview AI API is running");
    });
}

// Global JSON error handling middleware
app.use((err, req, res, next) => {
    console.error("API Unhandled Error:", err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.message || "Internal server error"
    });
});

module.exports = app;