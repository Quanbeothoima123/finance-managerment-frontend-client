import type {
  ApiResponse,
  AuthSession,
  AuthSuccessPayload,
} from "../types/auth";
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "../utils/authStorage";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function createApiError(response: Response) {
  const payload = await parseJson<ApiResponse<unknown>>(response);
  const fieldMessage = payload?.errors?.find(Boolean)?.message;
  const message = fieldMessage || payload?.message || "Yêu cầu thất bại";
  return new ApiError(message, response.status, payload);
}

async function doRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(buildUrl(path), {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    throw await createApiError(response);
  }

  const payload = await parseJson<ApiResponse<T>>(response);
  if (!payload) {
    return null as T;
  }

  return payload.data;
}

// Singleton promise to deduplicate concurrent token refresh calls.
// When multiple requests expire simultaneously, they all wait on the same
// refresh call instead of each triggering a separate /auth/refresh hit,
// which would rotate the refresh token out from under concurrent requests.
let refreshingPromise: Promise<AuthSession | null> | null = null;

export async function refreshAuthSession(): Promise<AuthSession | null> {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  const currentSession = getStoredSession();

  refreshingPromise = (async () => {
    try {
      const data = await doRequest<AuthSuccessPayload>("/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!data) {
        clearStoredSession();
        return null;
      }

      const nextSession: AuthSession = {
        accessToken: data.accessToken,
        user: data.user,
        rememberMe: currentSession?.rememberMe ?? true,
      };

      setStoredSession(nextSession);
      return nextSession;
    } catch {
      clearStoredSession();
      return null;
    }
  })().finally(() => {
    refreshingPromise = null;
  });

  return refreshingPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | Record<string, unknown> | null;
  requiresAuth?: boolean;
  retryOnAuthError?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
) {
  const {
    body,
    headers,
    requiresAuth = false,
    retryOnAuthError = true,
    ...rest
  } = options;

  const requestHeaders = new Headers(headers);
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const session = getStoredSession();

  if (!isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (requiresAuth && session?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  let requestBody: BodyInit | undefined;
  if (body == null) {
    requestBody = undefined;
  } else if (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams ||
    isFormData
  ) {
    requestBody = body as BodyInit;
  } else {
    requestBody = JSON.stringify(body);
  }

  try {
    return await doRequest<T>(path, {
      ...rest,
      headers: requestHeaders,
      body: requestBody,
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      requiresAuth &&
      retryOnAuthError
    ) {
      const refreshed = await refreshAuthSession();
      if (!refreshed?.accessToken) {
        throw error;
      }

      return apiRequest<T>(path, {
        ...options,
        retryOnAuthError: false,
      });
    }

    throw error;
  }
}
