import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@auth/hooks/useAuth";
import {
    getAdminStats,
    getAllUsers,
    createAdminUser,
    updateUserRole,
    deleteUser,
    getAllReports,
    getReportDetails,
    deleteReport,
    seedAdminAccount,
} from "../services/admin.api";
import "../style/admin.scss";

const AdminDashboard = () => {
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = useState("overview");

    // Loading & Notification states
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });

    // Data states
    const [statsData, setStatsData] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [reportsList, setReportsList] = useState([]);

    // Filter & Search states
    const [userSearch, setUserSearch] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState("all");
    const [reportSearch, setReportSearch] = useState("");
    const [reportScoreFilter, setReportScoreFilter] = useState("all");

    // Modals
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ username: "", email: "", password: "", role: "user" });
    const [selectedReport, setSelectedReport] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [loadingReportDetails, setLoadingReportDetails] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        fetchAllData();
    }, []);

    const showToast = (message, type = "info") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4500);
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, reportsRes] = await Promise.all([
                getAdminStats().catch(() => null),
                getAllUsers().catch(() => ({ users: [] })),
                getAllReports().catch(() => ({ reports: [] })),
            ]);

            if (statsRes) setStatsData(statsRes);
            if (usersRes?.users) setUsersList(usersRes.users);
            if (reportsRes?.reports) setReportsList(reportsRes.reports);
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch administrative data.", "error");
        } finally {
            setLoading(false);
        }
    };

    // User Actions
    const handleToggleRole = async (targetUser) => {
        const newRole = targetUser.role === "admin" ? "user" : "admin";
        if (!window.confirm(`Are you sure you want to change ${targetUser.username}'s role to ${newRole.toUpperCase()}?`)) return;

        try {
            await updateUserRole(targetUser.id, newRole);
            showToast(`Updated ${targetUser.username} to ${newRole}.`, "success");
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update role", "error");
        }
    };

    const handleDeleteUser = async (targetUser) => {
        if (!window.confirm(`Are you sure you want to delete user "${targetUser.username}"? All associated interview reports will also be deleted.`)) return;

        try {
            await deleteUser(targetUser.id);
            showToast(`User ${targetUser.username} deleted.`, "success");
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to delete user", "error");
        }
    };

    const handleCreateUserSubmit = async (e) => {
        e.preventDefault();
        if (!newUserForm.username || !newUserForm.email || !newUserForm.password) {
            return showToast("Please fill in all required fields.", "error");
        }

        try {
            await createAdminUser(newUserForm);
            showToast(`User "${newUserForm.username}" created successfully.`, "success");
            setIsCreateUserOpen(false);
            setNewUserForm({ username: "", email: "", password: "", role: "user" });
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to create user", "error");
        }
    };

    // Report Actions
    const handleViewReport = async (reportId) => {
        setLoadingReportDetails(true);
        setIsReportModalOpen(true);
        try {
            const data = await getReportDetails(reportId);
            setSelectedReport(data.report);
        } catch (err) {
            showToast("Failed to load report details.", "error");
            setIsReportModalOpen(false);
        } finally {
            setLoadingReportDetails(false);
        }
    };

    const handleDeleteReport = async (reportId, title) => {
        if (!window.confirm(`Delete interview report "${title || 'Report'}"?`)) return;
        try {
            await deleteReport(reportId);
            showToast("Report deleted successfully.", "success");
            fetchAllData();
            if (isReportModalOpen) setIsReportModalOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to delete report.", "error");
        }
    };

    // Seed Admin Action
    const handleSeedAdmin = async () => {
        try {
            const res = await seedAdminAccount();
            showToast(res.message || "Admin account verified & active!", "success");
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to seed admin account.", "error");
        }
    };

    // Export Data JSON
    const handleExportData = () => {
        const exportObj = {
            exportedAt: new Date().toISOString(),
            stats: statsData?.stats,
            users: usersList,
            reports: reportsList,
        };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `interview_ai_admin_export_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Platform data exported to JSON.", "success");
    };

    // Filter Users
    const filteredUsers = usersList.filter((u) => {
        const matchesSearch =
            (u.username || "").toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
        const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
        return matchesSearch && matchesRole;
    });

    // Filter Reports
    const filteredReports = reportsList.filter((r) => {
        const matchesSearch =
            (r.title || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
            (r.userName || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
            (r.jobDescription || "").toLowerCase().includes(reportSearch.toLowerCase());

        let matchesScore = true;
        const score = typeof r.matchScore === "number" ? r.matchScore : parseInt(r.matchScore, 10);
        if (reportScoreFilter === "high") matchesScore = score >= 75;
        else if (reportScoreFilter === "medium") matchesScore = score >= 50 && score < 75;
        else if (reportScoreFilter === "low") matchesScore = score < 50;

        return matchesSearch && matchesScore;
    });

    return (
        <div className="admin-wrapper">
            {/* Header */}
            <header className="admin-header">
                <div className="header-brand">
                    <div className="badge-shield">🛡️</div>
                    <div>
                        <h1>Interview AI Studio Admin</h1>
                    </div>
                    <span className="version-tag">SUPER ADMIN</span>
                </div>

                <div className="header-actions">
                    <div className="admin-profile">
                        <div className="avatar">
                            {(user?.username || "A").charAt(0).toUpperCase()}
                        </div>
                        <span className="name">{user?.username || "Admin"}</span>
                        <span className="role-pill">ADMIN</span>
                    </div>

                    <Link to="/" className="back-app-btn">
                        <span>← Candidate Studio</span>
                    </Link>
                </div>
            </header>

            {/* Notification Toast */}
            {toast.show && (
                <div style={{
                    position: "fixed",
                    top: "85px",
                    right: "32px",
                    zIndex: 999,
                    background: toast.type === "error" ? "#ef4444" : toast.type === "success" ? "#10b981" : "#6366f1",
                    color: "#ffffff",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    animation: "fadeIn 0.2s ease"
                }}>
                    {toast.message}
                </div>
            )}

            <main className="admin-container">
                {/* Top Metrics Row */}
                <section className="metrics-grid">
                    <div className="metric-card" style={{ "--card-glow": "#3b82f6" }}>
                        <div className="icon-box blue">👥</div>
                        <div className="metric-content">
                            <div className="metric-label">Registered Candidates</div>
                            <div className="metric-value">{statsData?.stats?.totalUsers ?? usersList.length}</div>
                            <div className="metric-sub">Platform-wide user accounts</div>
                        </div>
                    </div>

                    <div className="metric-card" style={{ "--card-glow": "#a855f7" }}>
                        <div className="icon-box purple">📄</div>
                        <div className="metric-content">
                            <div className="metric-label">Reports & Resumes</div>
                            <div className="metric-value">{statsData?.stats?.totalReports ?? reportsList.length}</div>
                            <div className="metric-sub">AI evaluations generated</div>
                        </div>
                    </div>

                    <div className="metric-card" style={{ "--card-glow": "#10b981" }}>
                        <div className="icon-box emerald">🎯</div>
                        <div className="metric-content">
                            <div className="metric-label">Average Match Score</div>
                            <div className="metric-value">{statsData?.stats?.averageMatchScore ?? 0}%</div>
                            <div className="metric-sub">Candidate-to-job relevance</div>
                        </div>
                    </div>

                    <div className="metric-card" style={{ "--card-glow": "#f59e0b" }}>
                        <div className="icon-box amber">⚡</div>
                        <div className="metric-content">
                            <div className="metric-label">System Health</div>
                            <div className="metric-value" style={{ fontSize: "1.35rem", color: statsData?.systemHealth?.databaseConnected ? "#34d399" : "#f87171" }}>
                                {statsData?.systemHealth?.databaseConnected ? "Operational" : "Degraded"}
                            </div>
                            <div className="metric-sub">
                                Gemini AI: {statsData?.systemHealth?.geminiConfigured ? "Connected" : "Check Key"}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tabs Navigation */}
                <div className="nav-tabs">
                    <button
                        className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        <span>📊 Analytics Overview</span>
                    </button>

                    <button
                        className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                        onClick={() => setActiveTab("users")}
                    >
                        <span>👥 Candidates & Admins</span>
                        <span className="tab-count">{usersList.length}</span>
                    </button>

                    <button
                        className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
                        onClick={() => setActiveTab("reports")}
                    >
                        <span>📄 Interview Reports</span>
                        <span className="tab-count">{reportsList.length}</span>
                    </button>

                    <button
                        className={`tab-btn ${activeTab === "system" ? "active" : ""}`}
                        onClick={() => setActiveTab("system")}
                    >
                        <span>⚙️ Diagnostics & Credentials</span>
                    </button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                    <div className="tab-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "700" }}>Platform Performance & Analytics</h2>
                                <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                                    High-level view of candidate preparation and system activity
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={handleSeedAdmin}
                                    style={{
                                        background: "rgba(99, 102, 241, 0.15)",
                                        border: "1px solid rgba(99, 102, 241, 0.3)",
                                        color: "#818cf8",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        fontSize: "0.85rem"
                                    }}
                                >
                                    🔑 Seed Admin Account
                                </button>

                                <button
                                    onClick={handleExportData}
                                    style={{
                                        background: "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        color: "#cbd5e1",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        fontSize: "0.85rem"
                                    }}
                                >
                                    📥 Export JSON
                                </button>

                                <button
                                    onClick={fetchAllData}
                                    style={{
                                        background: "#6366f1",
                                        border: "none",
                                        color: "#fff",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        fontSize: "0.85rem"
                                    }}
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                        </div>

                        {/* Score Distribution Bars */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.8)",
                            border: "1px solid rgba(255, 255, 255, 0.07)",
                            borderRadius: "14px",
                            padding: "24px",
                            marginBottom: "28px"
                        }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "1rem", color: "#f8fafc" }}>
                                Candidate Match Score Distribution
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                                        <span style={{ color: "#34d399", fontWeight: "600" }}>High Match (75% - 100%)</span>
                                        <span style={{ color: "#94a3b8" }}>{statsData?.stats?.scoreDistribution?.high ?? 0} candidates</span>
                                    </div>
                                    <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${reportsList.length > 0 ? ((statsData?.stats?.scoreDistribution?.high || 0) / reportsList.length) * 100 : 0}%`,
                                            background: "#10b981",
                                            borderRadius: "4px"
                                        }} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                                        <span style={{ color: "#fbbf24", fontWeight: "600" }}>Moderate Match (50% - 74%)</span>
                                        <span style={{ color: "#94a3b8" }}>{statsData?.stats?.scoreDistribution?.medium ?? 0} candidates</span>
                                    </div>
                                    <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${reportsList.length > 0 ? ((statsData?.stats?.scoreDistribution?.medium || 0) / reportsList.length) * 100 : 0}%`,
                                            background: "#f59e0b",
                                            borderRadius: "4px"
                                        }} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                                        <span style={{ color: "#f87171", fontWeight: "600" }}>Needs Growth (&lt; 50%)</span>
                                        <span style={{ color: "#94a3b8" }}>{statsData?.stats?.scoreDistribution?.low ?? 0} candidates</span>
                                    </div>
                                    <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${reportsList.length > 0 ? ((statsData?.stats?.scoreDistribution?.low || 0) / reportsList.length) * 100 : 0}%`,
                                            background: "#ef4444",
                                            borderRadius: "4px"
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Candidates & Reports split */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
                            {/* Recent Candidates */}
                            <div style={{
                                background: "rgba(15, 23, 42, 0.7)",
                                border: "1px solid rgba(255, 255, 255, 0.07)",
                                borderRadius: "14px",
                                padding: "20px"
                            }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: "1rem", color: "#f8fafc" }}>
                                    Recent Registrations
                                </h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersList.slice(0, 5).map((u) => (
                                                <tr key={u.id}>
                                                    <td style={{ fontWeight: "600", color: "#f1f5f9" }}>{u.username}</td>
                                                    <td style={{ color: "#94a3b8", fontSize: "0.82rem" }}>{u.email}</td>
                                                    <td>
                                                        <span className={`badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {usersList.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" style={{ textAlign: "center", color: "#64748b" }}>No users registered yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Reports */}
                            <div style={{
                                background: "rgba(15, 23, 42, 0.7)",
                                border: "1px solid rgba(255, 255, 255, 0.07)",
                                borderRadius: "14px",
                                padding: "20px"
                            }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: "1rem", color: "#f8fafc" }}>
                                    Recent Interview Reports
                                </h3>
                                <div className="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Candidate</th>
                                                <th>Match</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportsList.slice(0, 5).map((r) => {
                                                const score = r.matchScore || 0;
                                                const badgeClass = score >= 75 ? "score-high" : score >= 50 ? "score-medium" : "score-low";
                                                return (
                                                    <tr key={r.id}>
                                                        <td style={{ fontWeight: "600", color: "#f1f5f9" }}>{r.title}</td>
                                                        <td style={{ color: "#94a3b8", fontSize: "0.82rem" }}>{r.userName}</td>
                                                        <td>
                                                            <span className={`badge ${badgeClass}`}>
                                                                {score}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {reportsList.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" style={{ textAlign: "center", color: "#64748b" }}>No reports generated yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: USERS MANAGEMENT */}
                {activeTab === "users" && (
                    <div className="tab-content">
                        <div className="control-bar">
                            <div className="search-box">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search candidates by username or email..."
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>

                            <div className="filter-group">
                                <select
                                    value={userRoleFilter}
                                    onChange={(e) => setUserRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Candidate (User)</option>
                                    <option value="admin">Administrator</option>
                                </select>

                                <button
                                    className="primary-action-btn"
                                    onClick={() => setIsCreateUserOpen(true)}
                                >
                                    <span>+ Add New User</span>
                                </button>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Candidate / Username</th>
                                        <th>Email Address</th>
                                        <th>Role</th>
                                        <th>Reports Count</th>
                                        <th>Registration Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{
                                                        width: "32px",
                                                        height: "32px",
                                                        borderRadius: "50%",
                                                        background: u.role === "admin" ? "#6366f1" : "#334155",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: "700",
                                                        color: "#fff",
                                                        fontSize: "0.85rem"
                                                    }}>
                                                        {(u.username || "U").charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: "600", color: "#f8fafc" }}>{u.username}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: "#94a3b8" }}>{u.email}</td>
                                            <td>
                                                <span className={`badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: "600", color: "#cbd5e1" }}>
                                                {u.reportCount || 0}
                                            </td>
                                            <td style={{ color: "#64748b", fontSize: "0.82rem" }}>
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recent"}
                                            </td>
                                            <td>
                                                <div className="action-btn-group">
                                                    <button
                                                        className="btn-action role-toggle"
                                                        onClick={() => handleToggleRole(u)}
                                                        title="Toggle between admin and user"
                                                    >
                                                        {u.role === "admin" ? "Demote" : "Make Admin"}
                                                    </button>
                                                    <button
                                                        className="btn-action danger"
                                                        onClick={() => handleDeleteUser(u)}
                                                        title="Delete user and all their data"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                                                No users match the current search filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: INTERVIEW REPORTS */}
                {activeTab === "reports" && (
                    <div className="tab-content">
                        <div className="control-bar">
                            <div className="search-box">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search reports by title, candidate, or job description..."
                                    value={reportSearch}
                                    onChange={(e) => setReportSearch(e.target.value)}
                                />
                            </div>

                            <div className="filter-group">
                                <select
                                    value={reportScoreFilter}
                                    onChange={(e) => setReportScoreFilter(e.target.value)}
                                >
                                    <option value="all">All Match Scores</option>
                                    <option value="high">High Match (75%+)</option>
                                    <option value="medium">Moderate Match (50-74%)</option>
                                    <option value="low">Needs Improvement (&lt;50%)</option>
                                </select>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Report Title</th>
                                        <th>Candidate</th>
                                        <th>Target Role / Snippet</th>
                                        <th>Match Score</th>
                                        <th>Created Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map((r) => {
                                        const score = r.matchScore || 0;
                                        const badgeClass = score >= 75 ? "score-high" : score >= 50 ? "score-medium" : "score-low";
                                        return (
                                            <tr key={r.id}>
                                                <td style={{ fontWeight: "600", color: "#f8fafc" }}>
                                                    {r.title}
                                                </td>
                                                <td style={{ color: "#cbd5e1" }}>
                                                    {r.userName}
                                                    {r.userEmail && (
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.userEmail}</div>
                                                    )}
                                                </td>
                                                <td style={{ color: "#94a3b8", fontSize: "0.82rem", maxWidth: "300px" }}>
                                                    {r.jobDescription ? r.jobDescription.slice(0, 80) + "..." : "N/A"}
                                                </td>
                                                <td>
                                                    <span className={`badge ${badgeClass}`}>
                                                        {score}% Match
                                                    </span>
                                                </td>
                                                <td style={{ color: "#64748b", fontSize: "0.82rem" }}>
                                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recent"}
                                                </td>
                                                <td>
                                                    <div className="action-btn-group">
                                                        <button
                                                            className="btn-action view"
                                                            onClick={() => handleViewReport(r.id)}
                                                        >
                                                            Inspect
                                                        </button>
                                                        <button
                                                            className="btn-action danger"
                                                            onClick={() => handleDeleteReport(r.id, r.title)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredReports.length === 0 && (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                                                No interview reports match your filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 4: SYSTEM & DIAGNOSTICS */}
                {activeTab === "system" && (
                    <div className="tab-content">
                        <div className="diagnostics-grid">
                            {/* Admin Credentials Card */}
                            <div className="diag-card" style={{ border: "1px solid rgba(99, 102, 241, 0.4)", background: "rgba(15, 23, 42, 0.9)" }}>
                                <h3>🔑 Administrator Credentials</h3>
                                <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "16px", lineHeight: "1.5" }}>
                                    Default administrator login for accessing this dashboard. Use these credentials to sign in anytime:
                                </p>

                                <div className="diag-row">
                                    <span className="diag-key">Username:</span>
                                    <span className="diag-val" style={{ color: "#818cf8" }}>admin</span>
                                </div>
                                <div className="diag-row">
                                    <span className="diag-key">Email:</span>
                                    <span className="diag-val" style={{ color: "#818cf8" }}>admin@interviewai.com</span>
                                </div>
                                <div className="diag-row">
                                    <span className="diag-key">Password:</span>
                                    <span className="diag-val" style={{ color: "#34d399" }}>AdminPassword@2026</span>
                                </div>

                                <div style={{ marginTop: "20px" }}>
                                    <button
                                        onClick={handleSeedAdmin}
                                        style={{
                                            width: "100%",
                                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                            border: "none",
                                            color: "#fff",
                                            padding: "11px",
                                            borderRadius: "8px",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)"
                                        }}
                                    >
                                        Verify / Seed Default Admin in Supabase
                                    </button>
                                </div>
                            </div>

                            {/* Database Health Card */}
                            <div className="diag-card">
                                <h3>🗄️ Database & Engine</h3>
                                <div className="diag-row">
                                    <span className="diag-key">Database Provider:</span>
                                    <span className="diag-val">Supabase PostgreSQL</span>
                                </div>
                                <div className="diag-row">
                                    <span className="diag-key">Connection Status:</span>
                                    <span className="diag-val" style={{ color: statsData?.systemHealth?.databaseConnected ? "#34d399" : "#f87171" }}>
                                        {statsData?.systemHealth?.databaseConnected ? "Connected" : "Disconnected"}
                                    </span>
                                </div>
                                <div className="diag-row">
                                    <span className="diag-key">Google Gemini API:</span>
                                    <span className="diag-val" style={{ color: statsData?.systemHealth?.geminiConfigured ? "#34d399" : "#f87171" }}>
                                        {statsData?.systemHealth?.geminiConfigured ? "Configured & Active" : "Missing API Key"}
                                    </span>
                                </div>
                                <div className="diag-row">
                                    <span className="diag-key">Runtime Environment:</span>
                                    <span className="diag-val">{statsData?.systemHealth?.environment || "production"}</span>
                                </div>
                                <div className="diag-row">
                                    <span className="diag-key">Node.js Version:</span>
                                    <span className="diag-val">{statsData?.systemHealth?.nodeVersion || process.version}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* CREATE USER MODAL */}
            {isCreateUserOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateUserOpen(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New User / Administrator</h3>
                            <button className="close-btn" onClick={() => setIsCreateUserOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleCreateUserSubmit}>
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    placeholder="Enter username..."
                                    value={newUserForm.username}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address..."
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    placeholder="Enter password..."
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Account Role</label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                >
                                    <option value="user">Candidate (User)</option>
                                    <option value="admin">Administrator (Admin)</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsCreateUserOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REPORT DETAIL INSPECT MODAL */}
            {isReportModalOpen && (
                <div className="modal-overlay" onClick={() => setIsReportModalOpen(false)}>
                    <div className="modal-card" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>{selectedReport?.title || "Interview Report Inspection"}</h3>
                                <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                                    Match Score: <strong style={{ color: "#34d399" }}>{selectedReport?.matchScore || 0}%</strong>
                                </span>
                            </div>
                            <button className="close-btn" onClick={() => setIsReportModalOpen(false)}>×</button>
                        </div>

                        {loadingReportDetails ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                                Loading full report details...
                            </div>
                        ) : selectedReport ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                <div>
                                    <h4 style={{ margin: "0 0 8px 0", color: "#f8fafc", fontSize: "0.95rem" }}>Target Job Description</h4>
                                    <div style={{
                                        background: "rgba(15, 23, 42, 0.8)",
                                        border: "1px solid rgba(255,255,255,0.06)",
                                        padding: "14px",
                                        borderRadius: "8px",
                                        fontSize: "0.85rem",
                                        color: "#cbd5e1",
                                        maxHeight: "150px",
                                        overflowY: "auto",
                                        whiteSpace: "pre-wrap"
                                    }}>
                                        {selectedReport.jobDescription}
                                    </div>
                                </div>

                                {selectedReport.technicalQuestions && selectedReport.technicalQuestions.length > 0 && (
                                    <div>
                                        <h4 style={{ margin: "0 0 8px 0", color: "#f8fafc", fontSize: "0.95rem" }}>Technical Questions ({selectedReport.technicalQuestions.length})</h4>
                                        <ul style={{ margin: 0, paddingLeft: "20px", color: "#cbd5e1", fontSize: "0.85rem" }}>
                                            {selectedReport.technicalQuestions.slice(0, 4).map((q, idx) => (
                                                <li key={idx} style={{ marginBottom: "6px" }}>
                                                    {typeof q === "string" ? q : q.question || JSON.stringify(q)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedReport.resumeHtml && (
                                    <div>
                                        <h4 style={{ margin: "0 0 8px 0", color: "#f8fafc", fontSize: "0.95rem" }}>Tailored Resume HTML Preview</h4>
                                        <div style={{
                                            background: "rgba(255, 255, 255, 0.03)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            padding: "14px",
                                            borderRadius: "8px",
                                            fontSize: "0.8rem",
                                            color: "#94a3b8",
                                            maxHeight: "120px",
                                            overflowY: "auto",
                                            fontFamily: "monospace"
                                        }}>
                                            {selectedReport.resumeHtml.slice(0, 500)}...
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div className="modal-actions">
                            <button type="button" className="btn-cancel" onClick={() => setIsReportModalOpen(false)}>
                                Close
                            </button>
                            {selectedReport && (
                                <button
                                    type="button"
                                    className="btn-action danger"
                                    onClick={() => handleDeleteReport(selectedReport._id || selectedReport.id, selectedReport.title)}
                                >
                                    Delete Report
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
