import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

type AuthUser = {
  id: string;
  email?: string | null;
  token?: string;
  refreshToken?: string;
  user_metadata?: {
    user_name?: string | null;
    avatar_url?: string | null;
  };
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "";
  const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/callback`;

  useEffect(() => {
    // Handle GitHub OAuth redirect and restore cached user
    const handleAuthRedirect = async () => {
      try {
        // 首先尝试从localStorage恢复用户信息
        const cachedUser = localStorage.getItem("acp-github-user");
        const cachedToken = localStorage.getItem("acp-auth-token");
        if (cachedUser && cachedToken) {
          try {
            const userData = JSON.parse(cachedUser);
            setUser(userData);
          } catch (e) {
            console.error("Failed to parse cached user", e);
            localStorage.removeItem("acp-github-user");
            localStorage.removeItem("acp-auth-token");
          }
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const storedState = localStorage.getItem("acp-github-oauth-state");
        const errorDescription = url.searchParams.get("error") || url.searchParams.get("error_description");

        if (errorDescription) {
          toast({
            title: "登录失败",
            description: errorDescription,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!code) {
          setLoading(false);
          return;
        }

        if (storedState && returnedState && storedState !== returnedState) {
          toast({
            title: "登录失败",
            description: "state 校验失败，请重试",
            variant: "destructive",
          });
          localStorage.removeItem("acp-github-oauth-state");
          setLoading(false);
          return;
        }

        // Clean URL to avoid reprocessing the code on reload
        window.history.replaceState({}, document.title, url.origin + url.pathname);

        if (!API_BASE_URL) {
          toast({
            title: "配置错误",
            description: "请配置 VITE_API_BASE_URL 环境变量",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Call backend API to exchange code for token and get user info
        const response = await fetch(`${API_BASE_URL}/auth/github/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            code, 
            redirectUri: REDIRECT_URI 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData?.error?.message || errorData?.error?.code || "无法完成 GitHub 登录";
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        
        // 后端返回格式: { success: true, data: { token, refreshToken, user } }
        if (!responseData.success || !responseData.data) {
          throw new Error("后端返回格式错误");
        }

        const { token, refreshToken, user: userData } = responseData.data;

        if (!token || !userData) {
          throw new Error("后端未返回 token 或用户信息");
        }

        const authedUser: AuthUser = {
          id: userData.id,
          email: userData.email,
          token: token,
          refreshToken: refreshToken,
          user_metadata: {
            user_name: userData.username,
            avatar_url: userData.avatarUrl,
          },
        };

        setUser(authedUser);
        localStorage.setItem("acp-github-user", JSON.stringify(authedUser));
        localStorage.setItem("acp-auth-token", token);
        if (refreshToken) {
          localStorage.setItem("acp-refresh-token", refreshToken);
        }
        localStorage.removeItem("acp-github-oauth-state");
        
        toast({
          title: "登录成功",
          description: `欢迎，${userData.username}！`,
        });
      } catch (error) {
        toast({
          title: "登录失败",
          description: error instanceof Error ? error.message : "无法完成 GitHub 登录",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    handleAuthRedirect();
  }, [REDIRECT_URI, API_BASE_URL, toast]);

  const signInWithGithub = async () => {
    try {
      if (!GITHUB_CLIENT_ID) {
        toast({ title: "缺少 GitHub Client ID", variant: "destructive" });
        return;
      }

      const state = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      localStorage.setItem("acp-github-oauth-state", state);

      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: "read:user user:email",
        state,
      });

      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
    } catch (error) {
      toast({
        title: "错误",
        description: "跳转到 GitHub 登录失败",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem("acp-github-user");
      localStorage.removeItem("acp-auth-token");
      localStorage.removeItem("acp-refresh-token");
      localStorage.removeItem("acp-github-oauth-state");
      setUser(null);
    } catch (error) {
      toast({
        title: "错误",
        description: "退出登录失败",
        variant: "destructive",
      });
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem("acp-auth-token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGithub, signOut, getAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
