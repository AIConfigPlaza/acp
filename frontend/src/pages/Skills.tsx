import { useState, useEffect } from "react";
import { Sparkles, Plus, Trash2, Edit, Loader2, Globe, Lock, Download, Heart, Star, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSkills, Skill, useSkillById } from "@/hooks/useSkills";
import { SkillDialog } from "@/components/dialogs/SkillDialog";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/hooks/useDemoMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Skills() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const demoMode = isDemoMode();
  const { skills, isLoading, create, update, delete: deleteSkill, like } = useSkills();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  
  // 获取编辑中的 Skill 详情（包含 skillResources）
  const { data: editingSkill, isLoading: isLoadingSkillDetail } = useSkillById(editingSkillId);

  // Filter to show only user's own skills and liked skills
  // mine 接口返回自己创建的和已点赞的（isLikedByCurrentUser === true）
  const mySkills = skills.filter(s => 
    demoMode ? s.user_id === "demo-user" : (s.user_id === user?.id || s.isLikedByCurrentUser === true)
  );

  const handleSave = (data: Partial<Skill>) => {
    if (data.id) {
      update({ 
        id: data.id, 
        name: data.name, 
        // Note: description is not part of the Skill entity, so we don't send it
        skillMarkdown: data.skillMarkdown, 
        is_public: data.is_public, 
        tags: data.tags,
        skillResources: data.skillResources,
      });
    } else {
      create({ 
        name: data.name!, 
        skillMarkdown: data.skillMarkdown || "", 
        is_public: data.is_public, 
        tags: data.tags,
        skillResources: data.skillResources,
      });
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setDialogOpen(true);
  };
  
  // 当对话框关闭时，清空编辑的 skill id
  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingSkillId(null);
    }
  };

  const handleDelete = (skill: Skill) => {
    setDeletingSkill(skill);
    setDeleteDialogOpen(true);
  };

  const handleLike = (skill: Skill, e: React.MouseEvent) => {
    e.stopPropagation();
    like(skill.id);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (!user && !demoMode) {
    return (
      <div className="p-8 max-w-7xl">
        <PageHeader title={t("skills_title")} description={t("skills_description")} />
        <div className="text-center py-12 text-muted-foreground">
          {t("page_login_required")} {t("skills_title")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title={t("skills_title")}
        description={t("skills_description")}
        action={
          <Button variant="glow" onClick={() => { setEditingSkillId(null); setDialogOpen(true); }}>
            <Plus size={16} />
            {t("skills_add")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : mySkills.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {t("page_no_skills")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySkills.map((skill, index) => (
            <div
              key={skill.id}
              className="group p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-muted">
                    <Sparkles size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{skill.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {skill.is_public ? (
                        <Globe size={12} className="text-emerald-400" />
                      ) : (
                        <Lock size={12} className="text-muted-foreground" />
                      )}
                      {skill.isLikedByCurrentUser === true && skill.user_id !== user?.id && (
                        <span title="已点赞">
                          <Heart size={12} className="text-rose-500 fill-rose-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {skill.isLikedByCurrentUser !== true || skill.user_id === user?.id ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(skill)}>
                        <Edit size={14} className="mr-2" />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(skill)} className="text-destructive">
                        <Trash2 size={14} className="mr-2" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              {/* Skill Markdown Preview (first 100 chars) */}
              {skill.skillMarkdown && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
                  {skill.skillMarkdown.substring(0, 100)}{skill.skillMarkdown.length > 100 ? '...' : ''}
                </p>
              )}

              {/* Tags */}
              {skill.tags && skill.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {skill.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                  {skill.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      +{skill.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {formatNumber(skill.downloads)}
                  </span>
                  <button
                    onClick={(e) => handleLike(skill, e)}
                    className={`flex items-center gap-1 transition-colors ${
                      skill.isLikedByCurrentUser ? "text-rose-500" : "hover:text-rose-500"
                    }`}
                  >
                    <Heart size={12} className={skill.isLikedByCurrentUser ? "fill-current" : ""} />
                    {formatNumber(skill.likes)}
                  </button>
                  {skill.rating && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-500 text-yellow-500" />
                      {skill.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <span>{new Date(skill.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <SkillDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        skill={editingSkill || null}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deletingSkill?.name}
        onConfirm={() => deletingSkill && deleteSkill(deletingSkill.id)}
      />
    </div>
  );
}
