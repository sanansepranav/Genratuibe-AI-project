const userModel = require("../src/models/user.model");

async function adminMiddleware(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required." });
    }

    try {
        // Fast-path: role present in decoded token
        if (req.user.role === "admin" || req.user.username === "admin" || req.user.email === "admin@interviewai.com") {
            return next();
        }

        // Fallback: verify directly from database
        const user = await userModel.findById(req.user.id).select();
        if (user && (user.role === "admin" || user.username === "admin" || user.email === "admin@interviewai.com")) {
            req.user.role = "admin";
            return next();
        }

        return res.status(403).json({
            message: "Access denied. Administrator privileges are required to view this resource."
        });
    } catch (err) {
        console.error("Admin verification error:", err);
        return res.status(500).json({ message: "Failed to verify admin authorization." });
    }
}

module.exports = adminMiddleware;
