import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authEnabled, setAuthEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAuthStatus = useCallback(async () => {
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

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      await refreshAuthStatus();
      setIsLoading(false);
    };
    checkAuthStatus();
  }, [refreshAuthStatus]);

  const login = useCallback(async (username: string, password: string) => {
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

  const logout = useCallback(async () => {
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
