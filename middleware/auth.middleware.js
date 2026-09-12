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
        // Fallback: Check if token is a valid decoded JWT (e.g., Clerk session)
        const jwt = require("jsonwebtoken");
        const decoded = jwt.decode(token);
        if (decoded && (decoded.sub || decoded.email || decoded.id)) {
            req.user = {
                id: decoded.sub || decoded.id || decoded._id || "clerk_user",
                username: decoded.username || decoded.name || (decoded.email ? decoded.email.split("@")[0] : "User"),
                email: decoded.email || (decoded.sub ? `${decoded.sub}@user.clerk` : "user@interviewai.com"),
                role: decoded.role || "user"
            };
            return next();
        }
        return res.status(401).json({ message: "Invalid or expired token." });
    }
}

async function optionalAuthMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

    if (!token) {
        return next();
    }

    return authMiddleware(req, res, next);
}

module.exports = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
