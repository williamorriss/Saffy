import {createContext, useContext, useEffect, useState} from 'react'
import type { User } from "../types";
import {client} from "../App";
import * as React from "react";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthContextType {
    isLoggedIn: () => boolean;
    session: User | null;
    login: () => void;
    getSession: () => void;
    logout: () => void;
    deleteUser: () => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<User | null>(null);
    const getSession = async () => {
        const { data, error } = await client.GET("/api/auth/session", {});
        if (error) {
            console.error(error);
            setSession(null);
            return null;
        }

        setSession(data);
        return data;
    };

    const login = () => {
        location.href =`/api/auth/login?redirect=${location.origin}`;
    };

    const isLoggedIn = () => session != null;

    const deleteUser = async () => {
        setSession(null);
        location.href =`/api/auth/delete`;
    }

    const logout = async () => {
        setSession(null);
        location.href =`/api/auth/logout`;
    }

    // Fetch session once on first init
    useEffect(() => {
        getSession().then();
    }, []);

    return (
        <AuthContext.Provider value={{ session, login, isLoggedIn, getSession, logout, deleteUser }}>
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