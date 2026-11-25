import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, type AuthUser } from "../services/auth";

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (token: string) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "abc_health_auth_token";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const loadUserProfile = useCallback(async (authToken: string): Promise<AuthUser> => {
    try {
      const userProfile = await getMe(authToken);
      setUser(userProfile);
      return userProfile;
    } catch (err) {
      console.warn("Invalid or expired session token:", err);
      logout();
      throw err;
    }
  }, [logout]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const userProfile = await getMe(storedToken);
          if (isMounted) {
            setToken(storedToken);
            setUser(userProfile);
          }
        } catch {
          if (isMounted) {
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (newToken: string): Promise<AuthUser> => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    const userProfile = await loadUserProfile(newToken);
    return userProfile;
  };

  const refreshUser = async () => {
    if (token) {
      await loadUserProfile(token);
    }
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = user?.role === "admin";
  const isCustomer = user?.role === "customer";

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated,
        isAdmin,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
