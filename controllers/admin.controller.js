const userModel = require("../src/models/user.model");
const interviewReportModel = require("../src/models/interviewReport.model");
const bcrypt = require("bcryptjs");
const { getSupabaseClient } = require("../src/config/database");

const DEFAULT_ADMIN = {
    username: "admin",
    email: "admin@interviewai.com",
    password: "AdminPassword@2026",
    role: "admin",
};

/**
 * @name getAdminStats
 * @description Provides high-level platform metrics, score breakdowns, and system health
 */
async function getAdminStats(req, res) {
    try {
        const client = getSupabaseClient();

        // 1. Fetch Users & Reports counts and data
        const [users, reports] = await Promise.all([
            userModel.find({ limit: 100 }),
            interviewReportModel.findAll({ limit: 100 }),
        ]);

        const totalUsers = users.length;
        const totalReports = reports.length;

        // 2. Compute Match Score metrics
        let totalScore = 0;
        let scoredCount = 0;
        const scoreDistribution = {
            high: 0,       // 75-100%
            medium: 0,     // 50-74%
            low: 0,        // <50%
        };

        reports.forEach((r) => {
            const score = typeof r.matchScore === "number" ? r.matchScore : parseInt(r.matchScore, 10);
            if (!isNaN(score)) {
                totalScore += score;
                scoredCount++;
                if (score >= 75) scoreDistribution.high++;
                else if (score >= 50) scoreDistribution.medium++;
                else scoreDistribution.low++;
            }
        });

        const averageMatchScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

        // 3. User map for user metadata
        const userMap = new Map();
        users.forEach((u) => userMap.set(u.id, u.username || u.email));

        const enrichedReports = reports.slice(0, 8).map((r) => ({
            id: r.id || r._id,
            title: r.title,
            matchScore: r.matchScore,
            userName: userMap.get(r.user || r.user_id) || "Anonymous Candidate",
            createdAt: r.createdAt || r.created_at,
        }));

        // 4. System Health Check
        let dbOk = false;
        try {
            const { error } = await client.from("users").select("id").limit(1);
            dbOk = !error;
        } catch {
            dbOk = false;
        }

        return res.status(200).json({
            stats: {
                totalUsers,
                totalReports,
                averageMatchScore,
                scoreDistribution,
            },
            recentUsers: users.slice(0, 6).map((u) => ({
                id: u.id,
                username: u.username,
                email: u.email,
                role: u.role || (u.username === "admin" ? "admin" : "user"),
                createdAt: u.createdAt || u.created_at,
            })),
            recentReports: enrichedReports,
            systemHealth: {
                databaseConnected: dbOk,
                geminiConfigured: !!process.env.GOOGLE_GENAI_API_KEY,
                uptimeSeconds: Math.floor(process.uptime()),
                nodeVersion: process.version,
                environment: process.env.NODE_ENV || "development",
            },
        });
    } catch (err) {
        console.error("Error in getAdminStats:", err);
        return res.status(500).json({ message: err.message || "Failed to fetch admin stats" });
    }
}

/**
 * @name getAllUsers
 * @description Lists all users with their report counts
 */
async function getAllUsers(req, res) {
    try {
        const [users, reports] = await Promise.all([
            userModel.find(),
            interviewReportModel.findAll(),
        ]);

        // Count reports per user
        const reportCounts = {};
        reports.forEach((r) => {
            const uid = r.user || r.user_id;
            if (uid) {
                reportCounts[uid] = (reportCounts[uid] || 0) + 1;
            }
        });

        const usersWithStats = users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role || (u.username === "admin" ? "admin" : "user"),
            reportCount: reportCounts[u.id] || 0,
            createdAt: u.createdAt || u.created_at,
        }));

        return res.status(200).json({ users: usersWithStats });
    } catch (err) {
        console.error("Error in getAllUsers:", err);
        return res.status(500).json({ message: err.message || "Failed to fetch users" });
    }
}

/**
 * @name createUser
 * @description Creates a new user or admin manually
 */
async function createUser(req, res) {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, and password are required." });
        }

        const existing = await userModel.findOne({
            $or: [{ username }, { email }],
        });

        if (existing) {
            return res.status(400).json({ message: "A user with this username or email already exists." });
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = await userModel.create({
            username,
            email,
            password: hash,
            role: role === "admin" ? "admin" : "user",
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt,
            },
        });
    } catch (err) {
        console.error("Error in createUser:", err);
        return res.status(500).json({ message: err.message || "Failed to create user" });
    }
}

/**
 * @name updateUserRole
 * @description Promotes or demotes user role
 */
