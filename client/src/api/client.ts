import { env } from "@/env";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${env.API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          setAccessToken(null);
          window.dispatchEvent(new CustomEvent("auth:logout"));
          return Promise.reject(new ApiError(res.status, "Refresh failed"));
        }
        return res.json();
      })
      .then((json) => {
        const token = json.data.accessToken as string;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
}

export async function fetcher<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const url = input.startsWith("http") ? input : `${env.API_URL}${input}`;

  const headers = new Headers(init?.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status === 204) {
    return null as T;
  }

  if (res.status === 401) {
    const isRefreshRequest = input.includes("/auth/refresh");
    if (isRefreshRequest) {
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent("auth:logout"));
      throw new ApiError(401, "Session expired");
    }

    const newToken = await refreshAccessToken();
    headers.set("Authorization", `Bearer ${newToken}`);
    const retryRes = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });

    if (retryRes.status === 204) {
      return null as T;
    }

    if (!retryRes.ok) {
      const body = await retryRes.json().catch(() => ({}));
      throw new ApiError(
        retryRes.status,
        body.message ?? "Request failed",
        body.errors,
      );
    }

    const retryBody: ApiResponse<T> = await retryRes.json();
    return retryBody.data;
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, body.message ?? "Request failed", body.errors);
  }

  return (body as ApiResponse<T>).data;
}
