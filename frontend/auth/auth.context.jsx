import { createContext, useState, useEffect } from "react";
import { getMe } from "./auth.api";
import { useUser } from "@clerk/react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isSignedIn, user: clerkUser, isLoaded: isClerkLoaded } = useUser();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await getMe();
                if (response?.user) {
                    setUser(response.user);
                    setLoading(false);
                    return;
                }
            } catch {
                // Not logged in via traditional session cookie
            }

            if (isClerkLoaded) {
                if (isSignedIn && clerkUser) {
                    setUser({
                        id: clerkUser.id,
                        _id: clerkUser.id,
                        username: clerkUser.username || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || "Candidate",
                        email: clerkUser.primaryEmailAddress?.emailAddress || "",
                        role: "user",
                        source: "clerk"
                    });
                } else if (!isSignedIn) {
                    setUser(prev => prev?.source === "clerk" ? null : prev);
                }
                setLoading(false);
            }
        };

        checkAuth();
    }, [isSignedIn, clerkUser, isClerkLoaded]);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
};