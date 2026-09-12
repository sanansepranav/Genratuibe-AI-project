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
        const url = error.config?.url || "";
        const message = error.response?.data?.message || "";
        // Don't show toast for passive background auth check
        if (!url.includes("/api/auth/me")) {
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
        }
        return Promise.reject(error);
    }
);

export async function register({ username, email, password }) {
    try {
        const response = await api.post("/api/auth/register", {
            username, email, password
        })
        return response.data;
    } catch (err) {
        console.error("Error registering user:", err);
        throw err;
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/api/auth/login", {
            email, password
        });
        return response.data;
    } catch (err) {
        console.error("Error logging in user:", err);
        throw err;
    }
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout");
        return response.data;
    } catch (err) {
        console.error("Error logging out user:", err);
        throw err;
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/me");
        return response.data;
    } catch (err) {
        console.error("Error fetching current user:", err);
        throw err;
    }
}