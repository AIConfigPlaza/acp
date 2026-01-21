import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode, getDemoData, setDemoData, generateId } from "./useDemoMode";
import { apiRequest, requireAuth, type ApiResponse } from "@/lib/api";
import { type BaseDto } from "@/lib/types";

export interface Solution {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  agent_id: string | null;
  config_json: Record<string, unknown>;
  status: string;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  downloads: number;
  likes: number;
  rating: number | null;
  isLikedByCurrentUser?: boolean;
  tags: string[];
  ai_tool: string;
  compatibility: Record<string, unknown>;
  agent?: { name: string } | null;
  mcp_services?: { id: string; name: string }[];
  prompts?: { id: string; name: string; step_order: number }[];
  skills?: { id: string; name: string }[];
}

export interface SolutionMCPService {
  solution_id: string;
  mcp_service_id: string;
}

export interface SolutionPrompt {
  solution_id: string;
  prompt_id: string;
  step_order: number;
}

interface SolutionDto extends BaseDto {
  aiTool: string;
  agentConfigId: string;
  compatibility: Record<string, unknown>;
  agentConfig?: {
    id: string;
    name: string;
    description: string;
  } | null;
}

interface SolutionDetailDto extends SolutionDto {
  mcpConfigs: Array<{ id: string; name: string }>;
  customPrompts: Array<{ id: string; name: string }>;
  skills: Array<{ id: string; name: string }>;
}

const DEMO_KEY = "solutions";
const DEMO_SOLUTION_MCP_KEY = "solution_mcp_services";
const DEMO_SOLUTION_PROMPTS_KEY = "solution_prompts";

// 将后端 AiTool 枚举值转换为前端格式
function aiToolToFrontend(aiTool: string): string {
  // 后端可能返回: ClaudeCode (PascalCase) 或 claudeCode (camelCase)
  // 前端: claude-code, copilot, codex, cursor, aider, custom
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
  return mapping[aiTool] || aiTool.toLowerCase();
}

// 将前端 ai_tool 转换为后端格式
function aiToolToBackend(aiTool: string): string {
  const mapping: Record<string, string> = {
    "claude-code": "ClaudeCode",
    "copilot": "Copilot",
    "codex": "Codex",
    "cursor": "Cursor",
    "aider": "Aider",
    "custom": "Custom",
  };
  return mapping[aiTool] || "ClaudeCode";
}

// 将后端DTO转换为前端Solution格式
function dtoToSolution(dto: SolutionDto | SolutionDetailDto): Solution {
  const base = {
    id: dto.id,
    user_id: dto.author.id,
    name: dto.name,
    description: dto.description || null,
    agent_id: dto.agentConfigId || null,
    config_json: {},
    status: "active", // 后端没有status字段，默认为active
    last_run_at: null,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
    is_public: dto.isPublic,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
    tags: dto.tags || [],
    ai_tool: aiToolToFrontend(dto.aiTool),
    compatibility: dto.compatibility || {},
    agent: dto.agentConfig ? { name: dto.agentConfig.name } : null,
  };

  // 如果是详情DTO，包含关联数据
  if ('mcpConfigs' in dto) {
    return {
      ...base,
      mcp_services: dto.mcpConfigs?.map(m => ({ id: m.id, name: m.name })) || [],
      prompts: dto.customPrompts?.map((p, index) => ({ id: p.id, name: p.name, step_order: index })) || [],
      skills: dto.skills?.map(s => ({ id: s.id, name: s.name })) || [],
    };
  }

  return base;
}

