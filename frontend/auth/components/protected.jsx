import { useAuth } from "../hooks/useAuth";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Protected = ({ children }) => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return children;
};

export default Protected;