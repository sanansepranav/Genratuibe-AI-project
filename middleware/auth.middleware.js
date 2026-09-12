const tokenBlacklistModel = require("../src/models/blacklist.model");
const { verifyAuthToken } = require("../src/config/security");

async function authMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication token is required." });
    }

    const blacklisted = await tokenBlacklistModel.findOne({ token });
    if (blacklisted) {
        return res.status(401).json({ message: "Token has been revoked." });
    }

    try {
        const decoded = verifyAuthToken(token);
        req.user = {
            id: decoded.id || decoded.Id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role || (decoded.username === "admin" ? "admin" : "user")
        };
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}

module.exports = authMiddleware;