export function useSolutions() {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();

  const query = useQuery({
    queryKey: ["solutions", demoMode ? "demo" : user?.id || "public"],
    queryFn: async () => {
      if (demoMode) {
        return getDemoData<Solution>(DEMO_KEY);
      }

      const authToken = getAuthToken();
      if (!user || !authToken) {
        return [];
      }

      // 获取当前用户自己创建的解决方案列表
      const result = await apiRequest<SolutionDto[]>(
        "/api/solutions/mine?page=1&limit=100",
        { authToken, requireAuth: true }
      );

      return result.data.map(dtoToSolution);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (solution: {
      name: string;
      description?: string;
      agent_id?: string | null;
      status?: string;
      is_public?: boolean;
      tags?: string[];
      ai_tool?: string;
      mcp_service_ids?: string[];
      prompt_ids?: { id: string; step_order: number }[];
      skill_ids?: string[];
    }) => {
      if (demoMode) {
        const now = new Date().toISOString();
        const newSolution: Solution = {
          id: generateId(),
          user_id: "demo-user",
          name: solution.name,
          description: solution.description || null,
          agent_id: solution.agent_id || null,
          config_json: {},
          status: solution.status || "active",
          last_run_at: null,
          created_at: now,
          updated_at: now,
          is_public: solution.is_public || false,
          downloads: 0,
          likes: 0,
          rating: null,
          tags: solution.tags || [],
          ai_tool: solution.ai_tool || "claude-code",
          compatibility: {},
          agent: null,
        };
        const data = getDemoData<Solution>(DEMO_KEY);
        setDemoData(DEMO_KEY, [newSolution, ...data]);
        
        // Save MCP associations
        if (solution.mcp_service_ids?.length) {
          const mcpData = getDemoData<SolutionMCPService>(DEMO_SOLUTION_MCP_KEY);
          const newAssocs = solution.mcp_service_ids.map(id => ({
            solution_id: newSolution.id,
            mcp_service_id: id,
          }));
          setDemoData(DEMO_SOLUTION_MCP_KEY, [...mcpData, ...newAssocs]);
        }
        
        // Save Prompt associations
        if (solution.prompt_ids?.length) {
          const promptData = getDemoData<SolutionPrompt>(DEMO_SOLUTION_PROMPTS_KEY);
          const newAssocs = solution.prompt_ids.map(p => ({
            solution_id: newSolution.id,
            prompt_id: p.id,
            step_order: p.step_order,
          }));
          setDemoData(DEMO_SOLUTION_PROMPTS_KEY, [...promptData, ...newAssocs]);
        }
        
        return newSolution;
      }

      const authToken = getAuthToken();
      requireAuth(user, authToken);

      if (!solution.agent_id) {
        throw new Error("Agent配置是必需的");
      }

      const result = await apiRequest<SolutionDetailDto>(
        "/api/solutions",
        {
          method: "POST",
          authToken,
          requireAuth: true,
          body: {
            name: solution.name,
            description: solution.description || "",
            aiTool: aiToolToBackend(solution.ai_tool || "claude-code"),
            agentConfigId: solution.agent_id,
            mcpConfigIds: (solution.mcp_service_ids || []).filter(id => id && id.trim() !== ""),
            customPromptIds: (solution.prompt_ids?.map(p => p.id) || []).filter(id => id && id.trim() !== ""),
            skillIds: (solution.skill_ids || []).filter(id => id && id.trim() !== ""),
            tags: solution.tags || [],
            isPublic: solution.is_public !== undefined ? solution.is_public : true,
          },
        }
      );

      return dtoToSolution(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
      toast({ title: "创建成功", description: "解决方案已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: error instanceof Error ? error.message : "无法创建解决方案", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      agent_id,
      status,
      is_public,
      tags,
      ai_tool,
      mcp_service_ids,
      prompt_ids,
      skill_ids,
    }: {
      id: string;
      name?: string;
      description?: string;
      agent_id?: string | null;
      status?: string;
      is_public?: boolean;
      tags?: string[];
      ai_tool?: string;
      mcp_service_ids?: string[];
      prompt_ids?: { id: string; step_order: number }[];
      skill_ids?: string[];
    }) => {
      if (demoMode) {
        const data = getDemoData<Solution>(DEMO_KEY);
        const updated = data.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description }),
              ...(agent_id !== undefined && { agent_id }),
              ...(status !== undefined && { status }),
              ...(is_public !== undefined && { is_public }),
              ...(tags !== undefined && { tags }),
              ...(ai_tool !== undefined && { ai_tool }),
              updated_at: new Date().toISOString(),
            };
          }
          return item;
        });
        setDemoData(DEMO_KEY, updated);
        
        // Update MCP associations
        if (mcp_service_ids !== undefined) {
          const mcpData = getDemoData<SolutionMCPService>(DEMO_SOLUTION_MCP_KEY);
          const filtered = mcpData.filter(a => a.solution_id !== id);
          const newAssocs = mcp_service_ids.map(mcpId => ({
            solution_id: id,
            mcp_service_id: mcpId,
          }));
          setDemoData(DEMO_SOLUTION_MCP_KEY, [...filtered, ...newAssocs]);
        }
        
        // Update Prompt associations
        if (prompt_ids !== undefined) {
          const promptData = getDemoData<SolutionPrompt>(DEMO_SOLUTION_PROMPTS_KEY);
          const filtered = promptData.filter(a => a.solution_id !== id);
          const newAssocs = prompt_ids.map(p => ({
            solution_id: id,
            prompt_id: p.id,
            step_order: p.step_order,
          }));
          setDemoData(DEMO_SOLUTION_PROMPTS_KEY, [...filtered, ...newAssocs]);
        }
        
        return updated.find(item => item.id === id);
      }

      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (ai_tool !== undefined) updateData.aiTool = aiToolToBackend(ai_tool);
      if (agent_id !== undefined) updateData.agentConfigId = agent_id;
      if (is_public !== undefined) updateData.isPublic = is_public;
      if (tags !== undefined) updateData.tags = tags;
      if (mcp_service_ids !== undefined) updateData.mcpConfigIds = mcp_service_ids.filter(id => id && id.trim() !== "");
      if (prompt_ids !== undefined) updateData.customPromptIds = prompt_ids.map(p => p.id).filter(id => id && id.trim() !== "");
      if (skill_ids !== undefined) updateData.skillIds = skill_ids.filter(id => id && id.trim() !== "");

      const result = await apiRequest<SolutionDetailDto>(
        `/api/solutions/${id}`,
        {
        method: "PUT",
          authToken,
          requireAuth: true,
          body: updateData,
        }
      );

      return dtoToSolution(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
      toast({ title: "更新成功", description: "解决方案已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: error instanceof Error ? error.message : "无法更新解决方案", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        const data = getDemoData<Solution>(DEMO_KEY);
        setDemoData(DEMO_KEY, data.filter(item => item.id !== id));
        
        // Clean up associations
        const mcpData = getDemoData<SolutionMCPService>(DEMO_SOLUTION_MCP_KEY);
        setDemoData(DEMO_SOLUTION_MCP_KEY, mcpData.filter(a => a.solution_id !== id));
        const promptData = getDemoData<SolutionPrompt>(DEMO_SOLUTION_PROMPTS_KEY);
        setDemoData(DEMO_SOLUTION_PROMPTS_KEY, promptData.filter(a => a.solution_id !== id));
        return;
      }

      const authToken = getAuthToken();
      requireAuth(user, authToken);

      await apiRequest(
        `/api/solutions/${id}`,
        {
        method: "DELETE",
          authToken,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solutions"] });
      toast({ title: "删除成功", description: "解决方案已删除" });
    },
    onError: (error) => {
      toast({ title: "删除失败", description: error instanceof Error ? error.message : "无法删除解决方案", variant: "destructive" });
    },
  });

  // Fetch solution associations - 从详情接口获取
  const getSolutionAssociations = async (solutionId: string) => {
    if (demoMode) {
      const mcpData = getDemoData<SolutionMCPService>(DEMO_SOLUTION_MCP_KEY);
      const promptData = getDemoData<SolutionPrompt>(DEMO_SOLUTION_PROMPTS_KEY);
      return {
        mcp_service_ids: mcpData.filter(a => a.solution_id === solutionId).map(a => a.mcp_service_id),
        prompt_ids: promptData
          .filter(a => a.solution_id === solutionId)
          .map(a => ({ id: a.prompt_id, step_order: a.step_order })),
        skill_ids: [],
      };
    }

    const authToken = getAuthToken();
    requireAuth(user, authToken);

    try {
      const result = await apiRequest<SolutionDetailDto>(
        `/api/solutions/${solutionId}`,
        { authToken, requireAuth: true }
      );

    const detail = result.data;
    return {
      mcp_service_ids: detail.mcpConfigs?.map(m => m.id) || [],
      prompt_ids: detail.customPrompts?.map((p, index) => ({ id: p.id, step_order: index })) || [],
      skill_ids: detail.skills?.map(s => s.id) || [],
    };
    } catch (error) {
      if (error instanceof Error && (error as Error & { status?: number }).status === 404) {
        return { mcp_service_ids: [], prompt_ids: [], skill_ids: [] };
      }
      throw error;
    }
  };

  return {
    solutions: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    getSolutionAssociations,
  };
}
