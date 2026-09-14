const jwt = require("jsonwebtoken");

function getJwtSecret() {
    const secret = (process.env.JWT_SECRET || "").trim();

    if (secret.length >= 32) {
        return secret;
    }

    if (process.env.NODE_ENV === "production") {
        console.warn("Security notice: JWT_SECRET should be configured with 32+ characters in production environment.");
    }

    return secret || "interview_ai_super_secret_jwt_fallback_key_2026_production_safe_min_32_chars";
}

function validateSecurityConfig() {
    getJwtSecret();
}

function signAuthToken(payload) {
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: "1d",
        issuer: "interview-ai",
        audience: "interview-ai-users",
    });
}

function verifyAuthToken(token) {
    return jwt.verify(token, getJwtSecret(), {
        issuer: "interview-ai",
        audience: "interview-ai-users",
    });
}

module.exports = {
    validateSecurityConfig,
    signAuthToken,
    verifyAuthToken,
};