import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { HomePage } from "@/pages/home-page";
import { LoginPage } from "@/pages/login-page";
import { WebhookPage } from "@/pages/webhook-page";
import { RequestDetailPage } from "@/pages/request-detail-page";

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
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
