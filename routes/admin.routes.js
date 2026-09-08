const express = require("express");
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");

const adminRoutes = express.Router();

// One-click seed default admin account (Username: admin, Password: AdminPassword@2026)
adminRoutes.post("/seed", adminController.seedAdminAccount);

// Protected Admin routes
adminRoutes.use(authMiddleware, adminMiddleware);

adminRoutes.get("/stats", adminController.getAdminStats);
adminRoutes.get("/users", adminController.getAllUsers);
adminRoutes.post("/users", adminController.createUser);
adminRoutes.put("/users/:userId/role", adminController.updateUserRole);
adminRoutes.delete("/users/:userId", adminController.deleteUser);
adminRoutes.get("/reports", adminController.getAllReports);
adminRoutes.get("/reports/:reportId", adminController.getReportDetails);
adminRoutes.delete("/reports/:reportId", adminController.deleteReport);

module.exports = adminRoutes;
