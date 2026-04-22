/**
 * API Client
 * Fetch-based HTTP client for the Street Keeper backend API.
 * Supports auth via x-user-id (dev) or Authorization (production).
 */

import { API } from "../config/constants";

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  nextSyncAt?: string;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  /** Full error response body (e.g. for nextSyncAt on 429 SYNC_RATE_LIMITED). */
  readonly body?: ApiErrorResponse;

  constructor(
    message: string,
    code: string,
    status: number,
    body?: ApiErrorResponse
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.body = body;
  }
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API.BASE_URL;

    // Restore auth token synchronously so the very first API request
    // (even on a hard refresh) includes credentials.
    try {
      const stored = localStorage.getItem("street-keeper-user");
      if (stored) {
        const parsed = JSON.parse(stored) as { id?: string };
        if (parsed?.id) this.authToken = parsed.id;
      }
    } catch {
      // ignore parse errors
    }
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /** Development: use user ID as auth header (x-user-id) */
  setDevUserId(userId: string | null): void {
    this.authToken = userId;
  }

  private getHeaders(contentType: "json" | "multipart" = "json"): HeadersInit {
    const headers: HeadersInit = {};

    if (contentType === "json") {
      headers["Content-Type"] = "application/json";
    }
    // multipart: do not set Content-Type so browser sets boundary

    if (this.authToken) {
      headers["x-user-id"] = this.authToken;
      // Production: headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let data: ApiErrorResponse | T;
    try {
      data = (await response.json()) as ApiErrorResponse | T;
    } catch {
      throw new ApiError(
        response.statusText || "Request failed",
        "NETWORK_ERROR",
        response.status
      );
    }

    if (!response.ok) {
      const err = data as ApiErrorResponse;
      throw new ApiError(
        err.error ?? "Request failed",
        err.code ?? "UNKNOWN_ERROR",
        response.status,
        err
      );
    }

    return data as T;
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
      signal,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders("multipart"),
      credentials: "include",
      body: formData,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: this.getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include",
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
