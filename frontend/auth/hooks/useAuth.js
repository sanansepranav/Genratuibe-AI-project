import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../auth.api";
import { generateResumePdf } from "../../interviews/services/interview.api";

export const useAuth = () => {

    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context

    function extractErrorMessage(err, defaultMessage) {
        if (err.response?.data?.message) {
            return err.response.data.message;
        }
        if (err.response?.status === 404) {
            return "API endpoint not found (404). Please verify deployment.";
        }
        if (err.response?.status && err.response.status >= 500) {
            return `Server error (${err.response.status}). Please verify database configuration.`;
        }
        if (err.message === "Network Error" || !err.response) {
            return "Network error. Unable to reach the server. Please check your connection.";
        }
        return defaultMessage;
    }

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (err) {
            console.error(err);
            const message = extractErrorMessage(err, "Login failed. Please check your credentials.");
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await register({ username, email, password });
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (err) {
            console.error(err);
            const message = extractErrorMessage(err, "Registration failed. Please check your details and try again.");
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
          try {
            const data = await logout()
            setUser(null)
        } catch(err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return { user, loading, handleLogin, handleRegister, handleLogout, getResumePdf }
}
 