import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isDemoMode, getDemoData, setDemoData, generateId } from "./useDemoMode";
import { apiRequest, requireAuth, type ApiResponse } from "@/lib/api";
import { type BaseDto } from "@/lib/types";

export interface SkillResource {
  id?: string;
  relativePath: string;
  fileName: string;
  fileContent: string;
}

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  skillMarkdown: string;
  is_public: boolean;
  tags: string[] | null;
  skillResources?: SkillResource[];
  downloads: number;
  likes: number;
  rating: number | null;
  isLikedByCurrentUser?: boolean;
  created_at: string;
  updated_at: string;
}

interface SkillResourceDto {
  id: string;
  skillId: string;
  relativePath: string;
  fileName: string;
  fileContent: string;
  createdAt: string;
  updatedAt: string;
}

interface SkillDto extends BaseDto {
  skillMarkdown: string;
  skillResources?: SkillResourceDto[];
}

// 详情接口返回的 DTO（不包含 description）
interface SkillDetailDto {
  id: string;
  name: string;
  skillMarkdown: string;
  tags: string[];
  isPublic: boolean;
  downloads: number;
  likes: number;
  rating: number;
  isLikedByCurrentUser: boolean;
  author: Author;
  skillResources: SkillResourceDto[];
  createdAt: string;
  updatedAt: string;
}

const DEMO_KEY = "skills";

