const MOCK_MODE_KEY = "jobability_api_mode";
const API_BASE_URL_KEY = "jobability_api_base_url";

const getStorageValue = (key: string): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const normalizeBaseUrl = (value: string) => {
  return value.replace(/\/$/, "");
};

export const getApiBaseUrl = () => {
  const runtimeBaseUrl = getStorageValue(API_BASE_URL_KEY);

  if (runtimeBaseUrl) {
    return normalizeBaseUrl(runtimeBaseUrl);
  }

  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || "");
};

export const isMockMode = () => {
  const runtimeMode = getStorageValue(MOCK_MODE_KEY);

  if (runtimeMode === "mock") {
    return true;
  }

  if (runtimeMode === "backend") {
    /*
      GitHub Pages has no same-origin API. A remembered manual switch should
      not send requests to static HTML unless a public API URL is configured.
    */
    return import.meta.env.VITE_APP_TARGET === "pages" && !getApiBaseUrl();
  }

  return import.meta.env.VITE_USE_MOCK === "true";
};

export const isTauriGuestMode = () => {
  return import.meta.env.VITE_TAURI_GUEST === "true";
};

export const buildApiUrl = (url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  return `${baseUrl}/${url}`;
};

export const toBackendUrl = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return buildApiUrl(value);
};

interface ApiRequestOptions extends RequestInit {
  json?: unknown;
}

export const apiRequest = async <T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const headers = new Headers(options.headers);

  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(url), {
    ...options,
    credentials: "include",
    headers,
    body:
      options.json !== undefined
        ? JSON.stringify(options.json)
        : options.body,
  });

  if (!response.ok) {
    let message = `Ошибка запроса: ${response.status}`;

    try {
      const data = await response.json();
      if (data && typeof data === "object") {
        const detail = "detail" in data ? data.detail : null;
        message =
          typeof detail === "string"
            ? detail
            : `Сервер отклонил запрос (${response.status}).`;
      }
    } catch {
      message =
        response.status === 404 && import.meta.env.VITE_APP_TARGET === "pages"
          ? "Данные платформы временно недоступны."
          : `Не удалось выполнить запрос (${response.status}).`;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};