async function updateUserRole(req, res) {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role || !["admin", "user"].includes(role)) {
            return res.status(400).json({ message: "Role must be 'admin' or 'user'." });
        }

        // Prevent self-demotion if current user is demoting themselves
        if (req.user.id === userId && role !== "admin") {
            return res.status(400).json({ message: "You cannot demote your own admin account." });
        }

        const updated = await userModel.update(userId, { role });
        return res.status(200).json({
            message: `User role successfully updated to ${role}.`,
            user: updated,
        });
    } catch (err) {
        console.error("Error in updateUserRole:", err);
        return res.status(500).json({ message: err.message || "Failed to update role" });
    }
}

/**
 * @name deleteUser
 * @description Deletes a user account
 */
async function deleteUser(req, res) {
    try {
        const { userId } = req.params;

        if (req.user.id === userId) {
            return res.status(400).json({ message: "You cannot delete your own admin account." });
        }

        await userModel.delete(userId);
        return res.status(200).json({ message: "User account successfully deleted." });
    } catch (err) {
        console.error("Error in deleteUser:", err);
        return res.status(500).json({ message: err.message || "Failed to delete user" });
    }
}

/**
 * @name getAllReports
 * @description Lists all candidate reports with user details
 */
async function getAllReports(req, res) {
    try {
        const [reports, users] = await Promise.all([
            interviewReportModel.findAll(),
            userModel.find(),
        ]);

        const userMap = new Map();
        users.forEach((u) => userMap.set(u.id, { username: u.username, email: u.email }));

        const enriched = reports.map((r) => {
            const u = userMap.get(r.user || r.user_id) || {};
            return {
                id: r.id || r._id,
                title: r.title,
                jobDescription: (r.jobDescription || "").slice(0, 180),
                matchScore: r.matchScore,
                userName: u.username || "Candidate",
                userEmail: u.email || "",
                createdAt: r.createdAt || r.created_at,
            };
        });

        return res.status(200).json({ reports: enriched });
    } catch (err) {
        console.error("Error in getAllReports:", err);
        return res.status(500).json({ message: err.message || "Failed to fetch reports" });
    }
}

/**
 * @name getReportDetails
 * @description Gets full report preview for admin
 */
async function getReportDetails(req, res) {
    try {
        const { reportId } = req.params;
        const report = await interviewReportModel.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        return res.status(200).json({ report });
    } catch (err) {
        console.error("Error in getReportDetails:", err);
        return res.status(500).json({ message: err.message || "Failed to fetch report details" });
    }
}

/**
 * @name deleteReport
 * @description Deletes an interview report
 */
async function deleteReport(req, res) {
    try {
        const { reportId } = req.params;
        await interviewReportModel.delete(reportId);
        return res.status(200).json({ message: "Interview report successfully deleted." });
    } catch (err) {
        console.error("Error in deleteReport:", err);
        return res.status(500).json({ message: err.message || "Failed to delete report" });
    }
}

/**
 * @name seedAdminAccount
 * @description Ensures default admin account exists in Supabase
 */
async function seedAdminAccount(req, res) {
    try {
        const existing = await userModel.findOne({
            $or: [{ username: DEFAULT_ADMIN.username }, { email: DEFAULT_ADMIN.email }],
        });

        if (existing) {
            if (existing.role !== "admin") {
                await userModel.update(existing.id, { role: "admin" });
            }
            return res.status(200).json({
                message: "Admin account already exists and is active.",
                credentials: {
                    username: DEFAULT_ADMIN.username,
                    email: DEFAULT_ADMIN.email,
                },
            });
        }

        const hash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
        const adminUser = await userModel.create({
            username: DEFAULT_ADMIN.username,
            email: DEFAULT_ADMIN.email,
            password: hash,
            role: "admin",
        });

        return res.status(201).json({
            message: "Default admin account created successfully!",
            credentials: {
                username: DEFAULT_ADMIN.username,
                email: DEFAULT_ADMIN.email,
                password: DEFAULT_ADMIN.password,
            },
            user: {
                id: adminUser.id,
                username: adminUser.username,
                email: adminUser.email,
                role: "admin",
            },
        });
    } catch (err) {
        console.error("Error in seedAdminAccount:", err);
        return res.status(500).json({ message: err.message || "Failed to seed admin account." });
    }
}

module.exports = {
    getAdminStats,
    getAllUsers,
    createUser,
    updateUserRole,
    deleteUser,
    getAllReports,
    getReportDetails,
    deleteReport,
    seedAdminAccount,
};
