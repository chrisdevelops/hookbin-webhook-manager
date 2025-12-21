import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import { HomePage } from "@/pages/home-page";
import { WebhookPage } from "@/pages/webhook-page";
import { RequestDetailPage } from "@/pages/request-detail-page";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/webhooks/:webhookId" element={<WebhookPage />} />
          <Route
            path="/webhooks/:webhookId/requests/:requestId"
            element={<RequestDetailPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
