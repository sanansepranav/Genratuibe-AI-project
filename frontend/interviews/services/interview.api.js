import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === "production" ? "" : "http://localhost:3000"),
    withCredentials: true,
});

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