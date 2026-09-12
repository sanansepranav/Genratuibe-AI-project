const jwt = require("jsonwebtoken");

function getJwtSecret() {
    const secret = (process.env.JWT_SECRET || "").trim();

    if (secret.length < 32) {
        throw new Error("JWT_SECRET must be configured and at least 32 characters long.");
    }

    return secret;
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