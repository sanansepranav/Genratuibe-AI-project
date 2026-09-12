import { createBrowserRouter } from "react-router-dom";
import { AuthenticateWithRedirectCallback } from "@clerk/react";
import Login from "@auth/pages/Login.jsx";
import Register from "@auth/pages/Register.jsx";
import Protected from "@auth/components/protected.jsx";
import Home from "@interviews/pages/Home.jsx";
import Interview from "@interviews/pages/interview.jsx";
import AdminDashboard from "@admin/pages/AdminDashboard.jsx";
import AdminProtected from "@admin/components/AdminProtected.jsx";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Protected><Home /></Protected>,
    },
    {
        path: "/login",
        element: <Login/>,
    },
    {
        path: "/register",
        element: <Register/>,
    },
    {
        path: "/sso-callback",
        element: <AuthenticateWithRedirectCallback />,
    },
    {
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    {
        path: "/admin",
        element: <AdminProtected><AdminDashboard /></AdminProtected>
    }
]);