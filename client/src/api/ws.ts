import { env } from "@/env";
import { getAccessToken } from "./client";

const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_BACKOFF_MS = 30_000;
const ERROR_THRESHOLD = 5;

type Listener = (payload: Record<string, unknown>) => void;

class DashboardSocket {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private listeners = new Map<string, Set<Listener>>();
  private reconnectAttempt = 0;
  private explicitClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(accessToken: string): void {
    this.explicitClose = false;
    this.cleanup();

    this.ws = new WebSocket(`${env.WS_URL}/ws/dashboard`, [accessToken]);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      for (const id of this.subscriptions) {
        this.send({ type: "subscribe", vehicleId: id });
      }
    };

    this.ws.onmessage = (e) => {
      try {
        const { type, ...payload } = JSON.parse(e.data as string);
        this.listeners.get(type)?.forEach((cb) => cb(payload));
      } catch {
        /* malformed message — ignore */
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (!this.explicitClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.explicitClose = true;
    this.cleanup();
  }

  subscribeToVehicle(id: string): void {
    this.subscriptions.add(id);
    this.send({ type: "subscribe", vehicleId: id });
  }

  unsubscribeFromVehicle(id: string): void {
    this.subscriptions.delete(id);
    this.send({ type: "unsubscribe", vehicleId: id });
  }

  on(event: string, cb: Listener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);

    return () => {
      this.listeners.get(event)?.delete(cb);
      if (this.listeners.get(event)?.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      this.emit("ws:error", { reason: "max_retries", attempts: this.reconnectAttempt });
      return;
    }

    if (this.reconnectAttempt >= ERROR_THRESHOLD) {
      this.emit("ws:error", { reason: "reconnecting", attempts: this.reconnectAttempt });
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, MAX_BACKOFF_MS);
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      const token = getAccessToken();
      if (token) {
        this.connect(token);
      }
    }, delay);
  }

  private emit(event: string, payload: Record<string, unknown>): void {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

export const dashboardSocket = new DashboardSocket();
