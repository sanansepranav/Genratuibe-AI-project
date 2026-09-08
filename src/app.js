const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(require('cookie-parser')());

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        return callback(new Error("CORS policy does not allow access from this origin."));
    },
    credentials: true,}));

// require all routes here
const authRoutes = require("./routes/auth.routes");
const interviewRoutes = require("./routes/interview.routes");
const adminRoutes = require("../routes/admin.routes");

app.get("/", (req, res) => {
    res.send("Interview AI API is running");
});

app.get("/api/health", (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const hasAnonKey = !!process.env.SUPABASE_ANON_KEY;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    const isUrlPlaceholder = supabaseUrl.includes("your-project-ref");
    const isUrlValid = supabaseUrl.startsWith("https://") && supabaseUrl.includes(".supabase.co");

    res.json({
        status: "ok",
        database: {
            configured: !isUrlPlaceholder && (hasAnonKey || hasServiceKey) && isUrlValid,
            hasSupabaseUrl: !!supabaseUrl,
            isUrlPlaceholder,
            isUrlValid,
            hasAnonKey,
            hasServiceKey,
        },
        auth: {
            hasJwtSecret,
        }
    });
});

// all routes
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/admin", adminRoutes);

// Global JSON error handling middleware
app.use((err, req, res, next) => {
    console.error("API Unhandled Error:", err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.message || "Internal server error"
    });
});

module.exports = app;