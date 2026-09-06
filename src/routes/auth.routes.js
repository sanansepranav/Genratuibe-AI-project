const express = require("express");
const authController = require("../../controllers/auth.controller");

const authRoutes = express.Router();

/**
 *  @route POST /api/auth/register
 *  @description register User
 *  @access Public
 */

authRoutes.post("/register", authController.registerUserController);


/**
 *  @route POST /api/auth/login
 *  @description login User with email and password
 *  @access Public
 */
authRoutes.post("/login", authController.loginUserController)

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