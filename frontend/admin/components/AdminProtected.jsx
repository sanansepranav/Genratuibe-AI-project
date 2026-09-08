import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@auth/hooks/useAuth";

const AdminProtected = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "80vh",
                color: "#94a3b8",
                fontSize: "1.1rem"
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: "42px",
                        height: "42px",
                        border: "3px solid #334155",
                        borderTopColor: "#6366f1",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 16px auto"
                    }} />
                    Verifying administrator privileges...
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isAdmin = user.role === "admin" || user.username === "admin" || user.email === "admin@interviewai.com";

    if (!isAdmin) {
        return (
            <div style={{
                maxWidth: "500px",
                margin: "80px auto",
                padding: "32px",
                background: "#0f172a",
                borderRadius: "16px",
                border: "1px solid #1e293b",
                textAlign: "center",
                color: "#e2e8f0",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
            }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
                <h2 style={{ fontSize: "1.6rem", marginBottom: "12px", color: "#f87171" }}>Access Restricted</h2>
                <p style={{ color: "#94a3b8", lineHeight: "1.6", marginBottom: "24px", fontSize: "0.95rem" }}>
                    The Admin Panel requires administrator permissions. You are currently signed in as <strong>{user.username || user.email}</strong>.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                    <Link to="/" style={{
                        padding: "10px 20px",
                        background: "#334155",
                        color: "#fff",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "0.9rem"
                    }}>
                        Return to App
                    </Link>
                    <Link to="/login" style={{
                        padding: "10px 20px",
                        background: "#6366f1",
                        color: "#fff",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "600",
                        fontSize: "0.9rem"
                    }}>
                        Sign In as Admin
                    </Link>
                </div>
            </div>
        );
    }

    return children;
};

export default AdminProtected;
