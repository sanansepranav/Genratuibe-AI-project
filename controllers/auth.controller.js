const userModel = require("../src/models/user.model")
const bcrypt = require("bcryptjs")
const tokenBlacklistModel = require("../src/models/blacklist.model")
const { signAuthToken } = require("../src/config/security")

const authCookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
};

/**
 * @name registerUsercontroller
 * @description register a new user, expecpts username, email and name;
 * @access Public
 * @param {*} req 
 * @param {*} res 
 */


async function registerUserController(req, res) {
    try {
        const username = (req.body.username || "").trim();
        const email = (req.body.email || "").trim().toLowerCase();
        const password = req.body.password || "";

        if (!username || !email || password.length < 8) {
            return res.status(400).json({
            message: "Username and email are required. Password must be at least 8 characters."
            });
        }

        const isUserAlreadyRegistered = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (isUserAlreadyRegistered) {
            const emailMatches = isUserAlreadyRegistered.email && isUserAlreadyRegistered.email.toLowerCase() === email.toLowerCase();
            const usernameMatches = isUserAlreadyRegistered.username && isUserAlreadyRegistered.username.toLowerCase() === username.toLowerCase();
            const msg = emailMatches && usernameMatches
                ? "An account with this email and username already exists"
                : emailMatches
                    ? "An account with this email already exists"
                    : "This username is already taken";
            return res.status(400).json({ message: msg });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email, 
            password: hash,
        });

        const userRole = user.role || (user.username === "admin" || user.email === "admin@interviewai.com" ? "admin" : "user");
        const token = signAuthToken(
            { id: user._id, username: user.username, email: user.email, role: userRole },
        );

        res.cookie("token", token, authCookieOptions);

        return res.status(201).json({
            message: "user registered successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: userRole,
            }
        });
    } catch (err) {
        console.error("Error in registerUserController:", err);
        return res.status(500).json({
            message: err.message || "Registration failed due to a server error."
        });
    }
}

/**
 * @name loginUserController
 * @description login user, expects email and password
 * @access Public
 * @param {*} req 
 * @param {*} res
 */

async function loginUserController(req, res) {
    try {
        const identifier = (req.body.email || req.body.username || "").trim();
        const password = req.body.password;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Please provide email or username and password"
            });
        }

        const isEmail = identifier.includes("@");
        const user = await userModel.findOne(
            isEmail
                ? { email: identifier.toLowerCase() }
                : { $or: [{ username: identifier }, { email: identifier }] }
        );

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials. Please check your username/email and password."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid credentials. Please check your username/email and password."
            });
        }

        const userRole = user.role || (user.username === "admin" || user.email === "admin@interviewai.com" ? "admin" : "user");
        const token = signAuthToken(
            { id: user._id, username: user.username, email: user.email, role: userRole },
        );

        res.cookie("token", token, authCookieOptions);
        return res.status(200).json({
            message: "user logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: userRole,
            }
        });
    } catch (err) {
        console.error("Error in loginUserController:", err);
        return res.status(500).json({
            message: err.message || "Login failed due to a server error."
        });
    }
}

async function getMeController(req, res) {
    try {
        if (!req.user) {
            return res.status(200).json({ user: null });
        }

        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userRole = user.role || (user.username === "admin" || user.email === "admin@interviewai.com" ? "admin" : "user");
        return res.status(200).json({
            message: "current user fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: userRole,
            }
        });
    } catch (err) {
        console.error("Error in getMeController:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch current user."
        });
    }
}

/**
 * @router GET /api/auth/logout
 * @description logout user by cleaning the token cookie
 * @access public
*/

async function logoutUserController(req, res) {
    try {
        const token = req.cookies?.token;

        if (token) { 
            await tokenBlacklistModel.create({ token });
        }
    } catch (err) {
        console.warn("Error invalidating token during logout:", err.message);
    }
    return res.clearCookie("token", authCookieOptions).status(200).json({
        message: "user logged out successfully"
    });
}


module.exports = {
    registerUserController,
    loginUserController,
    getMeController,
    logoutUserController,
};