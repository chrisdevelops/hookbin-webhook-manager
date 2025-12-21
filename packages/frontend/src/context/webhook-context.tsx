import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Webhook, WebhookRequest } from "@/types";
import { api } from "@/lib/api";

interface PaginatedRequests {
  requests: WebhookRequest[];
  totalPages: number;
  totalCount: number;
}

interface WebhookContextType {
  webhooks: Webhook[];
  isLoading: boolean;
  error: string | null;
  refreshWebhooks: () => Promise<void>;
  getWebhook: (id: string) => Webhook | undefined;
  createWebhook: (data: {
    name: string;
    description?: string;
  }) => Promise<Webhook>;
  updateWebhook: (
    id: string,
    updates: { name?: string; description?: string }
  ) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
  toggleWebhookActive: (id: string) => Promise<void>;
  clearWebhookHistory: (id: string) => Promise<void>;
  getRequests: (webhookId: string, page: number) => Promise<PaginatedRequests>;
  getRequestById: (requestId: string) => Promise<WebhookRequest | undefined>;
}

const WebhookContext = createContext<WebhookContextType | null>(null);

export function WebhookProvider({ children }: { children: ReactNode }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortWebhooks = (webhooks: Webhook[]): Webhook[] => {
    return [...webhooks].sort((a, b) => {
      const getPriority = (w: Webhook) => {
        if (!w.isActive) return 2;
        if (w.hasUnread) return 0;
        return 1;
      };
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const refreshWebhooks = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getWebhooks();
      setWebhooks(sortWebhooks(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhooks");
    }
  }, []);

  useEffect(() => {
    const loadWebhooks = async () => {
      setIsLoading(true);
      await refreshWebhooks();
      setIsLoading(false);
    };
    loadWebhooks();
  }, [refreshWebhooks]);

  const getWebhook = useCallback(
    (id: string) => webhooks.find((w) => w.id === id),
    [webhooks]
  );

  const createWebhook = useCallback(
    async (data: { name: string; description?: string }) => {
      const newWebhook = await api.createWebhook(data);
      setWebhooks((prev) => sortWebhooks([...prev, newWebhook]));
      return newWebhook;
    },
    []
  );

  const updateWebhook = useCallback(
    async (id: string, updates: { name?: string; description?: string }) => {
      const updated = await api.updateWebhook(id, updates);
      setWebhooks((prev) =>
        sortWebhooks(prev.map((w) => (w.id === id ? { ...w, ...updated } : w)))
      );
    },
    []
  );

  const deleteWebhook = useCallback(async (id: string) => {
    await api.deleteWebhook(id);
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const toggleWebhookActive = useCallback(
    async (id: string) => {
      const webhook = webhooks.find((w) => w.id === id);
      if (!webhook) return;

      const updated = webhook.isActive
        ? await api.disableWebhook(id)
        : await api.enableWebhook(id);

      setWebhooks((prev) =>
        sortWebhooks(prev.map((w) => (w.id === id ? { ...w, ...updated } : w)))
      );
    },
    [webhooks]
  );

  const clearWebhookHistory = useCallback(async (id: string) => {
    await api.clearWebhookHistory(id);
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, lastRequestAt: null, hasUnread: false, requestCount: 0 }
          : w
      )
    );
  }, []);

  const getRequests = useCallback(
    async (webhookId: string, page: number): Promise<PaginatedRequests> => {
      const response = await api.getRequests(webhookId, page);
      return {
        requests: response.requests,
        totalPages: response.pagination.totalPages,
        totalCount: response.pagination.totalCount,
      };
    },
    []
  );

  const getRequestById = useCallback(
    async (requestId: string): Promise<WebhookRequest | undefined> => {
      try {
        return await api.getRequest(requestId);
      } catch {
        return undefined;
      }
    },
    []
  );

  return (
    <WebhookContext.Provider
      value={{
        webhooks,
        isLoading,
        error,
        refreshWebhooks,
        getWebhook,
        createWebhook,
        updateWebhook,
        deleteWebhook,
        toggleWebhookActive,
        clearWebhookHistory,
        getRequests,
        getRequestById,
      }}
    >
      {children}
    </WebhookContext.Provider>
  );
}

export function useWebhooks() {
  const context = useContext(WebhookContext);
  if (!context) {
    throw new Error("useWebhooks must be used within a WebhookProvider");
  }
  return context;
}
