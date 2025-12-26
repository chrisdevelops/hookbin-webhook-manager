import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { WebhookPage } from "@/pages/webhook-page";
import { RequestDetailPage } from "@/pages/request-detail-page";
import type { ReactNode } from "react";

/**
 * ProtectedRoute component that guards routes requiring authentication.
 * - If auth is disabled, renders children immediately
 * - If auth is enabled and user is authenticated, renders children
 * - If auth is enabled and user is not authenticated, redirects to /login
 */
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authEnabled, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth status
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If auth is disabled, allow access to all routes
  if (!authEnabled) {
    return <>{children}</>;
  }

  // If auth is enabled but user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/webhooks/:webhookId" element={<WebhookPage />} />
              <Route
                path="/webhooks/:webhookId/requests/:requestId"
                element={<RequestDetailPage />}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
