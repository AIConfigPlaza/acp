import { useState } from "react";
import { Bot, Plus, MoreVertical, Trash2, Edit, Loader2, Globe, Lock, Download, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAgents, Agent } from "@/hooks/useAgents";
import { AgentDialog } from "@/components/dialogs/AgentDialog";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { isDemoMode } from "@/hooks/useDemoMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const colors = [
  "from-blue-500/20 to-cyan-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-orange-500/20 to-amber-500/20",
  "from-rose-500/20 to-red-500/20",
  "from-indigo-500/20 to-violet-500/20",
];

export default function Agents() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const demoMode = isDemoMode();
  const { agents, isLoading, create, update, delete: deleteAgent } = useAgents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);

  // Filter to show only user's own agents in dashboard
  const myAgents = agents.filter(a => 
    demoMode ? a.user_id === "demo-user" : a.user_id === user?.id
  );

  const handleSave = (data: Partial<Agent>) => {
    if (data.id) {
      update({ id: data.id, name: data.name, description: data.description, content_md: data.content_md, is_public: data.is_public, tags: data.tags });
    } else {
      create({ name: data.name!, description: data.description, content_md: data.content_md || "", is_public: data.is_public, tags: data.tags });
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setDialogOpen(true);
  };

  const handleDelete = (agent: Agent) => {
    setDeletingAgent(agent);
    setDeleteDialogOpen(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (!user && !demoMode) {
    return (
      <div className="p-8 max-w-7xl">
        <PageHeader title={t("personas_title")} description={t("personas_description")} />
        <div className="text-center py-12 text-muted-foreground">
          {t("page_login_required")} {t("personas_title")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title={t("personas_title")}
        description={t("personas_description")}
        action={
          <Button variant="glow" onClick={() => { setEditingAgent(null); setDialogOpen(true); }}>
            <Plus size={16} />
            {t("personas_new")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : myAgents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {t("page_no_agents")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAgents.map((agent, index) => (
            <div
              key={agent.id}
              className="group p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2.5 rounded-xl bg-gradient-to-br", colors[index % colors.length])}>
                    <Bot size={20} className="text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {agent.is_public ? (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          <Globe size={10} className="mr-1" />
                          {t("page_public")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Lock size={10} className="mr-1" />
                          {t("page_private")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(agent)}>
                      <Edit size={14} className="mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(agent)} className="text-destructive">
                      <Trash2 size={14} className="mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
                {agent.description || t("page_no_description")}
              </p>

              {/* Tags */}
              {agent.tags && agent.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {agent.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                  {agent.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      +{agent.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {formatNumber(agent.downloads)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} />
                    {formatNumber(agent.likes)}
                  </span>
                  {agent.rating && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-500 text-yellow-500" />
                      {agent.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <span>{new Date(agent.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AgentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deletingAgent?.name}
        onConfirm={() => deletingAgent && deleteAgent(deletingAgent.id)}
      />
    </div>
  );
}
