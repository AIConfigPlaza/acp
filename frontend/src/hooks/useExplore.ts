import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL, apiRequest, type ApiResponse } from "@/lib/api";
import { type BaseDto, type ExploreItem } from "@/lib/types";

interface SolutionDto extends BaseDto {
  aiTool: string;
  agentConfigId: string;
}

interface AgentConfigDto extends BaseDto {
  content: string;
  format: string;
}

interface CustomPromptDto extends BaseDto {
  content: string;
}

interface McpConfigDto extends BaseDto {
  configJson: string;
}

interface SkillDto extends BaseDto {
  skillMarkdown: string;
}

// 将后端DTO转换为前端格式
function solutionDtoToItem(dto: SolutionDto): ExploreItem {
  return {
    id: dto.id,
    type: "solutions",
    name: dto.name,
    description: dto.description || null,
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    ai_tool: dto.aiTool || null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
  };
}

function agentDtoToItem(dto: AgentConfigDto): ExploreItem {
  return {
    id: dto.id,
    type: "agents",
    name: dto.name,
    description: dto.description || null,
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    ai_tool: null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
  };
}

function promptDtoToItem(dto: CustomPromptDto): ExploreItem {
  return {
    id: dto.id,
    type: "prompts",
    name: dto.name,
    description: dto.description || null,
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    ai_tool: null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
  };
}

function mcpDtoToItem(dto: McpConfigDto): ExploreItem {
  return {
    id: dto.id,
    type: "mcp",
    name: dto.name,
    description: dto.description || null,
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    ai_tool: null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
  };
}

function skillDtoToItem(dto: SkillDto): ExploreItem {
  return {
    id: dto.id,
    type: "skills",
    name: dto.name,
    description: null, // Skill 实体没有 description 字段，使用 skillMarkdown 的前100个字符作为预览
    tags: dto.tags || null,
    downloads: dto.downloads,
    likes: dto.likes,
    rating: dto.rating || null,
    ai_tool: null,
    isLikedByCurrentUser: dto.isLikedByCurrentUser,
  };
}

export function useExplore() {
  const { getAuthToken } = useAuth();

  const query = useQuery({
    queryKey: ["explore"],
    queryFn: async () => {
      const authToken = getAuthToken();

      // 并行获取所有类型的数据
      const [solutionsResult, agentsResult, promptsResult, mcpsResult, skillsResult] = await Promise.all([
        apiRequest<SolutionDto[]>(`/api/explore/solutions?page=1&limit=100`, { authToken }),
        apiRequest<AgentConfigDto[]>(`/api/explore/agents?page=1&limit=100`, { authToken }),
        apiRequest<CustomPromptDto[]>(`/api/explore/prompts?page=1&limit=100`, { authToken }),
        apiRequest<McpConfigDto[]>(`/api/explore/mcps?page=1&limit=100`, { authToken }),
        apiRequest<SkillDto[]>(`/api/explore/skills?page=1&limit=100`, { authToken }),
      ]);

      const allItems: ExploreItem[] = [];

      if (solutionsResult.data) {
        allItems.push(...solutionsResult.data.map(solutionDtoToItem));
      }
      if (agentsResult.data) {
        allItems.push(...agentsResult.data.map(agentDtoToItem));
      }
      if (promptsResult.data) {
        allItems.push(...promptsResult.data.map(promptDtoToItem));
      }
      if (mcpsResult.data) {
        allItems.push(...mcpsResult.data.map(mcpDtoToItem));
      }
      if (skillsResult.data) {
        allItems.push(...skillsResult.data.map(skillDtoToItem));
      }

      return allItems;
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}


