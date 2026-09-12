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

export async function generateReport(formData) {
    try {
        const response = await api.post("/api/interview", formData);
        return response.data;
    } catch (err) {
        console.error("Error generating report:", err);
        throw err;
    }
}

export async function getInterviewReport(id) {
    try {
        const response = await api.get(`/api/interview/${id}`);
        return response.data;
    } catch (err) {
        console.error("Error fetching report:", err);
        throw err;
    }
}

export async function getUserReports() {
    try {
        const response = await api.get("/api/interview/my-reports");
        return response.data;
    } catch (err) {
        console.error("Error fetching user reports:", err);
        throw err;
    }
}

export async function updateResume(interviewReportId, { resumeHtml, resumeData }) {
    try {
        const response = await api.put(`/api/interview/resume/${interviewReportId}`, {
            resumeHtml,
            resumeData
        });
        return response.data;
    } catch (err) {
        console.error("Error updating resume:", err);
        throw err;
    }
}

/**
 * @description service to generate pdf based on resume and user data
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
        responseType: "blob"
    });

    return response.data;
};