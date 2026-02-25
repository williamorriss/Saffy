import { createContext, useContext, useState } from 'react'
import type { User } from "./types";
import {client} from "./App";

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthContextType {
    isLoggedIn: () => boolean;
    session: User | null;
    retrieveSession: () => void;
    deleteSession: () => void;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<User | null>(null);
    const retrieveSession = async () => {
        const { data, error } = await client.GET("/auth/session")
        if (!data) {
            throw new Error(error);
        }
        setSession(data);
    };
    const isLoggedIn = () => session != null;

    const deleteSession = async () => {
        setSession(null);
        await client.DELETE("/auth/session");
    }

    return (
    <AuthContext.Provider value={{ session, retrieveSession, deleteSession, isLoggedIn }}>
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