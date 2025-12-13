/**
 * 共享的 API 配置和工具函数
 */

// API 基础 URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  "https://api.ai-config-plaza.com";

/**
 * 通用 API 响应类型
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
    stackTrace?: string;
    exceptionType?: string;
  };
}

/**
 * 创建带认证的请求头
 */
export function createAuthHeaders(authToken: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  
  return headers;
}

/**
 * 通用 API 请求函数
 */
async function refreshAuthToken(): Promise<string> {
  // 仅在浏览器环境下使用 localStorage
  if (typeof window === "undefined") {
    throw new Error("无法刷新令牌");
  }

  const refreshToken = localStorage.getItem("acp-refresh-token");
  if (!refreshToken) {
    throw new Error("缺少刷新令牌");
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `刷新失败: ${res.statusText}`;
    throw new Error(message);
  }

  const data: ApiResponse<{ accessToken: string; refreshToken?: string }> = await res.json();
  if (!data.success || !data.data?.accessToken) {
    throw new Error(data.error?.message || "刷新令牌失败");
  }

  const newAccess = data.data.accessToken;
  const newRefresh = data.data.refreshToken;

  localStorage.setItem("acp-auth-token", newAccess);
  if (newRefresh) {
    localStorage.setItem("acp-refresh-token", newRefresh);
  }

  return newAccess;
}

export async function apiRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    authToken?: string | null;
    requireAuth?: boolean;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, requireAuth = false } = options;
  let authToken = options.authToken ?? (typeof window !== "undefined" ? localStorage.getItem("acp-auth-token") : null);

  if (requireAuth && !authToken) {
    throw new Error("未登录");
  }

  const doFetch = async (token: string | null) => {
    const headers = createAuthHeaders(token || null);
    return fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let response = await doFetch(authToken);

  // 如果未授权且有刷新令牌，尝试刷新一次
  if (response.status === 401 && typeof window !== "undefined" && localStorage.getItem("acp-refresh-token")) {
    try {
      const newToken = await refreshAuthToken();
      authToken = newToken;
      response = await doFetch(newToken);
    } catch (refreshError) {
      const err = new Error(refreshError instanceof Error ? refreshError.message : "刷新令牌失败");
      (err as Error & { status?: number }).status = 401;
      throw err;
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error?.message || `请求失败: ${response.statusText}`;
    const error = new Error(errorMessage);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error?.message || "请求失败");
  }

  return result;
}

/**
 * 检查用户是否已登录
 */
export function requireAuth(user: unknown, authToken: string | null): void {
  if (!user || !authToken) {
    throw new Error("未登录");
  }
}

