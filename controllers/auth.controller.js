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
    const {username, email , password} = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "please provide username, email and password"
        })
    }

    const isUserAlreadyRegistered = await userModel.findOne({
        $or :[{ username }, { email}]
     });

    if (isUserAlreadyRegistered) {
        /* isUserAlreadyRegistered will be either a user with the provided username or email */
        return res.status(400).json({
            message: "user with this email already exists"
        })
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email, 
        password: hash,
    }) 

    const token = jwt.sign(
        { id: user._id, username: user.username},
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, authCookieOptions)

    res.status(201).json({
        message: "user registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
}

/**
 * @name loginUserController
 * @description login user, expects email and password
 * @access Public
 * @param {*} req 
 * @param {*} res
 */

async function loginUserController(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({
        email
    })

    if(!user) {
        return res.status(400).json({
            message: "invalid email or password"
        })
    }

    const isPasswordCorrect = await bcrypt.compare (password, user.password)

    if(!isPasswordCorrect) {
        return res.status(400).json({
            message: "invalid email or password"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username},
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, authCookieOptions)
    res.status(200).json({
        message: "user logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
        message: "current user fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
}

/**
 * @router GET /api/auth/logout
 * @description logout user by cleaning the token cookie
 * @access public
*/

async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) { 
        await tokenBlacklistModel.create({ token })
    }
    res.clearCookie("token", authCookieOptions).status(200).json({
        message: "user logged out successfully"
    })
}


module.exports = {
    registerUserController,
    loginUserController,
    getMeController,
    logoutUserController,
};