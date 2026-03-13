import { createContext, useContext, useState } from 'react'
import type { User } from "./types";
import {client} from "./App";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthContextType {
    isLoggedIn: () => boolean;
    session: User | null;
    login: () => void;
    getSession: () => void;
    logout: () => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<User | null>(null);
    const getSession = async () => {
        const { data, error } = await client.GET("/auth/session", {})
        if (!data) {
            throw new Error(error);
        }
        setSession(data);
    };
    const isLoggedIn = () => session != null;

    const login =
        () => {location.href =`/auth/login?redirect=${location.origin}`;};

    const logout = async () => {
        setSession(null);
        location.href =`/auth/logout?redirect=${location.origin}`;
    }

    return (
    <AuthContext.Provider value={{ session, login, getSession, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("Context was null");
    }
    return context;
}