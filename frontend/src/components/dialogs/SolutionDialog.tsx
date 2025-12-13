import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Solution } from "@/hooks/useSolutions";
import { useAgents } from "@/hooks/useAgents";
import { useMCPServices } from "@/hooks/useMCPServices";
import { usePrompts } from "@/hooks/usePrompts";
import { X, Plus, Search, Globe, Lock } from "lucide-react";

interface SolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solution?: Solution | null;
  onSave: (data: Partial<Solution> & {
    mcp_service_ids?: string[];
    prompt_ids?: { id: string; step_order: number }[];
  }) => void;
  initialAssociations?: {
    mcp_service_ids: string[];
    prompt_ids: { id: string; step_order: number }[];
  };
}

const AI_TOOLS = [
  { value: "claude-code", label: "Claude Code" },
  { value: "copilot", label: "GitHub Copilot" },
  { value: "codex", label: "OpenAI Codex" },
  { value: "cursor", label: "Cursor" },
  { value: "aider", label: "Aider" },
];

export function SolutionDialog({ open, onOpenChange, solution, onSave, initialAssociations }: SolutionDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { agents } = useAgents();
  const { services: mcpServices } = useMCPServices();
  const { prompts } = usePrompts();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [agentId, setAgentId] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [aiTool, setAiTool] = useState("claude-code");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedMCPs, setSelectedMCPs] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<{ id: string; step_order: number }[]>([]);
  const [mcpSearch, setMcpSearch] = useState("");
  const [promptSearch, setPromptSearch] = useState("");

  useEffect(() => {
    if (solution) {
      setName(solution.name);
      setDescription(solution.description || "");
      setAgentId(solution.agent_id || "");
      setIsPublic(solution.is_public || false);
      setAiTool(solution.ai_tool || "claude-code");
      setTags(solution.tags || []);
    } else {
      setName("");
      setDescription("");
      setAgentId("");
      setIsPublic(false);
      setAiTool("claude-code");
      setTags([]);
    }
    
    if (initialAssociations) {
      setSelectedMCPs(initialAssociations.mcp_service_ids);
      setSelectedPrompts(initialAssociations.prompt_ids);
    } else {
      setSelectedMCPs([]);
      setSelectedPrompts([]);
    }
    setMcpSearch("");
    setPromptSearch("");
  }, [solution, open, initialAssociations]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleToggleMCP = (id: string) => {
    setSelectedMCPs(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleTogglePrompt = (id: string) => {
    setSelectedPrompts(prev => {
      if (prev.find(p => p.id === id)) {
        return prev.filter(p => p.id !== id);
      }
      return [...prev, { id, step_order: prev.length }];
    });
  };

  // Filter and group MCP services
  const { myMCPs, publicMCPs } = useMemo(() => {
    const filtered = mcpServices.filter(s => 
      s.name.toLowerCase().includes(mcpSearch.toLowerCase()) ||
      s.description?.toLowerCase().includes(mcpSearch.toLowerCase())
    );
    // 我的：user_id 等于当前用户 ID（来自 /mine 接口）
    // 公开的：user_id 不等于当前用户 ID（来自 /public 接口）
    return {
      myMCPs: filtered.filter(s => user && s.user_id === user.id),
      publicMCPs: filtered.filter(s => !user || s.user_id !== user.id),
    };
  }, [mcpServices, mcpSearch, user]);

  // Filter and group Prompts
  const { myPrompts, publicPrompts } = useMemo(() => {
    const filtered = prompts.filter(p => 
      p.name.toLowerCase().includes(promptSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(promptSearch.toLowerCase())
    );
    // 我的：user_id 等于当前用户 ID（来自 /mine 接口）
    // 公开的：user_id 不等于当前用户 ID（来自 /public 接口）
    return {
      myPrompts: filtered.filter(p => user && p.user_id === user.id),
      publicPrompts: filtered.filter(p => !user || p.user_id !== user.id),
    };
  }, [prompts, promptSearch, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: solution?.id,
      name,
      description,
      agent_id: agentId || null,
      is_public: isPublic,
      ai_tool: aiTool,
      tags,
      mcp_service_ids: selectedMCPs,
      prompt_ids: selectedPrompts,
    });
    onOpenChange(false);
  };

  const renderMCPItem = (service: typeof mcpServices[0]) => {
    const isSelected = selectedMCPs.includes(service.id);
    return (
      <div 
        key={service.id} 
        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-3'
        }`}
        onClick={() => handleToggleMCP(service.id)}
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/50'
        }`}>
          {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{service.name}</span>
            {service.is_public && <Globe size={12} className="text-muted-foreground shrink-0" />}
          </div>
          {/* {service.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{service.description}</p>
          )} */}
        </div>
      </div>
    );
  };

  const renderPromptItem = (prompt: typeof prompts[0]) => {
    const selected = selectedPrompts.find(p => p.id === prompt.id);
    return (
      <div 
        key={prompt.id} 
        className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
          selected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-surface-3'
        }`}
        onClick={() => handleTogglePrompt(prompt.id)}
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
          selected ? 'bg-primary border-primary' : 'border-muted-foreground/50'
        }`}>
          {selected && <span className="text-primary-foreground text-xs">✓</span>}
        </div>
        {selected && (
          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded shrink-0 mt-0.5">
            #{selected.step_order + 1}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{prompt.name}</span>
            {prompt.is_public && <Globe size={12} className="text-muted-foreground shrink-0" />}
          </div>
          {/* {prompt.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{prompt.description}</p>
          )} */}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {solution ? t("dialog_edit_solution") : t("dialog_new_solution")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6" style={{ padding: '4px' }}>
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("dialog_name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="my-ai-solution"
                  required
                  className="bg-surface-2 font-mono"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("dialog_target_ai_tool")}</Label>
                  <Select value={aiTool} onValueChange={setAiTool}>
                    <SelectTrigger className="bg-surface-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_TOOLS.map(tool => (
                        <SelectItem key={tool.value} value={tool.value}>{tool.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              {/* Public Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-2">
                <div>
                  <Label>{t("dialog_public")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("dialog_public_solution_desc")}
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </div>

            {/* Agent Selection */}
            <div className="space-y-2">
              <Label>{t("page_agent_label")}</Label>
              <Select value={agentId || "__none__"} onValueChange={(v) => setAgentId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="bg-surface-2">
                  <SelectValue placeholder={t("dialog_select_agent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("dialog_none")}</SelectItem>
                  {agents.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        {p.name}
                        {p.is_public && <Globe size={12} className="text-muted-foreground" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MCP Services Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("dialog_mcp_services")}</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedMCPs.length} {t("dialog_selected")}
                </span>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={mcpSearch}
                  onChange={(e) => setMcpSearch(e.target.value)}
                  placeholder={t("dialog_search_mcp")}
                  className="bg-surface-2 pl-9"
                />
              </div>
              <div className="border border-border rounded-lg bg-surface-2 flex flex-col overflow-hidden w-full">
                <Tabs defaultValue="my" className="w-full flex flex-col min-w-0">
                  <div className="w-full overflow-hidden min-w-0">
                    <TabsList className="w-full grid grid-cols-[1fr_1fr] h-9 p-0 rounded-t-lg rounded-b-none bg-muted/50 border-b border-border shrink-0 relative z-10">
                      <TabsTrigger value="my" className="text-xs rounded-none rounded-tl-lg w-full min-w-0 max-w-full overflow-hidden h-full flex items-center justify-start px-3 whitespace-normal">
                        <Lock size={12} className="mr-1 shrink-0" />
                        <span className="truncate min-w-0 flex-1">{t("dialog_my")} ({myMCPs.length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="public" className="text-xs rounded-none rounded-tr-lg w-full min-w-0 max-w-full overflow-hidden h-full flex items-center justify-start px-3 whitespace-normal">
                        <Globe size={12} className="mr-1 shrink-0" />
                        <span className="truncate min-w-0 flex-1">{t("dialog_public_label")} ({publicMCPs.length})</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="overflow-hidden max-h-40">
                    <TabsContent value="my" className="p-2 overflow-y-auto mt-0 max-h-40">
                      {myMCPs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("dialog_no_private_mcp")}
                        </p>
                      ) : (
                        <div className="space-y-1">{myMCPs.map(renderMCPItem)}</div>
                      )}
                    </TabsContent>
                    <TabsContent value="public" className="p-2 overflow-y-auto mt-0 max-h-40">
                      {publicMCPs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("dialog_no_public_mcp")}
                        </p>
                      ) : (
                        <div className="space-y-1">{publicMCPs.map(renderMCPItem)}</div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>

            {/* Prompts Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("dialog_prompts_ordered")}</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedPrompts.length} {t("dialog_selected")}
                </span>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={promptSearch}
                  onChange={(e) => setPromptSearch(e.target.value)}
                  placeholder={t("dialog_search_prompts")}
                  className="bg-surface-2 pl-9"
                />
              </div>
              <div className="border border-border rounded-lg bg-surface-2 flex flex-col overflow-hidden w-full">
                <Tabs defaultValue="my" className="w-full flex flex-col min-w-0">
                  <div className="w-full overflow-hidden min-w-0">
                    <TabsList className="w-full grid grid-cols-[1fr_1fr] h-9 p-0 rounded-t-lg rounded-b-none bg-muted/50 border-b border-border shrink-0 relative z-10">
                      <TabsTrigger value="my" className="text-xs rounded-none rounded-tl-lg w-full min-w-0 max-w-full overflow-hidden h-full flex items-center justify-start px-3 whitespace-normal">
                        <Lock size={12} className="mr-1 shrink-0" />
                        <span className="truncate min-w-0 flex-1">{t("dialog_my")} ({myPrompts.length})</span>
                      </TabsTrigger>
                      <TabsTrigger value="public" className="text-xs rounded-none rounded-tr-lg w-full min-w-0 max-w-full overflow-hidden h-full flex items-center justify-start px-3 whitespace-normal">
                        <Globe size={12} className="mr-1 shrink-0" />
                        <span className="truncate min-w-0 flex-1">{t("dialog_public_label")} ({publicPrompts.length})</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <div className="overflow-hidden max-h-40">
                    <TabsContent value="my" className="p-2 overflow-y-auto mt-0 max-h-40">
                      {myPrompts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("dialog_no_private_prompts")}
                        </p>
                      ) : (
                        <div className="space-y-1">{myPrompts.map(renderPromptItem)}</div>
                      )}
                    </TabsContent>
                    <TabsContent value="public" className="p-2 overflow-y-auto mt-0 max-h-40">
                      {publicPrompts.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t("dialog_no_public_prompts")}
                        </p>
                      ) : (
                        <div className="space-y-1">{publicPrompts.map(renderPromptItem)}</div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="glow">
                {t("save")}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
