import { useState } from "react";
import { FileText, Plus, Search, Trash2, Edit, Loader2, Globe, Lock, Download, Heart, Star, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePrompts, Prompt } from "@/hooks/usePrompts";
import { PromptDialog } from "@/components/dialogs/PromptDialog";
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

const categoryColors = {
  system: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  user: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  tool: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default function Prompts() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const demoMode = isDemoMode();
  const { prompts, isLoading, create, update, delete: deletePrompt } = usePrompts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter to show only user's own prompts and liked prompts
  // mine 接口返回自己创建的和已点赞的（isLikedByCurrentUser === true）
  const myPrompts = prompts.filter(p => 
    demoMode ? p.user_id === "demo-user" : (p.user_id === user?.id || p.isLikedByCurrentUser === true)
  );

  const filteredPrompts = myPrompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryLabels = {
    system: t("prompts_system"),
    user: t("prompts_user"),
    tool: t("prompts_tool"),
  };

  const handleSave = (data: Partial<Prompt>) => {
    if (data.id) {
      update({ id: data.id, name: data.name, description: data.description, category: data.category, content_md: data.content_md, is_public: data.is_public, tags: data.tags });
    } else {
      create({ name: data.name!, description: data.description, category: data.category, content_md: data.content_md || "", is_public: data.is_public, tags: data.tags });
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setDialogOpen(true);
  };

  const handleDelete = (prompt: Prompt) => {
    setDeletingPrompt(prompt);
    setDeleteDialogOpen(true);
  };

  const countVariables = (content: string) => {
    const matches = content.match(/\{\{[^}]+\}\}/g);
    return matches ? matches.length : 0;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (!user && !demoMode) {
    return (
      <div className="p-8 max-w-7xl">
        <PageHeader title={t("prompts_title")} description={t("prompts_description")} />
        <div className="text-center py-12 text-muted-foreground">
          {t("page_login_required")} {t("prompts_title")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title={t("prompts_title")}
        description={t("prompts_description")}
        action={
          <Button variant="glow" onClick={() => { setEditingPrompt(null); setDialogOpen(true); }}>
            <Plus size={16} />
            {t("prompts_new")}
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("prompts_search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface-2"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {searchQuery 
            ? t("page_no_prompts_search")
            : t("page_no_prompts")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt, index) => (
            <div
              key={prompt.id}
              className="group p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    prompt.category === "system" ? "bg-blue-500/10" :
                    prompt.category === "user" ? "bg-emerald-500/10" : "bg-amber-500/10"
                  )}>
                    <FileText size={20} className={
                      prompt.category === "system" ? "text-blue-400" :
                      prompt.category === "user" ? "text-emerald-400" : "text-amber-400"
                    } />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{prompt.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={cn("text-xs", categoryColors[prompt.category as keyof typeof categoryColors])}>
                        {categoryLabels[prompt.category as keyof typeof categoryLabels]}
                      </Badge>
                      {prompt.is_public ? (
                        <Globe size={12} className="text-emerald-400" />
                      ) : (
                        <Lock size={12} className="text-muted-foreground" />
                      )}
                      {prompt.isLikedByCurrentUser === true && prompt.user_id !== user?.id && (
                        <span title="已点赞">
                          <Heart size={12} className="text-rose-500 fill-rose-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {prompt.isLikedByCurrentUser !== true || prompt.user_id === user?.id ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(prompt)}>
                      <Edit size={14} className="mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(prompt)} className="text-destructive">
                      <Trash2 size={14} className="mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                ) : null}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
                {prompt.description || t("page_no_description")}
              </p>

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {prompt.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      +{prompt.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Variables count */}
              {countVariables(prompt.content_md) > 0 && (
                <div className="mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {countVariables(prompt.content_md)} {t("prompts_variables")}
                  </Badge>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {formatNumber(prompt.downloads)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} />
                    {formatNumber(prompt.likes)}
                  </span>
                  {prompt.rating && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-500 text-yellow-500" />
                      {prompt.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <PromptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        prompt={editingPrompt}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deletingPrompt?.name}
        onConfirm={() => deletingPrompt && deletePrompt(deletingPrompt.id)}
      />
    </div>
  );
}
