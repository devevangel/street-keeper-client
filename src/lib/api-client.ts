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
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API.BASE_URL;
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
        response.status
      );
    }

    return data as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
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
