const userModel = require("../src/models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../src/models/blacklist.model")

const authCookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
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
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
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
        const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret_dev_key_fallback";
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: userRole },
            jwtSecret,
            { expiresIn: "1d" }
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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password"
            });
        }

        const user = await userModel.findOne({
            email
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const userRole = user.role || (user.username === "admin" || user.email === "admin@interviewai.com" ? "admin" : "user");
        const jwtSecret = process.env.JWT_SECRET || "default_jwt_secret_dev_key_fallback";
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: userRole },
            jwtSecret,
            { expiresIn: "1d" }
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