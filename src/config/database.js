const mongoose = require("mongoose");
///
const LOCAL_MONGO_URI = "mongodb://127.0.0.1:27017/interview-ai";
const DEFAULT_OPTIONS = {
    dbName: "interview-ai",
    autoIndex: true,
};

async function connectWithUri(uri) {
    await mongoose.connect(uri, DEFAULT_OPTIONS);
    console.log("connected to DB:", uri.startsWith("mongodb+srv") ? "MongoDB Atlas" : "local MongoDB");
}
///
async function connectDB() {
    try {
        await connectWithUri(LOCAL_MONGO_URI);
        return;
    } catch (err) {
        console.warn("Local MongoDB unavailable, trying Atlas fallback:", err.message);
    }

    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("MONGO_URI is not defined and local MongoDB is unavailable.");
        throw new Error("No database connection available");
    }

    try {
        await connectWithUri(uri);
    } catch (fallbackErr) {
        console.error("Atlas MongoDB fallback failed:", fallbackErr.message);
        throw fallbackErr;
    }
}

module.exports = connectDB;