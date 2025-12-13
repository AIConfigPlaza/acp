import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, Sparkles, Grid3X3, Zap, Bot, FileText, Globe, ChevronDown, LayoutDashboard, LogOut, LogIn, Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useExplore } from "@/hooks/useExplore";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode } from "@/hooks/useDemoMode";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { API_BASE_URL, apiRequest } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type ExploreItem } from "@/lib/types";

type TabType = "all" | "solutions" | "mcp" | "agents" | "prompts";

// Get liked items from localStorage
const getLikedItems = (): Set<string> => {
  const liked = localStorage.getItem("acp-liked-items");
  return liked ? new Set(JSON.parse(liked)) : new Set();
};

const setLikedItems = (items: Set<string>) => {
  localStorage.setItem("acp-liked-items", JSON.stringify([...items]));
};

export default function Home() {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const demoMode = isDemoMode();
  const isLoggedIn = user || demoMode;
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [likedItems, setLikedItemsState] = useState<Set<string>>(getLikedItems);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [showPromptDetail, setShowPromptDetail] = useState(false);
  
  const { items: exploreItems, isLoading: isLoadingExplore, refetch: refetchExplore } = useExplore();

  // Use explore items directly
  const allItems = exploreItems;

  // Handle like
  const handleLike = useCallback(async (item: typeof allItems[0], e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 检查是否登录
    if (!isLoggedIn) {
      toast({
        title: t("home_login_required"),
        description: t("home_login_to_like"),
        variant: "default",
      });
      navigate("/auth");
      return;
    }

    const authToken = user?.token || localStorage.getItem("acp-auth-token");
    if (!authToken) {
      toast({
        title: t("home_login_required"),
        description: t("home_login_to_like"),
        variant: "default",
      });
      navigate("/auth");
      return;
    }

    const itemKey = `${item.type}-${item.id}`;
    const isLiked = likedItems.has(itemKey);
    
    try {
      // 确定API端点
      let apiPath = "";
      if (item.type === "solutions") {
        apiPath = `/api/solutions/${item.id}/like`;
      } else if (item.type === "mcp") {
        apiPath = `/api/mcp-configs/${item.id}/like`;
      } else if (item.type === "agents") {
        apiPath = `/api/agent-configs/${item.id}/like`;
      } else if (item.type === "prompts") {
        apiPath = `/api/custom-prompts/${item.id}/like`;
      }

      try {
        const result = await apiRequest<{ isLiked: boolean }>(
          apiPath,
          {
            method: "POST",
            authToken,
            requireAuth: true,
          }
        );

        if (result.data) {
        // 更新本地状态
        const newLikedItems = new Set(likedItems);
        if (result.data.isLiked) {
          newLikedItems.add(itemKey);
        } else {
          newLikedItems.delete(itemKey);
        }
        setLikedItemsState(newLikedItems);
        setLikedItems(newLikedItems);
        
          // 刷新数据以获取最新的点赞数
          refetchExplore();
        }
      } catch (error) {
        if (error instanceof Error && (error as Error & { status?: number }).status === 401) {
          toast({
            title: language === "zh" ? "需要登录" : "Login Required",
            description: language === "zh" ? "请先登录后再点赞" : "Please login to like this item",
            variant: "default",
          });
          navigate("/auth");
          return;
        }
        throw error;
      }
    } catch (error) {
      toast({
        title: t("home_like_failed"),
        description: error instanceof Error ? error.message : t("home_like_retry"),
        variant: "destructive",
      });
    }
  }, [likedItems, isLoggedIn, user, language, toast, navigate, refetchExplore]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = activeTab === "all" 
      ? allItems 
      : allItems.filter(item => item.type === activeTab);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortBy === "popularity") {
      items.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === "rating") {
      items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "likes") {
      items.sort((a, b) => b.likes - a.likes);
    } else if (sortBy === "name") {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [allItems, activeTab, searchQuery, sortBy]);

  // 从 exploreItems 中获取点赞状态
  const getLikedStatus = useCallback((item: typeof allItems[0] & { isLikedByCurrentUser?: boolean }) => {
    // 如果用户已登录，优先使用后端返回的 isLikedByCurrentUser
    if (isLoggedIn && item.isLikedByCurrentUser !== undefined) {
      return item.isLikedByCurrentUser;
    }
    // 否则使用本地存储
    const itemKey = `${item.type}-${item.id}`;
    return likedItems.has(itemKey);
  }, [likedItems, isLoggedIn]);

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: t("all"), icon: <Grid3X3 className="w-4 h-4" /> },
    { key: "solutions", label: "Solutions", icon: <Zap className="w-4 h-4" /> },
    { key: "mcp", label: "MCP", icon: <Sparkles className="w-4 h-4" /> },
    { key: "agents", label: "Agents", icon: <Bot className="w-4 h-4" /> },
    { key: "prompts", label: "Prompts", icon: <FileText className="w-4 h-4" /> },
  ];

  const typeColors: Record<string, string> = {
    solutions: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    mcp: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    agents: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    prompts: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  const typeLabels: Record<string, string> = {
    solutions: "Solutions",
    mcp: "MCP",
    agents: "Agents",
    prompts: "Prompts",
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/">
              <Logo size="md" />
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                {t("home_discover")}
              </Link>
              <Link to="/docs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t("home_docs")}
              </Link>
              <Link to="/cli" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                CLI Tool
              </Link>
            </nav>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              >
                <Globe className="w-4 h-4" />
              </Button>

              {isLoggedIn ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {demoMode ? "D" : user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm font-medium">
                        {demoMode 
                          ? t("home_demo_user")
                          : (user?.user_metadata?.user_name || user?.email?.split("@")[0])
                        }
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        if (demoMode) {
                          localStorage.removeItem("acp-demo-mode");
                          window.location.reload();
                        } else {
                          signOut();
                        }
                      }} 
                      className="text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate("/auth")} size="sm">
                  <LogIn className="w-4 h-4 mr-1" />
                  {t("login")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-20" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {t("home_support_badge")}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            The AI Config Plaza
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("home_hero_desc")}
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("home_search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 bg-muted/50 border-border/50 rounded-xl text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Tabs and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">
                {t("home_sort_downloads")}
              </SelectItem>
              <SelectItem value="likes">
                {t("home_sort_likes")}
              </SelectItem>
              <SelectItem value="rating">
                {t("home_sort_rating")}
              </SelectItem>
              <SelectItem value="name">
                {t("home_sort_name")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoadingExplore ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const itemKey = `${item.type}-${item.id}`;
              const isLiked = getLikedStatus(item);
              
              return (
                <div
                  key={itemKey}
                  className="group p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer flex flex-col"
                  onClick={() => {
                    // 根据类型导航到对应的详情页面或显示详情对话框
                    if (item.type === "solutions") {
                      navigate(`/solutions`);
                    } else if (item.type === "mcp") {
                      navigate(`/mcp`);
                    } else if (item.type === "agents") {
                      navigate(`/agent`);
                    } else if (item.type === "prompts") {
                      // 对于提示词，显示详情对话框
                      setSelectedPromptId(item.id);
                      setShowPromptDetail(true);
                    }
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {item.type === "solutions" && <Zap className="w-5 h-5 text-emerald-400" />}
                      {item.type === "mcp" && <Sparkles className="w-5 h-5 text-blue-400" />}
                      {item.type === "agents" && <Bot className="w-5 h-5 text-purple-400" />}
                      {item.type === "prompts" && <FileText className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-xs ${typeColors[item.type]}`}>
                        {typeLabels[item.type]}
                      </Badge>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4 min-h-[24px]">
                    {item.tags && item.tags.length > 0 ? (
                      item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-auto">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <button
                        onClick={(e) => handleLike(item, e)}
                        className={cn(
                          "flex items-center gap-1 transition-colors",
                          isLiked ? "text-rose-500" : "hover:text-rose-500"
                        )}
                        title={t("home_like")}
                      >
                        <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                        {formatNumber(item.likes)}
                      </button>
                      <span className="flex items-center gap-1" title={t("home_downloads") || "Downloads"}>
                        <Download className="w-3.5 h-3.5" />
                        {formatNumber(item.downloads)}
                      </span>
                      {item.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {item.ai_tool && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {item.ai_tool}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t("home_no_public_configs")}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("home_be_first")}
            </p>
            {!isLoggedIn && (
              <Button onClick={() => navigate("/auth")} className="mt-6">
                {t("login")}
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2024 AI Config Plaza. {t("home_footer")}
        </div>
      </footer>

      {/* Prompt Detail Dialog */}
      <PromptDetailDialog
        promptId={selectedPromptId}
        open={showPromptDetail}
        onOpenChange={setShowPromptDetail}
        language={language}
        onLike={handleLike}
        likedItems={likedItems}
        allItems={allItems}
      />
    </div>
  );
}

// Prompt详情对话框组件
function PromptDetailDialog({
  promptId,
  open,
  onOpenChange,
  language,
  onLike,
  likedItems,
  allItems,
}: {
  promptId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: string;
  onLike: (item: ExploreItem, e: React.MouseEvent) => void;
  likedItems: Set<string>;
  allItems: ExploreItem[];
}) {
  const { getAuthToken } = useAuth();
  const [prompt, setPrompt] = useState<{ name: string; description: string | null; content_md: string; tags: string[] | null; downloads: number; likes: number; rating: number | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const item = allItems.find(i => i.type === "prompts" && i.id === promptId);

  useEffect(() => {
    if (open && promptId) {
      setIsLoading(true);
      const authToken = getAuthToken();
      apiRequest<{ id: string; name: string; description: string; content: string; tags: string[]; downloads: number; likes: number; rating: number }>(
        `/api/custom-prompts/${promptId}`,
        { authToken, requireAuth: false }
      )
        .then((result) => {
          setPrompt({
            name: result.data.name,
            description: result.data.description || null,
            content_md: result.data.content,
            tags: result.data.tags || null,
            downloads: result.data.downloads,
            likes: result.data.likes,
            rating: result.data.rating || null,
          });
        })
        .catch(() => {
          setPrompt(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setPrompt(null);
    }
  }, [open, promptId, getAuthToken]);

  if (!promptId) return null;

  const itemKey = `prompts-${promptId}`;
  const isLiked = likedItems.has(itemKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{prompt?.name || item?.name || ""}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : prompt ? (
          <div className="space-y-4">
            {prompt.description && (
              <p className="text-sm text-muted-foreground">{prompt.description}</p>
            )}
            {prompt.tags && prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="border rounded-lg p-4 bg-muted/50">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {prompt.content_md}
              </pre>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{t("home_downloads")}: {prompt.downloads}</span>
                <button
                  onClick={(e) => {
                    if (item) {
                      onLike(item, e);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1 transition-colors",
                    isLiked ? "text-rose-500" : "hover:text-rose-500"
                  )}
                >
                  <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                  {prompt.likes}
                </button>
                {prompt.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    {prompt.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {t("home_prompt_detail_failed")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
