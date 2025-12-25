import type { Webhook, WebhookRequest } from "@/types";

const API_BASE = "/api";

interface PaginatedRequestsResponse {
  requests: WebhookRequest[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface ApiError {
  error: string;
  message: string;
}

export interface RequestFilters {
  search?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: "unknown_error",
        message: response.statusText,
      }));
      throw new Error(error.message);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Webhooks
  async getWebhooks(): Promise<Webhook[]> {
    return this.request<Webhook[]>("/webhooks");
  }

  async getWebhook(id: string): Promise<Webhook> {
    return this.request<Webhook>(`/webhooks/${id}`);
  }

  async createWebhook(data: {
    name: string;
    description?: string;
  }): Promise<Webhook & { url: string }> {
    return this.request<Webhook & { url: string }>("/webhooks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateWebhook(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Webhook> {
    return this.request<Webhook>(`/webhooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string): Promise<void> {
    return this.request<void>(`/webhooks/${id}`, {
      method: "DELETE",
    });
  }

  async enableWebhook(id: string): Promise<Webhook> {
    return this.request<Webhook>(`/webhooks/${id}/enable`, {
      method: "POST",
    });
  }

  async disableWebhook(id: string): Promise<Webhook> {
    return this.request<Webhook>(`/webhooks/${id}/disable`, {
      method: "POST",
    });
  }

  async clearWebhookHistory(id: string): Promise<void> {
    return this.request<void>(`/webhooks/${id}/clear`, {
      method: "POST",
    });
  }

  async markWebhookViewed(id: string): Promise<void> {
    return this.request<void>(`/webhooks/${id}/view`, {
      method: "POST",
    });
  }

  // Requests
  async getRequests(
    webhookId: string,
    page: number = 1,
    filters: RequestFilters = {}
  ): Promise<PaginatedRequestsResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));

    if (filters.search) {
      params.set("search", filters.search);
    }
    if (filters.method) {
      params.set("method", filters.method);
    }
    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    return this.request<PaginatedRequestsResponse>(
      `/webhooks/${webhookId}/requests?${params.toString()}`
    );
  }

  async getRequest(requestId: string): Promise<WebhookRequest> {
    return this.request<WebhookRequest>(`/requests/${requestId}`);
  }

  async toggleRequestFavorite(
    requestId: string,
    isFavorite: boolean
  ): Promise<WebhookRequest> {
    return this.request<WebhookRequest>(`/requests/${requestId}/favorite`, {
      method: "PATCH",
      body: JSON.stringify({ isFavorite }),
    });
  }

  getExportUrl(requestId: string): string {
    return `${API_BASE}/requests/${requestId}/export`;
  }
}

export const api = new ApiClient();
