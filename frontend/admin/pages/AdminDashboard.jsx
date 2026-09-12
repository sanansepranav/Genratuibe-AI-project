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

    // Active navigation tab: "overview" | "users" | "reports" | "system"
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
        if (!window.confirm(`Change ${targetUser.username}'s role to ${newRole.toUpperCase()}?`)) return;

        try {
            await updateUserRole(targetUser.id, newRole);
            showToast(`Updated ${targetUser.username} to ${newRole}.`, "success");
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update role", "error");
        }
    };

    const handleDeleteUser = async (targetUser) => {
        if (!window.confirm(`Delete candidate "${targetUser.username}" and all their interview reports?`)) return;

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

    const handleSeedAdmin = async () => {
        try {
            const res = await seedAdminAccount();
            showToast(res.message || "Admin account verified & active!", "success");
            fetchAllData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to seed admin account.", "error");
        }
    };

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

    const totalCandidatesCount = statsData?.stats?.totalUsers ?? usersList.length;
    const totalReportsCount = statsData?.stats?.totalReports ?? reportsList.length;
    const avgScore = statsData?.stats?.averageMatchScore ?? 0;
    const isSystemHealthy = statsData?.systemHealth?.databaseConnected;

    const highCount = statsData?.stats?.scoreDistribution?.high ?? 0;
    const medCount = statsData?.stats?.scoreDistribution?.medium ?? 0;
    const lowCount = statsData?.stats?.scoreDistribution?.low ?? 0;
    const totalScored = (highCount + medCount + lowCount) || 1;

    return (
        <div className="admin-antigravity-layout">
            {/* 1. Slim Fixed Left Sidebar (240px) */}
            <aside className="admin-sidebar">
                <div className="sidebar-brand">
                    <img
                        className="brand-shield-icon"
                        src="https://img.magnific.com/premium-photo/tech-evolution-generative-ai-logo_1106493-60018.jpg?semt=ais_hybrid&w=740&q=80"
                        alt="Interview AI logo"
                    />
                    <div className="brand-text-wrap">
                        <span className="brand-title">Interview AI</span>
                        <span className="brand-sub">Admin Console</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group-label">MANAGEMENT</div>

                    <button
                        className={`sidebar-nav-item ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        <span className="item-icon">📊</span>
                        <span className="item-text">Dashboard</span>
                        {activeTab === "overview" && <span className="active-dot" />}
                    </button>

                    <button
                        className={`sidebar-nav-item ${activeTab === "users" ? "active" : ""}`}
                        onClick={() => setActiveTab("users")}
                    >
                        <span className="item-icon">👥</span>
                        <span className="item-text">Candidates & Users</span>
                        <span className="pill-counter">{usersList.length}</span>
                    </button>

                    <button
                        className={`sidebar-nav-item ${activeTab === "reports" ? "active" : ""}`}
                        onClick={() => setActiveTab("reports")}
                    >
                        <span className="item-icon">📄</span>
                        <span className="item-text">Interview Reports</span>
                        <span className="pill-counter">{reportsList.length}</span>
                    </button>

                    <div className="nav-group-label" style={{ marginTop: "20px" }}>SYSTEM</div>

                    <button
                        className={`sidebar-nav-item ${activeTab === "system" ? "active" : ""}`}
                        onClick={() => setActiveTab("system")}
                    >
                        <span className="item-icon">⚙️</span>
                        <span className="item-text">Diagnostics & Keys</span>
                    </button>
                </nav>

                {/* Sidebar Bottom Profile */}
                <div className="sidebar-footer">
                    <Link to="/" className="sidebar-app-link">
                        <span>← Return to Studio</span>
                    </Link>

                    <div className="sidebar-user-card">
                        <div className="user-avatar-circle">
                            {(user?.username || "A").charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info-text">
                            <span className="user-name">{user?.username || "Admin"}</span>
                            <span className="user-badge">ADMINISTRATOR</span>
                        </div>
                        <button className="user-logout-btn" onClick={handleLogout} title="Logout">
                            ⏻
                        </button>
                    </div>
                </div>
            </aside>

            {/* 2. Main Full-Width Content Area */}
            <div className="admin-main-viewport">
                {/* Floating Notification Toast */}
                {toast.show && (
                    <div className={`admin-toast-banner ${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                )}

                {/* Top Action Bar */}
                <header className="admin-top-bar">
                    <div className="top-bar-left">
                        <h2>
                            {activeTab === "overview" && "Dashboard Overview"}
                            {activeTab === "users" && "Candidates & User Accounts"}
                            {activeTab === "reports" && "Platform Interview Reports"}
                            {activeTab === "system" && "System Diagnostics & Setup"}
                        </h2>
                        <span className="date-indicator">
                            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>

                    <div className="top-bar-actions">
                        <button className="top-btn secondary" onClick={handleSeedAdmin}>
                            <span>🔑 Seed Admin</span>
                        </button>
                        <button className="top-btn secondary" onClick={handleExportData}>
                            <span>📥 Export JSON</span>
                        </button>
                        <button className="top-btn primary" onClick={fetchAllData}>
                            <span>🔄 Refresh</span>
                        </button>
                    </div>
                </header>

                <div className="admin-content-scroll">
                    {/* Top Row: 4 KPI Stat Cards */}
                    <section className="kpi-cards-grid">
                        {/* KPI 1: Total Candidates */}
                        <div className="kpi-card">
                            <div className="kpi-top">
                                <span className="kpi-label">Total Candidates</span>
                                <span className="trend-badge positive">+100% active</span>
                            </div>
                            <div className="kpi-number">{totalCandidatesCount}</div>
                            <div className="kpi-sub">Registered platform users</div>
                        </div>

                        {/* KPI 2: Average Match Score */}
                        <div className="kpi-card">
                            <div className="kpi-top">
                                <span className="kpi-label">Avg Match Score</span>
                                <span className="trend-badge highlight">{avgScore >= 70 ? "High Quality" : "Moderate"}</span>
                            </div>
                            <div className="kpi-number">{avgScore}%</div>
                            <div className="kpi-sub">Job alignment accuracy</div>
                        </div>

                        {/* KPI 3: Total Reports Generated */}
                        <div className="kpi-card">
                            <div className="kpi-top">
                                <span className="kpi-label">Reports & Resumes</span>
                                <span className="trend-badge neutral">AI Synthesized</span>
                            </div>
                            <div className="kpi-number">{totalReportsCount}</div>
                            <div className="kpi-sub">Interview packages created</div>
                        </div>

                        {/* KPI 4: System Health */}
                        <div className="kpi-card">
                            <div className="kpi-top">
                                <span className="kpi-label">System Health</span>
                                <span className={`status-pill ${isSystemHealthy ? "healthy" : "warning"}`}>
                                    {isSystemHealthy ? "● Operational" : "● Check Config"}
                                </span>
                            </div>
                            <div className="kpi-number" style={{ fontSize: "1.6rem" }}>
                                {isSystemHealthy ? "Healthy" : "Attention"}
                            </div>
                            <div className="kpi-sub">
                                Gemini AI: {statsData?.systemHealth?.geminiConfigured ? "Connected" : "Set API Key"}
                            </div>
                        </div>
                    </section>

                    {/* TAB 1: OVERVIEW DASHBOARD */}
                    {activeTab === "overview" && (
                        <div className="dashboard-sections-wrap">
                            {/* Row: Score Distribution Chart + Quick Summary */}
                            <div className="overview-dual-grid">
                                {/* Score Distribution Card */}
                                <div className="card-container">
                                    <div className="card-header">
                                        <div>
                                            <h3>Candidate Match Score Distribution</h3>
                                            <p className="card-sub">Distribution of candidate alignment scores across all generated reports</p>
                                        </div>
                                    </div>

                                    <div className="score-bars-chart">
                                        <div className="chart-row">
                                            <div className="row-labels">
                                                <span className="tier-badge green">High Match (75% - 100%)</span>
                                                <span className="count-num">{highCount} candidate{highCount !== 1 ? "s" : ""} ({Math.round((highCount / totalScored) * 100)}%)</span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill green"
                                                    style={{ width: `${(highCount / totalScored) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="chart-row">
                                            <div className="row-labels">
                                                <span className="tier-badge amber">Moderate Match (50% - 74%)</span>
                                                <span className="count-num">{medCount} candidate{medCount !== 1 ? "s" : ""} ({Math.round((medCount / totalScored) * 100)}%)</span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill amber"
                                                    style={{ width: `${(medCount / totalScored) * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="chart-row">
                                            <div className="row-labels">
                                                <span className="tier-badge red">Needs Growth (&lt; 50%)</span>
                                                <span className="count-num">{lowCount} candidate{lowCount !== 1 ? "s" : ""} ({Math.round((lowCount / totalScored) * 100)}%)</span>
                                            </div>
                                            <div className="progress-track">
                                                <div
                                                    className="progress-fill red"
                                                    style={{ width: `${(lowCount / totalScored) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Registrations Card */}
                                <div className="card-container">
                                    <div className="card-header">
                                        <div>
                                            <h3>Recent Candidate Registrations</h3>
                                            <p className="card-sub">Latest users who joined the interview preparation platform</p>
                                        </div>
                                        <button className="header-view-all" onClick={() => setActiveTab("users")}>
                                            View All →
                                        </button>
                                    </div>

                                    <div className="table-wrapper mini">
                                        <table className="antigravity-table">
                                            <thead>
                                                <tr>
                                                    <th>Candidate</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usersList.slice(0, 5).map((u) => (
                                                    <tr key={u.id}>
                                                        <td>
                                                            <div className="user-cell">
                                                                <span className="avatar-chip">{(u.username || "U").charAt(0).toUpperCase()}</span>
                                                                <span className="username-text">{u.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="email-text">{u.email}</td>
                                                        <td>
                                                            <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {usersList.length === 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="empty-cell">No registrations found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Reports Table Card */}
                            <div className="card-container" style={{ marginTop: "24px" }}>
                                <div className="card-header">
                                    <div>
                                        <h3>Recent Generated Interview Plans & Resumes</h3>
                                        <p className="card-sub">AI evaluations synthesized for candidate target roles</p>
                                    </div>
                                    <button className="header-view-all" onClick={() => setActiveTab("reports")}>
                                        View All Reports →
                                    </button>
                                </div>

                                <div className="table-wrapper">
                                    <table className="antigravity-table">
                                        <thead>
                                            <tr>
                                                <th>Report Title</th>
                                                <th>Candidate</th>
                                                <th>Match Score</th>
                                                <th>Created Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportsList.slice(0, 5).map((r) => {
                                                const score = r.matchScore || 0;
                                                const badgeClass = score >= 75 ? "score-high" : score >= 50 ? "score-medium" : "score-low";
                                                return (
                                                    <tr key={r.id}>
                                                        <td className="title-cell">{r.title}</td>
                                                        <td className="user-cell-plain">{r.userName}</td>
                                                        <td>
                                                            <span className={`score-badge ${badgeClass}`}>
                                                                {score}% Match
                                                            </span>
                                                        </td>
                                                        <td className="date-cell">
                                                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                                                        </td>
                                                        <td>
                                                            <button className="btn-action view" onClick={() => handleViewReport(r.id)}>
                                                                Inspect
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {reportsList.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="empty-cell">No interview reports generated yet.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: CANDIDATES & USERS */}
                    {activeTab === "users" && (
                        <div className="card-container">
                            <div className="table-toolbar">
                                <div className="search-input-wrap">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search candidate by username or email..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>

                                <div className="toolbar-actions">
                                    <select
                                        className="role-filter-select"
                                        value={userRoleFilter}
                                        onChange={(e) => setUserRoleFilter(e.target.value)}
                                    >
                                        <option value="all">All Roles</option>
                                        <option value="user">Candidate (User)</option>
                                        <option value="admin">Administrator</option>
                                    </select>

                                    <button
                                        className="btn-create-user"
                                        onClick={() => setIsCreateUserOpen(true)}
                                    >
                                        <span>+ Add User</span>
                                    </button>
                                </div>
                            </div>

                            <div className="table-wrapper">
                                <table className="antigravity-table">
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Email</th>
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
                                                    <div className="user-cell">
                                                        <span className="avatar-chip">{(u.username || "U").charAt(0).toUpperCase()}</span>
                                                        <span className="username-text">{u.username}</span>
                                                    </div>
                                                </td>
                                                <td className="email-text">{u.email}</td>
                                                <td>
                                                    <span className={`role-badge ${u.role === "admin" ? "admin" : "user"}`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="report-count-cell">{u.reportCount || 0}</td>
                                                <td className="date-cell">
                                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                                                </td>
                                                <td>
                                                    <div className="action-buttons-group">
                                                        <button
                                                            className="btn-action role"
                                                            onClick={() => handleToggleRole(u)}
                                                            title="Toggle role"
                                                        >
                                                            {u.role === "admin" ? "Demote" : "Make Admin"}
                                                        </button>
                                                        <button
                                                            className="btn-action danger"
                                                            onClick={() => handleDeleteUser(u)}
                                                            title="Delete account"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="empty-cell">No users match your search.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: INTERVIEW REPORTS */}
                    {activeTab === "reports" && (
                        <div className="card-container">
                            <div className="table-toolbar">
                                <div className="search-input-wrap">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search reports by title, candidate, or keyword..."
                                        value={reportSearch}
                                        onChange={(e) => setReportSearch(e.target.value)}
                                    />
                                </div>

                                <div className="toolbar-actions">
                                    <select
                                        className="role-filter-select"
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

                            <div className="table-wrapper">
                                <table className="antigravity-table">
                                    <thead>
                                        <tr>
                                            <th>Report Title</th>
                                            <th>Candidate</th>
                                            <th>Target Job Snippet</th>
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
                                                    <td className="title-cell">{r.title}</td>
                                                    <td className="user-cell-plain">
                                                        <div>{r.userName}</div>
                                                        {r.userEmail && <small className="sub-email">{r.userEmail}</small>}
                                                    </td>
                                                    <td className="snippet-cell">
                                                        {r.jobDescription ? r.jobDescription.slice(0, 85) + "..." : "N/A"}
                                                    </td>
                                                    <td>
                                                        <span className={`score-badge ${badgeClass}`}>
                                                            {score}% Match
                                                        </span>
                                                    </td>
                                                    <td className="date-cell">
                                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently"}
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons-group">
                                                            <button className="btn-action view" onClick={() => handleViewReport(r.id)}>
                                                                Inspect
                                                            </button>
                                                            <button className="btn-action danger" onClick={() => handleDeleteReport(r.id, r.title)}>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredReports.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="empty-cell">No reports match your search criteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SYSTEM & DIAGNOSTICS */}
                    {activeTab === "system" && (
                        <div className="overview-dual-grid">
                            {/* Administrator Credentials Card */}
                            <div className="card-container highlight-border">
                                <div className="card-header">
                                    <div>
                                        <h3>🔑 Administrator Credentials</h3>
                                        <p className="card-sub">Use these default credentials to sign in anytime</p>
                                    </div>
                                </div>

                                <div className="info-key-value-list">
                                    <div className="info-row">
                                        <span className="row-key">Username</span>
                                        <span className="row-val highlight-val">admin</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="row-key">Email</span>
                                        <span className="row-val highlight-val">admin@interviewai.com</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="row-key">Password</span>
                                        <span className="row-val green-val">AdminPassword@2026</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: "24px" }}>
                                    <button className="btn-primary-full" onClick={handleSeedAdmin}>
                                        Verify & Seed Admin Account in Database
                                    </button>
                                </div>
                            </div>

                            {/* System Status Card */}
                            <div className="card-container">
                                <div className="card-header">
                                    <div>
                                        <h3>🗄️ System Architecture & Connectivity</h3>
                                        <p className="card-sub">Live health checks for database and generative AI services</p>
                                    </div>
                                </div>

                                <div className="info-key-value-list">
                                    <div className="info-row">
                                        <span className="row-key">Database Engine</span>
                                        <span className="row-val">Supabase PostgreSQL (Resilient Fallback Active)</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="row-key">Database Status</span>
                                        <span className={`status-pill ${isSystemHealthy ? "healthy" : "warning"}`}>
                                            {isSystemHealthy ? "● Connected" : "● Fallback Active"}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="row-key">Google Gemini AI Engine</span>
                                        <span className="row-val" style={{ color: statsData?.systemHealth?.geminiConfigured ? "#34d399" : "#f87171" }}>
                                            {statsData?.systemHealth?.geminiConfigured ? "Connected & Ready" : "Missing API Key"}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="row-key">Node.js Runtime</span>
                                        <span className="row-val">{statsData?.systemHealth?.nodeVersion || process.version}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE USER MODAL */}
            {isCreateUserOpen && (
                <div className="modal-backdrop" onClick={() => setIsCreateUserOpen(false)}>
                    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New User / Administrator</h3>
                            <button className="modal-close-btn" onClick={() => setIsCreateUserOpen(false)}>×</button>
                        </div>

                        <form onSubmit={handleCreateUserSubmit}>
                            <div className="form-field">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    placeholder="Enter username..."
                                    value={newUserForm.username}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    placeholder="Enter email address..."
                                    value={newUserForm.email}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    placeholder="Enter password..."
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label>Account Role</label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                >
                                    <option value="user">Candidate (User)</option>
                                    <option value="admin">Administrator (Admin)</option>
                                </select>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-ghost" onClick={() => setIsCreateUserOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-accent">
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* INSPECT REPORT MODAL */}
            {isReportModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsReportModalOpen(false)}>
                    <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3>{selectedReport?.title || "Interview Report Inspection"}</h3>
                                <span className="report-score-indicator">
                                    Match Score: <strong>{selectedReport?.matchScore || 0}%</strong>
                                </span>
                            </div>
                            <button className="modal-close-btn" onClick={() => setIsReportModalOpen(false)}>×</button>
                        </div>

                        {loadingReportDetails ? (
                            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                                Loading full report details...
                            </div>
                        ) : selectedReport ? (
                            <div className="modal-scroll-body">
                                <div className="report-detail-section">
                                    <h4>Target Job Description</h4>
                                    <div className="code-snippet-box">
                                        {selectedReport.jobDescription}
                                    </div>
                                </div>

                                {selectedReport.technicalQuestions && selectedReport.technicalQuestions.length > 0 && (
                                    <div className="report-detail-section">
                                        <h4>Technical Questions ({selectedReport.technicalQuestions.length})</h4>
                                        <ul className="detail-questions-list">
                                            {selectedReport.technicalQuestions.slice(0, 5).map((q, idx) => (
                                                <li key={idx}>
                                                    {typeof q === "string" ? q : q.question || JSON.stringify(q)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedReport.resumeHtml && (
                                    <div className="report-detail-section">
                                        <h4>Tailored Resume Preview Snippet</h4>
                                        <div className="code-snippet-box html-preview">
                                            {selectedReport.resumeHtml.slice(0, 600)}...
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        <div className="modal-footer">
                            <button type="button" className="btn-ghost" onClick={() => setIsReportModalOpen(false)}>
                                Close
                            </button>
                            {selectedReport && (
                                <button
                                    type="button"
                                    className="btn-danger"
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
