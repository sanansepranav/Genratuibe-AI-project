require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/database");

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();
    } catch (err) {
        console.warn("Starting server without a working MongoDB connection.");
    }

    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    server.on("error", (err) => {
        console.error("Server listen error:", err);
    });
}

startServer();
 