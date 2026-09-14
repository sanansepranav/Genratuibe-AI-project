const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");

app.disable("x-powered-by");
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));
app.use(express.json({ limit: "100kb" }));
app.use(require('cookie-parser')());

const path = require("path");
const fs = require("fs");

// Compile configured and standard allowed origins
const envOrigins = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.ALLOWED_ORIGINS,
]
    .filter(Boolean)
    .flatMap((val) => val.split(","))
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:4173",
];

const allowedOriginsSet = new Set([...defaultOrigins, ...envOrigins]);

const isOriginAllowed = (origin) => {
    // Allow non-browser requests (e.g., server-to-server, curl, mobile apps, Postman)
    if (!origin) return true;

    const normalized = origin.trim().replace(/\/+$/, "");

    // Check exact matches in configured list
    if (allowedOriginsSet.has(normalized)) return true;

    // Check localhost & 127.0.0.1 on any port with http or https
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) return true;

    // Check private LAN IPs (e.g. 192.168.x.x, 10.x.x.x, 172.16-31.x.x) for local testing
    if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(normalized)) return true;

    // Check Vercel deployments (production domain, branch previews, e.g. *.vercel.app)
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(normalized)) return true;

    // Check Netlify deployments (*.netlify.app)
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)*netlify\.app$/.test(normalized)) return true;

    // Check Render deployments (*.onrender.com)
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)*onrender\.com$/.test(normalized)) return true;

    // Check Railway deployments (*.railway.app)
    if (/^https:\/\/([a-zA-Z0-9_-]+\.)*railway\.app$/.test(normalized)) return true;

    // Allow all if explicitly configured or non-production environment
    if (process.env.ALLOW_ALL_ORIGINS === "true" || process.env.ALLOWED_ORIGINS === "*" || process.env.NODE_ENV !== "production") {
        return true;
    }

    return false;
};

app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        // Note: Do not pass new Error() to callback as it triggers Express 500 error handler.
        // callback(null, false) standardly disallows CORS without throwing server errors.
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Set-Cookie"],
    maxAge: 86400, // Cache preflight for 24 hours
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