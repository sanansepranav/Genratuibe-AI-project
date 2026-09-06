import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../auth.api";
import { useParams } from "react-router-dom";
import { generateResumePdf } from "../../interviews/services/interview.api";

export const useAuth = () => {

    const context = useContext(AuthContext);
    const { user, setUser, loading, setLoading } = context
    const { interviewId } = useParams()

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await login({ email, password });
            setUser(data.user);
            return { success: true, user: data.user };
        } catch (err) {
            console.error(err);
            const message = err.response?.data?.message || "Login failed. Please check your credentials.";
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
            const message = err.response?.data?.message || "Registration failed. Username or email may already exist.";
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

    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe();
                setUser(data.user);
            } catch (err) {
                console.log("User not authenticated", err);
            } finally {
                setLoading(false);
            }
        }
        getAndSetUser();
    }, [interviewId]);

    return { user, loading, handleLogin, handleRegister, handleLogout, getResumePdf }
}
 