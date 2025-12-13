import { Key, RefreshCw, Copy, Check, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, apiRequest } from "@/lib/api";

interface CliTokenDto {
  id: string;
  token: string;
  createdAt: string;
  lastUsedAt?: string | null;
}

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { getAuthToken } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCliToken();
  }, []);

  const fetchCliToken = async () => {
    try {
      setLoading(true);
      const authToken = getAuthToken();
      if (!authToken) {
        setToken("");
        setLoading(false);
        return;
      }

      const result = await apiRequest<{ token: string }>(
        "/api/cli-token",
        { authToken, requireAuth: true }
      );

      if (result.data) {
        setToken(result.data.token || "");
      } else {
        setToken("");
      }
    } catch (error) {
      console.error("Failed to fetch CLI token:", error);
      setToken("");
      toast({
        title: t("settings_fetch_failed"),
        description: error instanceof Error ? error.message : t("settings_fetch_token_failed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const authToken = getAuthToken();
      if (!authToken) {
        toast({
          title: t("settings_not_logged_in"),
          description: t("settings_please_login"),
          variant: "destructive",
        });
        return;
      }

      const result = await apiRequest<{ token: string }>(
        "/api/cli-token/refresh",
        {
          method: "POST",
          authToken,
          requireAuth: true,
        }
      );

      if (result.data) {
        setToken(result.data.token || "");
        toast({
          title: t("settings_refresh_success"),
          description: t("settings_token_updated"),
        });
      } else {
        throw new Error(t("settings_refresh_failed"));
      }
    } catch (error) {
      console.error("Failed to refresh CLI token:", error);
      toast({
        title: t("settings_refresh_failed"),
        description: error instanceof Error ? error.message : t("settings_refresh_token_failed"),
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = () => {
    if (token) {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title={t("settings_title")}
        description={t("settings_description")}
      />

      {/* Language */}
      <div className="p-6 rounded-xl bg-card border border-border/50 mb-6 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-surface-2">
            <Globe size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">{t("settings_language")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("settings_language_desc")}
            </p>
            <div className="flex gap-2">
              <Button
                variant={language === "en" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("en")}
              >
                English
              </Button>
              <Button
                variant={language === "zh" ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage("zh")}
              >
                中文
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CLI Token */}
      <div className="p-6 rounded-xl bg-card border border-border/50 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-surface-2">
            <Key size={24} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">{t("settings_cli_token")}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("settings_cli_token_desc")}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-10 bg-surface-2 border border-border/50 rounded-md">
                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                <Input
                      value={token || ""}
                  readOnly
                      placeholder={token ? "" : t("settings_no_token")}
                  className="font-mono text-sm bg-surface-2 border-border/50 pr-10"
                />
                    {token && (
                <button
                  onClick={handleCopy}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-surface-3 transition-colors"
                >
                  {copied ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <Copy size={14} className="text-muted-foreground" />
                  )}
                </button>
                    )}
                  </>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing || loading}
              >
                {refreshing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                <RefreshCw size={14} />
                )}
                {t("settings_regenerate")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
