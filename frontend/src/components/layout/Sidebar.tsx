import { NavLink, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Bot,
  FileText,
  GitBranch,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();

  const navItems = [
    { icon: LayoutDashboard, label: t("nav_dashboard"), path: "/dashboard" },
    { icon: Server, label: t("nav_mcp"), path: "/mcp" },
    { icon: Bot, label: t("nav_personas"), path: "/agent" },
    { icon: FileText, label: t("nav_prompts"), path: "/prompts" },
    { icon: GitBranch, label: t("nav_plans"), path: "/solutions" },
    { icon: Sparkles, label: t("nav_skills"), path: "/skills" },
    { icon: Settings, label: t("nav_settings"), path: "/settings" },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
          <Logo size="md" showText={!collapsed} />
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Back to Home & Language Switcher */}
      <div className="px-3 py-2 border-b border-sidebar-border space-y-2">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <Home size={18} className="shrink-0" />
          {!collapsed && <span>{t("sidebar_back_home")}</span>}
        </Link>
        {!collapsed && <LanguageSwitcher />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon
                size={20}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium animate-fade-in">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="w-8 h-8 rounded-full shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-muted-foreground">
                {user?.user_metadata?.user_name?.[0]?.toUpperCase() || "D"}
              </span>
            </div>
          )}
          {!collapsed && (
            <div className="overflow-hidden flex-1 animate-fade-in">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.user_name || user?.email || "Demo User"}
              </p>
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                  onClick={signOut}
                >
                  <LogOut size={12} className="mr-1" />
                  {t("logout")}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    localStorage.removeItem("acp-demo-mode");
                    window.location.href = "/auth";
                  }}
                >
                  <LogOut size={12} className="mr-1" />
                  {t("logout")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
