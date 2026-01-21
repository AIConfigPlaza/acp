import { useState, useEffect } from "react";
import { GitBranch, Plus, Settings2, Trash2, Loader2, Globe, Lock, Download, Heart, Star, Server, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSolutions, Solution } from "@/hooks/useSolutions";
import { SolutionDialog } from "@/components/dialogs/SolutionDialog";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/hooks/useDemoMode";
import { apiRequest } from "@/lib/api";

const AI_TOOL_COLORS: Record<string, string> = {
  "claude-code": "bg-orange-500/20 text-orange-400",
  "copilot": "bg-blue-500/20 text-blue-400",
  "codex": "bg-green-500/20 text-green-400",
  "cursor": "bg-purple-500/20 text-purple-400",
  "aider": "bg-cyan-500/20 text-cyan-400",
};

export default function Solutions() {
  const { t, language } = useLanguage();
  const { user, getAuthToken } = useAuth();
  const demoMode = isDemoMode();
  const { solutions, isLoading, create, update, delete: deleteSolution, getSolutionAssociations } = useSolutions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSolution, setDeletingSolution] = useState<Solution | null>(null);
  const [editAssociations, setEditAssociations] = useState<{
    mcp_service_ids: string[];
    prompt_ids: { id: string; step_order: number }[];
    skill_ids: string[];
  } | undefined>();

  const handleSave = (data: {
    id?: string;
    name?: string;
    description?: string;
    agent_id?: string | null;
    status?: string;
    is_public?: boolean;
    ai_tool?: string;
    tags?: string[];
    mcp_service_ids?: string[];
    prompt_ids?: { id: string; step_order: number }[];
    skill_ids?: string[];
  }) => {
    if (data.id) {
      update(data as Parameters<typeof update>[0]);
    } else {
      create(data as Parameters<typeof create>[0]);
    }
  };

  const handleEdit = async (solution: Solution) => {
    const associations = await getSolutionAssociations(solution.id);
    setEditAssociations(associations);
    
    // 重新获取详情数据以确保 aiTool 等字段是最新的（使用详情接口返回的数据）
    if (!demoMode && user) {
      try {
        const authToken = getAuthToken();
        if (authToken) {
          interface SolutionDetailDto {
            id: string;
            name: string;
            description: string;
            aiTool: string;
            agentConfigId: string;
            tags: string[];
            isPublic: boolean;
            downloads: number;
            likes: number;
            rating: number;
            isLikedByCurrentUser: boolean;
            compatibility: Record<string, unknown>;
            author: { id: string; username: string; avatarUrl: string | null };
            agentConfig?: { id: string; name: string; description: string } | null;
            mcpConfigs: Array<{ id: string; name: string }>;
            customPrompts: Array<{ id: string; name: string }>;
            skills: Array<{ id: string; name: string }>;
            createdAt: string;
            updatedAt: string;
          }
          
          const result = await apiRequest<SolutionDetailDto>(
            `/api/solutions/${solution.id}`,
            { authToken, requireAuth: true }
          );
          
          // aiTool 转换函数（支持 PascalCase 和 camelCase）
          const aiToolToFrontend = (tool: string): string => {
            const mapping: Record<string, string> = {
              "ClaudeCode": "claude-code",
              "claudeCode": "claude-code",
              "Copilot": "copilot",
              "copilot": "copilot",
              "Codex": "codex",
              "codex": "codex",
              "Cursor": "cursor",
              "cursor": "cursor",
              "Aider": "aider",
              "aider": "aider",
              "Custom": "custom",
              "custom": "custom",
            };
            return mapping[tool] || tool.toLowerCase();
          };
          
          // 转换详情数据为 Solution 格式
          const detailSolution: Solution = {
            id: result.data.id,
            user_id: result.data.author.id,
            name: result.data.name,
            description: result.data.description || null,
            agent_id: result.data.agentConfigId || null,
            config_json: {},
            status: "active",
            last_run_at: null,
            created_at: result.data.createdAt,
            updated_at: result.data.updatedAt,
            is_public: result.data.isPublic,
            downloads: result.data.downloads,
            likes: result.data.likes,
            rating: result.data.rating || null,
            isLikedByCurrentUser: result.data.isLikedByCurrentUser,
            tags: result.data.tags || [],
            ai_tool: aiToolToFrontend(result.data.aiTool),
            compatibility: result.data.compatibility || {},
            agent: result.data.agentConfig ? { name: result.data.agentConfig.name } : null,
            mcp_services: result.data.mcpConfigs?.map(m => ({ id: m.id, name: m.name })) || [],
            prompts: result.data.customPrompts?.map((p, index) => ({ id: p.id, name: p.name, step_order: index })) || [],
            skills: result.data.skills?.map(s => ({ id: s.id, name: s.name })) || [],
          };
          setEditingSolution(detailSolution);
        } else {
          setEditingSolution(solution);
        }
      } catch (error) {
        // 如果获取详情失败，使用列表中的数据作为后备
        console.error("Failed to fetch solution detail:", error);
        setEditingSolution(solution);
      }
    } else {
      setEditingSolution(solution);
    }
    
    setDialogOpen(true);
  };

  const handleNewSolution = () => {
    setEditingSolution(null);
    setEditAssociations(undefined);
    setDialogOpen(true);
  };

  const handleDelete = (solution: Solution) => {
    setDeletingSolution(solution);
    setDeleteDialogOpen(true);
  };


  if (!user && !demoMode) {
    return (
      <div className="p-8 max-w-7xl">
        <PageHeader title={t("plans_title")} description={t("plans_description")} />
        <div className="text-center py-12 text-muted-foreground">
          {t("page_login_required")} {t("page_solutions")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title={t("page_solutions")}
        description={t("page_solutions_desc")}
        action={
          <Button variant="glow" onClick={handleNewSolution}>
            <Plus size={16} />
            {t("page_new_solution")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : solutions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {t("page_no_solutions")}
        </div>
      ) : (
        <div className="space-y-4">
          {solutions.map((solution, index) => (
            <div
              key={solution.id}
              className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10">
                    <GitBranch size={24} className="text-primary" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground font-mono">{solution.name}</h3>
                      {solution.is_public ? (
                        <Globe size={14} className="text-primary" />
                      ) : (
                        <Lock size={14} className="text-muted-foreground" />
                      )}
                      {solution.isLikedByCurrentUser === true && solution.user_id !== user?.id && (
                        <span title="已点赞">
                          <Heart size={14} className="text-rose-500 fill-rose-500" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{solution.description || "-"}</p>
                    
                    {/* Tags and AI Tool */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn("text-xs", AI_TOOL_COLORS[solution.ai_tool] || "bg-muted")}>
                        {solution.ai_tool}
                      </Badge>
                      {solution.tags?.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {solution.isLikedByCurrentUser !== true || solution.user_id === user?.id ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(solution)}>
                    <Settings2 size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(solution)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
                ) : null}
              </div>

              {/* Solution Details */}
              <div className="flex items-center gap-6 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{t("page_agent_label")}:</span>
                  <span className="px-2 py-0.5 rounded bg-surface-2">
                    {solution.agent?.name || "-"}
                  </span>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {solution.downloads || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} />
                    {solution.likes || 0}
                  </span>
                  {solution.rating && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400" />
                      {Number(solution.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                
                <div className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {t("updated")} {new Date(solution.updated_at).toLocaleDateString()}
                </span>
                {solution.isLikedByCurrentUser !== true || solution.user_id === user?.id ? (
                <Button variant="outline" size="sm" onClick={() => handleEdit(solution)}>
                  {t("page_edit")}
                </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <SolutionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        solution={editingSolution}
        onSave={handleSave}
        initialAssociations={editAssociations}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deletingSolution?.name}
        onConfirm={() => deletingSolution && deleteSolution(deletingSolution.id)}
      />
    </div>
  );
}
