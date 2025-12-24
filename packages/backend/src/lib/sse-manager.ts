import type { Response } from "express";

interface SSEClient {
  id: string;
  res: Response;
  webhookId: string;
}

class SSEManager {
  private clients: Map<string, SSEClient[]> = new Map();

  /**
   * Add a new SSE client connection for a specific webhook
   */
  addClient(webhookId: string, clientId: string, res: Response): void {
    const client: SSEClient = { id: clientId, res, webhookId };

    if (!this.clients.has(webhookId)) {
      this.clients.set(webhookId, []);
    }

    this.clients.get(webhookId)!.push(client);

    console.log(
      `SSE client ${clientId} connected to webhook ${webhookId}. Total clients for webhook: ${this.clients.get(webhookId)!.length}`
    );
  }

  /**
   * Remove a client connection
   */
  removeClient(webhookId: string, clientId: string): void {
    const webhookClients = this.clients.get(webhookId);
    if (!webhookClients) return;

    const filtered = webhookClients.filter((c) => c.id !== clientId);

    if (filtered.length === 0) {
      this.clients.delete(webhookId);
    } else {
      this.clients.set(webhookId, filtered);
    }

    console.log(
      `SSE client ${clientId} disconnected from webhook ${webhookId}. Remaining clients: ${filtered.length}`
    );
  }

  /**
   * Emit an event to all clients watching a specific webhook
   */
  emit(webhookId: string, event: string, data: unknown): void {
    const webhookClients = this.clients.get(webhookId);
    if (!webhookClients || webhookClients.length === 0) return;

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

    // Send to all connected clients for this webhook
    webhookClients.forEach((client) => {
      try {
        client.res.write(message);
      } catch (error) {
        console.error(
          `Failed to send SSE message to client ${client.id}:`,
          error
        );
        // Remove dead clients
        this.removeClient(webhookId, client.id);
      }
    });

    console.log(
      `Emitted ${event} event to ${webhookClients.length} client(s) for webhook ${webhookId}`
    );
  }

  /**
   * Get the number of active clients for a webhook
   */
  getClientCount(webhookId: string): number {
    return this.clients.get(webhookId)?.length || 0;
  }
}

// Singleton instance
export const sseManager = new SSEManager();
