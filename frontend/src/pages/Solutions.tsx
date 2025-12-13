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

const AI_TOOL_COLORS: Record<string, string> = {
  "claude-code": "bg-orange-500/20 text-orange-400",
  "copilot": "bg-blue-500/20 text-blue-400",
  "codex": "bg-green-500/20 text-green-400",
  "cursor": "bg-purple-500/20 text-purple-400",
  "aider": "bg-cyan-500/20 text-cyan-400",
};

export default function Solutions() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const demoMode = isDemoMode();
  const { solutions, isLoading, create, update, delete: deleteSolution, getSolutionAssociations } = useSolutions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSolution, setDeletingSolution] = useState<Solution | null>(null);
  const [editAssociations, setEditAssociations] = useState<{
    mcp_service_ids: string[];
    prompt_ids: { id: string; step_order: number }[];
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
    setEditingSolution(solution);
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
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(solution)}>
                    <Settings2 size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(solution)}>
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
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
                <Button variant="outline" size="sm" onClick={() => handleEdit(solution)}>
                  {t("page_edit")}
                </Button>
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
