import { Server, Bot, FileText, GitBranch, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { ResourceCard } from "@/components/shared/ResourceCard";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMCPServices } from "@/hooks/useMCPServices";
import { useAgents } from "@/hooks/useAgents";
import { usePrompts } from "@/hooks/usePrompts";
import { useSolutions } from "@/hooks/useSolutions";

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { services: allServices } = useMCPServices();
  const { agents: allAgents } = useAgents();
  const { prompts: allPrompts } = usePrompts();
  const { solutions } = useSolutions();

  const userName = user?.user_metadata?.user_name || user?.email?.split("@")[0] || t("dashboard_developer");

  // 只统计用户自己创建的配置
  const services = allServices.filter(s => user && s.user_id === user.id);
  const agents = allAgents.filter(a => user && a.user_id === user.id);
  const prompts = allPrompts.filter(p => user && p.user_id === user.id);

  const recentSolutions = solutions.slice(0, 3);

  return (
    <div className="p-8 max-w-7xl">
      {/* Hero Section */}
      <div className="relative mb-10 p-8 rounded-2xl bg-gradient-to-br from-surface-2 to-surface-1 border border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(217_91%_60%_/_0.1),_transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-primary animate-pulse-glow" />
            <span className="text-sm font-medium text-primary">{t("app_subtitle")}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("dashboard_welcome")} <span className="text-gradient">{userName}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl">
            {t("dashboard_description")}
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="glow" asChild>
              <Link to="/solutions">
                {t("dashboard_create_plan")}
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/cli">{t("dashboard_view_cli")}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatsCard
          label={t("stats_mcp")}
          value={services.length}
          icon={Server}
        />
        <StatsCard
          label={t("stats_personas")}
          value={agents.length}
          icon={Bot}
        />
        <StatsCard
          label={t("stats_prompts")}
          value={prompts.length}
          icon={FileText}
        />
        <StatsCard
          label={t("stats_plans")}
          value={solutions.length}
          icon={GitBranch}
        />
      </div>

      {/* Recent Plans */}
      <PageHeader
        title={t("dashboard_recent_plans")}
        description={t("dashboard_recent_desc")}
        action={
          <Button variant="ghost" asChild>
            <Link to="/solutions">
              {t("dashboard_view_all")}
              <ArrowRight size={16} />
            </Link>
          </Button>
        }
      />
      {recentSolutions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {t("page_no_solutions_dashboard")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentSolutions.map((solution, index) => (
            <div
              key={solution.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ResourceCard
                title={solution.name}
                description={solution.description || "-"}
                icon={GitBranch}
                status="active"
                metadata={`${t("updated")} ${new Date(solution.updated_at).toLocaleDateString()}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
