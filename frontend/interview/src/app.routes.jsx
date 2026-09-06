import { createBrowserRouter } from "react-router-dom";
import Login from "@auth/pages/Login.jsx";
import Register from "@auth/pages/Register.jsx";
import Protected from "@auth/components/protected.jsx";
import Home from "@interviews/pages/Home.jsx";
import Interview from "@interviews/pages/interview.jsx";

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
        path: "/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    }
]);