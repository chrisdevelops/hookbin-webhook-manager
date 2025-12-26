import React, { type ReactNode } from "react";
import { AUTH_UNAUTHORIZED_EVENT } from "@/lib/api";

interface User {
  id: number;
  username: string;
}

interface AuthStatus {
  authEnabled: boolean;
  isAuthenticated: boolean;
  user: User | null;
}

interface AuthContextType {
  /** Whether authentication is enabled on the backend */
  authEnabled: boolean;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** The current user, or null if not authenticated */
  user: User | null;
  /** Whether we're currently loading auth status */
  isLoading: boolean;
  /** Any error that occurred during auth operations */
  error: string | null;
  /** Login with username and password */
  login: (username: string, password: string) => Promise<void>;
  /** Logout the current user */
  logout: () => Promise<void>;
  /** Refresh the current auth status */
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authEnabled, setAuthEnabled] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshAuthStatus = React.useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/auth/status");

      if (!response.ok) {
        throw new Error("Failed to check auth status");
      }

      const status: AuthStatus = await response.json();
      setAuthEnabled(status.authEnabled);
      setIsAuthenticated(status.isAuthenticated);
      setUser(status.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check auth status");
      // If we can't check auth status, assume auth is disabled for graceful degradation
      setAuthEnabled(false);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      await refreshAuthStatus();
      setIsLoading(false);
    };
    checkAuthStatus();
  }, [refreshAuthStatus]);

  // Listen for 401 Unauthorized events from API client
  React.useEffect(() => {
    const handleUnauthorized = () => {
      // Clear authentication state when session expires
      setIsAuthenticated(false);
      setUser(null);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  const login = React.useCallback(async (username: string, password: string) => {
    try {
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      setIsAuthenticated(true);
      setUser(data.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      throw err;
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setIsAuthenticated(false);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authEnabled,
        isAuthenticated,
        user,
        isLoading,
        error,
        login,
        logout,
        refreshAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
