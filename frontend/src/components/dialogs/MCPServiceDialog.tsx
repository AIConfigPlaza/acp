import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { MCPService } from "@/hooks/useMCPServices";
import { X, Plus } from "lucide-react";
// JSON 类型定义（不依赖 Supabase）
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface MCPServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: MCPService | null;
  onSave: (data: Partial<MCPService>) => void;
}

export function MCPServiceDialog({ open, onOpenChange, service, onSave }: MCPServiceDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [configJson, setConfigJson] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description || "");
      setConfigJson(JSON.stringify(service.config_json, null, 2));
      setIsPublic(service.is_public || false);
      setTags(service.tags || []);
    } else {
      setName("");
      setDescription("");
      setConfigJson("{}");
      setIsPublic(false);
      setTags([]);
    }
    setTagInput("");
  }, [service, open]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedConfig: Json = {};
    try {
      parsedConfig = JSON.parse(configJson);
    } catch {
      parsedConfig = {};
    }
    onSave({
      id: service?.id,
      name,
      description,
      config_json: parsedConfig,
      is_public: isPublic,
      tags,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {service ? t("dialog_edit_mcp") : t("dialog_new_mcp")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("dialog_name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="db-query"
              required
              className="bg-surface-2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("dialog_description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("dialog_brief_desc")}
              className="bg-surface-2"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>{t("dialog_tags")}</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={t("dialog_add_tag")}
                className="bg-surface-2 flex-1"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                <Plus size={16} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X size={12} className="cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">{t("dialog_config_json")}</Label>
            <Textarea
              id="config"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              placeholder='{"endpoint": "http://localhost:8000"}'
              className="bg-surface-2 font-mono min-h-[120px]"
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface-2">
            <div>
              <Label>{t("dialog_public")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("dialog_public_mcp_desc")}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="glow">
              {t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
