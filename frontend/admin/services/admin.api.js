import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:3000");
const baseURL = (rawBaseUrl || "").replace(/\/api\/?$/, "").replace(/\/+$/, "");

const api = axios.create({
    baseURL,
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || "";
        if (
            error.response?.status === 401 ||
            message.toLowerCase().includes("authentication token is required") ||
            message.toLowerCase().includes("unauthorized")
        ) {
            window.dispatchEvent(
                new CustomEvent("auth:token_required", {
                    detail: { message: message || "Authentication token is required." },
                })
            );
        }
        return Promise.reject(error);
    }
);

export async function getAdminStats() {
    const res = await api.get("/api/admin/stats");
    return res.data;
}

export async function getAllUsers() {
    const res = await api.get("/api/admin/users");
    return res.data;
}

export async function createAdminUser(userData) {
    const res = await api.post("/api/admin/users", userData);
    return res.data;
}

export async function updateUserRole(userId, role) {
    const res = await api.put(`/api/admin/users/${userId}/role`, { role });
    return res.data;
}

export async function deleteUser(userId) {
    const res = await api.delete(`/api/admin/users/${userId}`);
    return res.data;
}

export async function getAllReports() {
    const res = await api.get("/api/admin/reports");
    return res.data;
}

export async function getReportDetails(reportId) {
    const res = await api.get(`/api/admin/reports/${reportId}`);
    return res.data;
}

export async function deleteReport(reportId) {
    const res = await api.delete(`/api/admin/reports/${reportId}`);
    return res.data;
}

export async function seedAdminAccount() {
    const res = await api.post("/api/admin/seed");
    return res.data;
}
