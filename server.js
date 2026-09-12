require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/database");
const { validateSecurityConfig } = require("./src/config/security");

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        validateSecurityConfig();
    } catch (secErr) {
        console.warn("Security notice:", secErr.message);
    }

    try {
        await connectDB();
    } catch (err) {
        console.warn("Database initialization notice:", err.message);
        console.log("Running in local fallback storage mode (persistent JSON store).");
    }

    const server = app.listen(PORT, () => {
        console.log(`✓ Server is running on port ${PORT} (http://localhost:${PORT})`);
    });

    server.on("error", (err) => {
        console.error("Server listen error:", err);
    });
}

startServer();
 