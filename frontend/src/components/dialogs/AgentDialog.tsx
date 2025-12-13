import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Agent } from "@/hooks/useAgents";
import { X, Plus } from "lucide-react";

interface AgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
  onSave: (data: Partial<Agent>) => void;
}

export function AgentDialog({ open, onOpenChange, agent, onSave }: AgentDialogProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description || "");
      setContentMd(agent.content_md);
      setIsPublic(agent.is_public || false);
      setTags(agent.tags || []);
    } else {
      setName("");
      setDescription("");
      setContentMd("");
      setIsPublic(false);
      setTags([]);
    }
    setTagInput("");
  }, [agent, open]);

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
    onSave({
      id: agent?.id,
      name,
      description,
      content_md: contentMd,
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
            {agent ? t("dialog_edit_agent") : t("dialog_new_agent")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("dialog_name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Data Analyst"
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
            <Label htmlFor="content">{t("dialog_content_markdown")}</Label>
            <Textarea
              id="content"
              value={contentMd}
              onChange={(e) => setContentMd(e.target.value)}
              placeholder={language === "zh" ? "# Data Analyst\n\n你是一名专业的数据分析师..." : "# Data Analyst\n\nYou are a professional data analyst..."}
              className="bg-surface-2 font-mono min-h-[200px]"
            />
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface-2">
            <div>
              <Label>{t("dialog_public")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("dialog_public_agent_desc")}
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
