const app = require("../src/app");
const connectDB = require("../src/config/database");

let isConnected = false;

module.exports = async (req, res) => {
    if (!isConnected) {
        try {
            await connectDB();
            isConnected = true;
        } catch (err) {
            console.warn("Supabase connection warning in Vercel serverless function:", err.message);
        }
    }
    return app(req, res);
};
