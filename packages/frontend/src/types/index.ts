export interface Webhook {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  hasUnread: boolean;
  createdAt: string;
  updatedAt: string;
  lastRequestAt: string | null;
  requestCount?: number;
  url?: string;
}

export interface WebhookRequest {
  id: string;
  webhookId: string;
  method: string;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  sourceIp: string;
  createdAt: string;
  isFavorite: boolean;
}

export type WebhookStatus = "active" | "active-unread" | "inactive";

export function getWebhookStatus(webhook: Webhook): WebhookStatus {
  if (!webhook.isActive) return "inactive";
  if (webhook.hasUnread) return "active-unread";
  return "active";
}

export function getWebhookUrl(webhookId: string): string {
  // Use the current origin for the webhook URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  return `${baseUrl}/webhook/${webhookId}`;
}
