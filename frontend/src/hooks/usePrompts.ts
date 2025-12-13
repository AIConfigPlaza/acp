import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode, getDemoData, setDemoData, generateId } from "./useDemoMode";
import { apiRequest, requireAuth, type ApiResponse } from "@/lib/api";
import { type BaseDto } from "@/lib/types";

export interface Prompt {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  content_md: string;
  is_public: boolean;
  tags: string[] | null;
  downloads: number;
  likes: number;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

interface PromptDto extends BaseDto {
  content: string;
}

const DEMO_KEY = "prompts";

// 将后端DTO转换为前端Prompt格式
function dtoToPrompt(dto: PromptDto): Prompt {
  return {
    id: dto.id,
    user_id: dto.author.id,
    name: dto.name,
    description: dto.description || null,
    category: "system", // 后端没有category字段，默认为system
    content_md: dto.content, // 后端返回的是content，映射到content_md
    is_public: dto.isPublic,
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}

export function usePrompts() {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();

  const query = useQuery({
    queryKey: ["prompts", demoMode ? "demo" : user?.id || "public"],
    queryFn: async () => {
      if (demoMode) {
        return getDemoData<Prompt>(DEMO_KEY);
      }
      
      const authToken = getAuthToken();
      if (!user || !authToken) {
        return [];
      }

      // 同时获取当前用户自己创建的Prompt列表和所有公开的Prompt列表
      const [mineResult, publicResult] = await Promise.all([
        apiRequest<PromptDto[]>(
          "/api/custom-prompts/mine?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
        apiRequest<PromptDto[]>(
          "/api/custom-prompts/public?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
      ]);

      // 合并两个列表（public接口不包含用户自己创建的，所以不会有重复）
      const allPrompts = [
        ...mineResult.data.map(dtoToPrompt),
        ...publicResult.data.map(dtoToPrompt),
      ];

      return allPrompts;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (prompt: { name: string; description?: string; category?: string; content_md: string; is_public?: boolean; tags?: string[] }) => {
      if (demoMode) {
        const now = new Date().toISOString();
        const newPrompt: Prompt = {
          id: generateId(),
          user_id: "demo-user",
          name: prompt.name,
          description: prompt.description || null,
          category: prompt.category || "system",
          content_md: prompt.content_md,
          is_public: prompt.is_public || false,
          tags: prompt.tags || null,
          downloads: 0,
          likes: 0,
          rating: null,
          created_at: now,
          updated_at: now,
        };
        const data = getDemoData<Prompt>(DEMO_KEY);
        setDemoData(DEMO_KEY, [newPrompt, ...data]);
        return newPrompt;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const result = await apiRequest<PromptDto>(
        "/api/custom-prompts",
        {
          method: "POST",
          authToken,
          requireAuth: true,
          body: {
          name: prompt.name,
            description: prompt.description || "",
            content: prompt.content_md, // 后端使用content字段
          tags: prompt.tags || [],
            isPublic: prompt.is_public !== undefined ? prompt.is_public : true,
          },
        }
      );

      return dtoToPrompt(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast({ title: "创建成功", description: "Prompt已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: error instanceof Error ? error.message : "无法创建Prompt", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Prompt> & { id: string }) => {
      if (demoMode) {
        const data = getDemoData<Prompt>(DEMO_KEY);
        const updatedData = data.map(item => {
          if (item.id === id) {
            return { ...item, ...updates, updated_at: new Date().toISOString() };
          }
          return item;
        });
        setDemoData(DEMO_KEY, updatedData);
        return updatedData.find(item => item.id === id);
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.content_md !== undefined) updateData.content = updates.content_md; // 后端使用content字段
      if (updates.is_public !== undefined) updateData.isPublic = updates.is_public;
      if (updates.tags !== undefined) updateData.tags = updates.tags;

      const result = await apiRequest<PromptDto>(
        `/api/custom-prompts/${id}`,
        {
          method: "PUT",
          authToken,
          requireAuth: true,
          body: updateData,
        }
      );

      return dtoToPrompt(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast({ title: "更新成功", description: "Prompt已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: error instanceof Error ? error.message : "无法更新Prompt", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        const data = getDemoData<Prompt>(DEMO_KEY);
        setDemoData(DEMO_KEY, data.filter(item => item.id !== id));
        return;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      await apiRequest(
        `/api/custom-prompts/${id}`,
        {
          method: "DELETE",
          authToken,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
      toast({ title: "删除成功", description: "Prompt已删除" });
    },
    onError: (error) => {
      toast({ title: "删除失败", description: error instanceof Error ? error.message : "无法删除Prompt", variant: "destructive" });
    },
  });

  return {
    prompts: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
  };
}

// 根据ID获取Prompt详情的独立hook
export function usePromptById(id: string | null) {
  const { getAuthToken } = useAuth();
  const demoMode = isDemoMode();

  return useQuery({
    queryKey: ["prompt", id],
    queryFn: async () => {
      if (!id) return null;

      if (demoMode) {
        const data = getDemoData<Prompt>(DEMO_KEY);
        return data.find(item => item.id === id) || null;
      }
      
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("未登录");
      }

      try {
        const result = await apiRequest<PromptDto>(
          `/api/custom-prompts/${id}`,
          { authToken, requireAuth: true }
        );
        return dtoToPrompt(result.data);
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