// 将后端DTO转换为前端Skill格式
function dtoToSkill(dto: SkillDto): Skill {
  return {
    id: dto.id,
    user_id: dto.author.id,
    name: dto.name,
    skillMarkdown: dto.skillMarkdown,
    is_public: dto.isPublic,
    tags: dto.tags || null,
    skillResources: dto.skillResources?.map(r => ({
      id: r.id,
      relativePath: r.relativePath,
      fileName: r.fileName,
      fileContent: r.fileContent,
    })),
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}

export function useSkills() {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const demoMode = isDemoMode();

  const query = useQuery({
    queryKey: ["skills", demoMode ? "demo" : user?.id || "public"],
    queryFn: async () => {
      if (demoMode) {
        return getDemoData<Skill>(DEMO_KEY);
      }
      
      const authToken = getAuthToken();
      if (!user || !authToken) {
        return [];
      }

      // 同时获取当前用户自己创建的Skills列表和所有公开的Skills列表
      const [mineResult, publicResult] = await Promise.all([
        apiRequest<SkillDto[]>(
          "/api/skills/mine?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
        apiRequest<SkillDto[]>(
          "/api/skills/public?page=1&limit=100",
          { authToken, requireAuth: true }
        ),
      ]);

      const mineSkills = mineResult.data.map(dtoToSkill);
      const publicSkills = publicResult.data.map(dtoToSkill);
      
      // 去重：如果 public 中的配置已经在 mine 中（通过 id 判断），则排除
      const mineIds = new Set(mineSkills.map(s => s.id));
      const uniquePublicSkills = publicSkills.filter(s => !mineIds.has(s.id));

      // 合并两个列表用于向后兼容
      const allSkills = [
        ...mineSkills,
        ...uniquePublicSkills,
      ];

      return allSkills;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (skill: { name: string; skillMarkdown: string; is_public?: boolean; tags?: string[]; skillResources?: SkillResource[] }) => {
      if (demoMode) {
        const now = new Date().toISOString();
        const newSkill: Skill = {
          id: generateId(),
          user_id: "demo-user",
          name: skill.name,
          skillMarkdown: skill.skillMarkdown,
          is_public: skill.is_public || false,
          tags: skill.tags || null,
          skillResources: skill.skillResources,
          downloads: 0,
          likes: 0,
          rating: null,
          created_at: now,
          updated_at: now,
        };
        const data = getDemoData<Skill>(DEMO_KEY);
        setDemoData(DEMO_KEY, [newSkill, ...data]);
        return newSkill;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      const result = await apiRequest<SkillDto>(
        "/api/skills",
        {
          method: "POST",
          authToken,
          requireAuth: true,
          body: {
            name: skill.name,
            skillMarkdown: skill.skillMarkdown,
            tags: skill.tags || [],
            isPublic: skill.is_public !== undefined ? skill.is_public : true,
            skillResources: skill.skillResources?.map(r => ({
              relativePath: r.relativePath,
              fileName: r.fileName,
              fileContent: r.fileContent,
            })) || [],
          },
        }
      );

      return dtoToSkill(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast({ title: "创建成功", description: "Skill已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: error instanceof Error ? error.message : "无法创建Skill", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, skillMarkdown, is_public, tags, skillResources }: Partial<Skill> & { id: string }) => {
      if (demoMode) {
        const data = getDemoData<Skill>(DEMO_KEY);
        const updatedData = data.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...(name !== undefined && { name }),
              ...(skillMarkdown !== undefined && { skillMarkdown }),
              ...(is_public !== undefined && { is_public }),
              ...(tags !== undefined && { tags }),
              ...(skillResources !== undefined && { skillResources }),
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
      if (skillMarkdown !== undefined) updateData.skillMarkdown = skillMarkdown;
      if (is_public !== undefined) updateData.isPublic = is_public;
      if (tags !== undefined) updateData.tags = tags;
      // Always send skillResources if provided (even if empty array to clear resources)
      if (skillResources !== undefined) {
        updateData.skillResources = skillResources.map(r => ({
          relativePath: r.relativePath,
          fileName: r.fileName,
          fileContent: r.fileContent,
        }));
      }

      const result = await apiRequest<SkillDto>(
        `/api/skills/${id}`,
        {
          method: "PUT",
          authToken,
          requireAuth: true,
          body: updateData,
        }
      );

      return dtoToSkill(result.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast({ title: "更新成功", description: "Skill已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: error instanceof Error ? error.message : "无法更新Skill", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        const data = getDemoData<Skill>(DEMO_KEY);
        setDemoData(DEMO_KEY, data.filter(item => item.id !== id));
        return;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      await apiRequest(
        `/api/skills/${id}`,
        {
          method: "DELETE",
          authToken,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      toast({ title: "删除成功", description: "Skill已删除" });
    },
    onError: (error) => {
      toast({ title: "删除失败", description: error instanceof Error ? error.message : "无法删除Skill", variant: "destructive" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) {
        const data = getDemoData<Skill>(DEMO_KEY);
        const updatedData = data.map(item => {
          if (item.id === id) {
            const isLiked = item.isLikedByCurrentUser === true;
            return {
              ...item,
              likes: isLiked ? item.likes - 1 : item.likes + 1,
              isLikedByCurrentUser: !isLiked,
            };
          }
          return item;
        });
        setDemoData(DEMO_KEY, updatedData);
        return;
      }
      
      const authToken = getAuthToken();
      requireAuth(user, authToken);

      await apiRequest(
        `/api/skills/${id}/like`,
        {
          method: "POST",
          authToken,
          requireAuth: true,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
    onError: (error) => {
      toast({ title: "操作失败", description: error instanceof Error ? error.message : "无法执行点赞操作", variant: "destructive" });
    },
  });

  return {
    skills: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    like: likeMutation.mutate,
  };
}

// 根据ID获取Skill详情的独立hook
export function useSkillById(id: string | null) {
  const { getAuthToken } = useAuth();
  const demoMode = isDemoMode();

  return useQuery({
    queryKey: ["skill", id],
    queryFn: async () => {
      if (!id) return null;

      if (demoMode) {
        const data = getDemoData<Skill>(DEMO_KEY);
        return data.find(item => item.id === id) || null;
      }
      
      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("未登录");
      }

      try {
        const result = await apiRequest<SkillDetailDto>(
          `/api/skills/${id}`,
          { authToken, requireAuth: true }
        );
        // 将 SkillDetailDto 转换为 Skill
        return {
          id: result.data.id,
          user_id: result.data.author.id,
          name: result.data.name,
          // Note: Skill 实体没有 description 字段
          skillMarkdown: result.data.skillMarkdown,
          is_public: result.data.isPublic,
          tags: result.data.tags || null,
          skillResources: result.data.skillResources?.map(r => ({
            id: r.id,
            relativePath: r.relativePath,
            fileName: r.fileName,
            fileContent: r.fileContent,
          })),
          downloads: result.data.downloads,
          likes: result.data.likes,
          rating: result.data.rating || null,
          isLikedByCurrentUser: result.data.isLikedByCurrentUser,
          created_at: result.data.createdAt,
          updated_at: result.data.updatedAt,
        };
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
