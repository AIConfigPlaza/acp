import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode, getDemoData, setDemoData, generateId } from "./useDemoMode";
import { apiRequest, requireAuth, type ApiResponse } from "@/lib/api";
import { type BaseDto } from "@/lib/types";

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  content_md: string;
  is_public: boolean;
  tags: string[] | null;
  downloads: number;
  likes: number;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface AgentConfigDto extends BaseDto {
  content: string;
  format: "Markdown" | "Yaml" | "Json";
}

const DEMO_KEY = "agents";

// 将后端DTO转换为前端Agent格式
function dtoToAgent(dto: AgentConfigDto): Agent {
  return {
    id: dto.id,
    user_id: dto.author.id,
    name: dto.name,
    description: dto.description || null,
    content_md: dto.content,
    is_public: dto.isPublic,
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}

export function useAgents() {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();

  const query = useQuery({
    queryKey: ["agents", demoMode ? "demo" : user?.id || "public"],
    queryFn: async () => {
      if (demoMode) {
        return getDemoData<Agent>(DEMO_KEY);
      }
      
      const authToken = getAuthToken();
      if (!user || !authToken) {
        return [];
      }

      // 同时获取当前用户自己创建的Agent配置列表和所有公开的Agent配置列表
      const [mineResult, publicResult] = await Promise.all([
        apiRequest<AgentConfigDto[]>(
          "/api/agent-configs/mine?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
        apiRequest<AgentConfigDto[]>(
          "/api/agent-configs/public?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
      ]);

      // 合并两个列表（public接口不包含用户自己创建的，所以不会有重复）
      const allAgents = [
        ...mineResult.data.map(dtoToAgent),
        ...publicResult.data.map(dtoToAgent),
      ];

      return allAgents;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (agent: { name: string; description?: string; content_md: string; is_public?: boolean; tags?: string[] }) => {
      if (demoMode) {
        const now = new Date().toISOString();
        const newAgent: Agent = {
          id: generateId(),
          user_id: "demo-user",
          name: agent.name,
          description: agent.description || null,
          content_md: agent.content_md,
          is_public: agent.is_public || false,
          tags: agent.tags || null,
          downloads: 0,
          likes: 0,
          rating: null,
          created_at: now,
          updated_at: now,
        };
        const data = getDemoData<Agent>(DEMO_KEY);
        setDemoData(DEMO_KEY, [newAgent, ...data]);
        return newAgent;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const result = await apiRequest<AgentConfigDto>(
        "/api/agent-configs",
        {
          method: "POST",
          authToken,
          requireAuth: true,
          body: {
            name: agent.name,
            description: agent.description || "",
            content: agent.content_md,
            format: "Markdown", // 默认使用Markdown格式
            tags: agent.tags || [],
            isPublic: agent.is_public !== undefined ? agent.is_public : true,
          },
        }
      );

      return dtoToAgent(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "创建成功", description: "Agent配置已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: error instanceof Error ? error.message : "无法创建Agent配置", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description, content_md, is_public, tags }: Partial<Agent> & { id: string }) => {
      if (demoMode) {
        const data = getDemoData<Agent>(DEMO_KEY);
        const updatedData = data.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description }),
              ...(content_md !== undefined && { content_md }),
              ...(is_public !== undefined && { is_public }),
              ...(tags !== undefined && { tags }),
              updated_at: new Date().toISOString(),
            };
          }
          return item;
        });
        setDemoData(DEMO_KEY, updatedData);
        return updatedData.find(item => item.id === id);
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (content_md !== undefined) updateData.content = content_md;
      if (is_public !== undefined) updateData.isPublic = is_public;
      if (tags !== undefined) updateData.tags = tags;

      const result = await apiRequest<AgentConfigDto>(
        `/api/agent-configs/${id}`,
        {
          method: "PUT",
          authToken,
          requireAuth: true,
          body: updateData,
        }
      );

      return dtoToAgent(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "更新成功", description: "Agent配置已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: error instanceof Error ? error.message : "无法更新Agent配置", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        const data = getDemoData<Agent>(DEMO_KEY);
        setDemoData(DEMO_KEY, data.filter(item => item.id !== id));
        return;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      await apiRequest(
        `/api/agent-configs/${id}`,
        {
          method: "DELETE",
          authToken,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "删除成功", description: "Agent配置已删除" });
    },
    onError: (error) => {
      toast({ title: "删除失败", description: error instanceof Error ? error.message : "无法删除Agent配置", variant: "destructive" });
    },
  });

  return {
    agents: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
  };
}

// 根据ID获取Agent配置详情的独立hook
export function useAgentById(id: string | null) {
  const { getAuthToken } = useAuth();
  const demoMode = isDemoMode();

  return useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      if (!id) return null;

      if (demoMode) {
        const data = getDemoData<Agent>(DEMO_KEY);
        return data.find(item => item.id === id) || null;
      }
      
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("未登录");
      }

      try {
        const result = await apiRequest<AgentConfigDto>(
          `/api/agent-configs/${id}`,
          { authToken, requireAuth: true }
        );
        return dtoToAgent(result.data);
      } catch (error) {
        if (error instanceof Error && (error as Error & { status?: number }).status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!id && !demoMode,
  });
}
