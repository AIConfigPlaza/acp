import { useState } from "react";
import { Server, Plus, Trash2, Edit, Loader2, Globe, Lock, Download, Heart, Star, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMCPServices, MCPService } from "@/hooks/useMCPServices";
import { MCPServiceDialog } from "@/components/dialogs/MCPServiceDialog";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/hooks/useDemoMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MCPServices() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const demoMode = isDemoMode();
  const { services, isLoading, create, update, delete: deleteService } = useMCPServices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<MCPService | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<MCPService | null>(null);

  // Filter to show only user's own services and liked services
  // mine 接口返回自己创建的和已点赞的（isLikedByCurrentUser === true）
  const myServices = services.filter(s => 
    demoMode ? s.user_id === "demo-user" : (s.user_id === user?.id || s.isLikedByCurrentUser === true)
  );

  const handleSave = (data: Partial<MCPService>) => {
    if (data.id) {
      update({ id: data.id, name: data.name, description: data.description, config_json: data.config_json, is_public: data.is_public, tags: data.tags });
    } else {
      create({ name: data.name!, description: data.description, config_json: data.config_json, is_public: data.is_public, tags: data.tags });
    }
  };

  const handleEdit = (service: MCPService) => {
    setEditingService(service);
    setDialogOpen(true);
  };

  const handleDelete = (service: MCPService) => {
    setDeletingService(service);
    setDeleteDialogOpen(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  if (!user && !demoMode) {
    return (
      <div className="p-8 max-w-7xl">
        <PageHeader title={t("mcp_title")} description={t("mcp_description")} />
        <div className="text-center py-12 text-muted-foreground">
          {t("page_login_required")} {t("mcp_title")}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title={t("mcp_title")}
        description={t("mcp_description")}
        action={
          <Button variant="glow" onClick={() => { setEditingService(null); setDialogOpen(true); }}>
            <Plus size={16} />
            {t("mcp_add")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : myServices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
          {t("page_no_mcp")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myServices.map((service, index) => (
            <div
              key={service.id}
              className="group p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-muted">
                    <Server size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{service.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {service.is_public ? (
                        <Globe size={12} className="text-emerald-400" />
                      ) : (
                        <Lock size={12} className="text-muted-foreground" />
                      )}
                      {service.isLikedByCurrentUser === true && service.user_id !== user?.id && (
                        <span title="已点赞">
                          <Heart size={12} className="text-rose-500 fill-rose-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {service.isLikedByCurrentUser !== true || service.user_id === user?.id ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(service)}>
                        <Edit size={14} className="mr-2" />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(service)} className="text-destructive">
                        <Trash2 size={14} className="mr-2" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[40px]">
                {service.description || t("page_no_description")}
              </p>

              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {service.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      #{tag}
                    </span>
                  ))}
                  {service.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                      +{service.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-border/30 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Download size={12} />
                    {formatNumber(service.downloads)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} />
                    {formatNumber(service.likes)}
                  </span>
                  {service.rating && (
                    <span className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-500 text-yellow-500" />
                      {service.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <span>{new Date(service.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <MCPServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editingService}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deletingService?.name}
        onConfirm={() => deletingService && deleteService(deletingService.id)}
      />
    </div>
  );
}
