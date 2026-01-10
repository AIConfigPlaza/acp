import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode, getDemoData, setDemoData, generateId } from "./useDemoMode";
import { apiRequest, requireAuth, type ApiResponse } from "@/lib/api";
import { type BaseDto } from "@/lib/types";

export interface MCPService {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  config_json: string | object;
  is_public: boolean;
  tags: string[] | null;
  downloads: number;
  likes: number;
  rating: number | null;
  isLikedByCurrentUser?: boolean;
  created_at: string;
  updated_at: string;
}

interface McpConfigDto extends BaseDto {
  configJson: string;
}

const DEMO_KEY = "mcp-services";

// 将后端DTO转换为前端MCPService格式
function dtoToService(dto: McpConfigDto): MCPService {
  let configJson: string | object = {};
  if (typeof dto.configJson === 'string') {
    try {
      configJson = dto.configJson ? JSON.parse(dto.configJson) : {};
    } catch {
      // 如果解析失败，保持为字符串
      configJson = dto.configJson;
    }
  } else {
    configJson = dto.configJson;
  }

  return {
    id: dto.id,
    user_id: dto.author.id,
    name: dto.name,
    description: dto.description || null,
    config_json: configJson,
    is_public: dto.isPublic,
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}

export function useMCPServices() {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();

  const query = useQuery({
    queryKey: ["mcp-services", demoMode ? "demo" : user?.id || "public"],
    queryFn: async () => {
      if (demoMode) {
        return getDemoData<MCPService>(DEMO_KEY);
      }
      
      const authToken = getAuthToken();
      if (!user || !authToken) {
        return [];
      }

      // 同时获取当前用户自己创建的MCP配置列表和所有公开的MCP配置列表
      const [mineResult, publicResult] = await Promise.all([
        apiRequest<McpConfigDto[]>(
          "/api/mcp-configs/mine?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
        apiRequest<McpConfigDto[]>(
          "/api/mcp-configs/public?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
      ]);

      const mineServices = mineResult.data.map(dtoToService);
      const publicServices = publicResult.data.map(dtoToService);
      
      // 去重：如果 public 中的配置已经在 mine 中（通过 id 判断），则排除
      const mineIds = new Set(mineServices.map(s => s.id));
      const uniquePublicServices = publicServices.filter(s => !mineIds.has(s.id));

      // 合并两个列表用于向后兼容
      const allServices = [
        ...mineServices,
        ...uniquePublicServices,
      ];

      return allServices;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (service: { name: string; description?: string; config_json?: string | object; is_public?: boolean; tags?: string[] }) => {
      if (demoMode) {
        const now = new Date().toISOString();
        const newService: MCPService = {
          id: generateId(),
          user_id: "demo-user",
          name: service.name,
          description: service.description || null,
          config_json: service.config_json || {},
          is_public: service.is_public || false,
          tags: service.tags || null,
          downloads: 0,
          likes: 0,
          rating: null,
          created_at: now,
          updated_at: now,
        };
        const data = getDemoData<MCPService>(DEMO_KEY);
        setDemoData(DEMO_KEY, [newService, ...data]);
        return newService;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const configJson = typeof service.config_json === 'string' 
        ? service.config_json 
        : JSON.stringify(service.config_json || {});

      const result = await apiRequest<McpConfigDto>(
        "/api/mcp-configs",
        {
          method: "POST",
          authToken,
          requireAuth: true,
          body: {
          name: service.name,
            description: service.description || "",
            configJson: configJson,
          tags: service.tags || [],
            isPublic: service.is_public !== undefined ? service.is_public : true,
          },
        }
      );

      return dtoToService(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-services"] });
      toast({ title: "创建成功", description: "MCP配置已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: error instanceof Error ? error.message : "无法创建MCP配置", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description, config_json, is_public, tags }: { id: string; name?: string; description?: string; config_json?: string | object; is_public?: boolean; tags?: string[] }) => {
      if (demoMode) {
        const data = getDemoData<MCPService>(DEMO_KEY);
        const updated = data.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description }),
              ...(config_json !== undefined && { config_json }),
              ...(is_public !== undefined && { is_public }),
              ...(tags !== undefined && { tags }),
              updated_at: new Date().toISOString(),
            };
          }
          return item;
        });
        setDemoData(DEMO_KEY, updated);
        return updated.find(item => item.id === id);
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (config_json !== undefined) {
        updateData.configJson = typeof config_json === 'string' 
          ? config_json 
          : JSON.stringify(config_json);
      }
      if (is_public !== undefined) updateData.isPublic = is_public;
      if (tags !== undefined) updateData.tags = tags;
      
      const result = await apiRequest<McpConfigDto>(
        `/api/mcp-configs/${id}`,
        {
          method: "PUT",
          authToken,
          requireAuth: true,
          body: updateData,
        }
      );

      return dtoToService(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-services"] });
      toast({ title: "更新成功", description: "MCP配置已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: error instanceof Error ? error.message : "无法更新MCP配置", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        const data = getDemoData<MCPService>(DEMO_KEY);
        setDemoData(DEMO_KEY, data.filter(item => item.id !== id));
        return;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      await apiRequest(
        `/api/mcp-configs/${id}`,
        {
          method: "DELETE",
          authToken,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-services"] });
      toast({ title: "删除成功", description: "MCP配置已删除" });
    },
    onError: (error) => {
      toast({ title: "删除失败", description: error instanceof Error ? error.message : "无法删除MCP配置", variant: "destructive" });
    },
  });

  return {
    services: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
  };
}

// 根据ID获取MCP配置详情的独立hook
export function useMCPServiceById(id: string | null) {
  const { getAuthToken } = useAuth();
  const demoMode = isDemoMode();

  return useQuery({
    queryKey: ["mcp-service", id],
    queryFn: async () => {
      if (!id) return null;

      if (demoMode) {
        const data = getDemoData<MCPService>(DEMO_KEY);
        return data.find(item => item.id === id) || null;
      }
      
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("未登录");
      }

      try {
        const result = await apiRequest<McpConfigDto>(
          `/api/mcp-configs/${id}`,
          { authToken, requireAuth: true }
        );
        return dtoToService(result.data);
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
