import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skill, SkillResource } from "@/hooks/useSkills";
import { X, Plus, File, Upload } from "lucide-react";

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: Skill | null;
  onSave: (data: Partial<Skill>) => void;
}

export function SkillDialog({ open, onOpenChange, skill, onSave }: SkillDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [skillMarkdown, setSkillMarkdown] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [skillResources, setSkillResources] = useState<SkillResource[]>([]);

  useEffect(() => {
    if (skill) {
      setName(skill.name);
      setSkillMarkdown(skill.skillMarkdown || "");
      setIsPublic(skill.is_public || false);
      setTags(skill.tags || []);
      setSkillResources(skill.skillResources || []);
    } else {
      setName("");
      setSkillMarkdown("");
      setIsPublic(false);
      setTags([]);
      setSkillResources([]);
    }
    setTagInput("");
  }, [skill, open]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddResource = () => {
    setSkillResources([...skillResources, { relativePath: "", fileName: "", fileContent: "" }]);
  };

  const handleRemoveResource = (index: number) => {
    setSkillResources(skillResources.filter((_, i) => i !== index));
  };

  const handleUpdateResource = (index: number, field: keyof SkillResource, value: string) => {
    const updated = [...skillResources];
    updated[index] = { ...updated[index], [field]: value };
    setSkillResources(updated);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newResources: SkillResource[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // 读取文件内容
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.onerror = () => reject(new Error(`无法读取文件: ${file.name}`));
          reader.readAsText(file);
        });

        // 从文件路径中提取目录和文件名
        // 如果文件有路径信息（webkitRelativePath），使用它
        const webkitPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
        let relativePath = "";
        let fileName = file.name;

        if (webkitPath) {
          // 处理目录上传的情况
          const pathParts = webkitPath.split("/");
          fileName = pathParts[pathParts.length - 1];
          relativePath = pathParts.slice(0, -1).join("/");
        } else {
          // 单文件上传，默认路径为空，用户可以手动配置
          relativePath = "";
        }

        newResources.push({
          relativePath,
          fileName,
          fileContent: content,
        });
      } catch (error) {
        console.error(`读取文件 ${file.name} 失败:`, error);
        // 即使读取失败，也添加文件，但内容为空，用户可以手动输入
        newResources.push({
          relativePath: "",
          fileName: file.name,
          fileContent: "",
        });
      }
    }

    // 添加到现有资源列表
    setSkillResources([...skillResources, ...newResources]);

    // 清空文件输入，以便可以再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDirectoryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newResources: SkillResource[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // 读取文件内容
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.onerror = () => reject(new Error(`无法读取文件: ${file.name}`));
          reader.readAsText(file);
        });

        // 从 webkitRelativePath 中提取路径
        const webkitPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        const pathParts = webkitPath.split("/");
        const fileName = pathParts[pathParts.length - 1];
        // 移除第一个目录（通常是用户选择的根目录名）
        const relativePath = pathParts.slice(1, -1).join("/");

        newResources.push({
          relativePath,
          fileName,
          fileContent: content,
        });
      } catch (error) {
        console.error(`读取文件 ${file.name} 失败:`, error);
        // 即使读取失败，也添加文件，但内容为空
        const webkitPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        const pathParts = webkitPath.split("/");
        const fileName = pathParts[pathParts.length - 1];
        const relativePath = pathParts.slice(1, -1).join("/");
        
        newResources.push({
          relativePath,
          fileName,
          fileContent: "",
        });
      }
    }

    // 添加到现有资源列表
    setSkillResources([...skillResources, ...newResources]);

    // 清空文件输入
    if (directoryInputRef.current) {
      directoryInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadDirectoryClick = () => {
    directoryInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: skill?.id,
      name,
      skillMarkdown,
      is_public: isPublic,
      tags,
      skillResources: skillResources, // Always send array (even if empty)
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {skill ? t("dialog_edit_skill") : t("dialog_new_skill")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="space-y-4" style={{ padding: '4px' }}>
          <div className="space-y-2">
            <Label htmlFor="name">{t("dialog_name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-skill"
              required
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
            <Label htmlFor="skillMarkdown">{t("dialog_skill_content")}</Label>
            <Textarea
              id="skillMarkdown"
              value={skillMarkdown}
              onChange={(e) => setSkillMarkdown(e.target.value)}
              placeholder={t("dialog_skill_content_placeholder")}
              className="bg-surface-2 font-mono min-h-[200px]"
              required
            />
          </div>

          {/* Skill Resources */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>资源文件 (Skill Resources)</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="*/*"
                />
                <input
                  ref={directoryInputRef}
                  type="file"
                  multiple
                  onChange={handleDirectoryUpload}
                  className="hidden"
                  webkitdirectory=""
                  directory=""
                />
                <Button type="button" variant="outline" size="sm" onClick={handleUploadClick}>
                  <Upload size={16} className="mr-1" />
                  上传文件
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleUploadDirectoryClick}>
                  <Upload size={16} className="mr-1" />
                  上传目录
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleAddResource}>
                  <Plus size={16} className="mr-1" />
                  手动添加
                </Button>
              </div>
            </div>
            {skillResources.length > 0 && (
              <div className="border border-border rounded-lg bg-surface-2 custom-scrollbar overflow-y-auto" style={{ minHeight: '200px' }}>
                <div className="p-4 space-y-4">
                  {skillResources.map((resource, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg bg-background space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <File size={16} className="text-muted-foreground" />
                          <span className="text-sm font-medium">资源 {index + 1}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveResource(index)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">相对路径 (Relative Path)</Label>
                          <Input
                            value={resource.relativePath}
                            onChange={(e) => handleUpdateResource(index, "relativePath", e.target.value)}
                            placeholder="例如: src/utils"
                            className="bg-background text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">文件名 (File Name)</Label>
                          <Input
                            value={resource.fileName}
                            onChange={(e) => handleUpdateResource(index, "fileName", e.target.value)}
                            placeholder="例如: helper.ts"
                            className="bg-background text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">文件内容 (File Content)</Label>
                        <Textarea
                          value={resource.fileContent}
                          onChange={(e) => handleUpdateResource(index, "fileContent", e.target.value)}
                          placeholder="文件内容..."
                          className="bg-background font-mono text-sm min-h-[100px]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-surface-2">
            <div>
              <Label>{t("dialog_public")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("dialog_public_skill_desc")}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4 shrink-0">
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
