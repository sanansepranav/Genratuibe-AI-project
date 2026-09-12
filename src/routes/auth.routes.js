const express = require("express");
const authController = require("../../controllers/auth.controller");
const rateLimit = require("express-rate-limit");

const authRoutes = express.Router();
const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: { message: "Too many authentication attempts. Please try again later." },
});

/**
 *  @route POST /api/auth/register
 *  @description register User
 *  @access Public
 */

authRoutes.post("/register", authRateLimit, authController.registerUserController);


/**
 *  @route POST /api/auth/login
 *  @description login User with email and password
 *  @access Public
 */
authRoutes.post("/login", authRateLimit, authController.loginUserController)

/**
 * @router GET /api/auth/me
 * @description get current logged in user
 * @access Private
*/
authRoutes.get("/me", require("../../middleware/auth.middleware"), authController.getMeController)

/**
 * @router GET /api/auth/logout
 * @description logout user by cleaning the token cookie
 * @access public
*/
authRoutes.get("/logout", authController.logoutUserController)

module.exports = authRoutes;