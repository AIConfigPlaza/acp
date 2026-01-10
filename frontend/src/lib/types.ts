/**
 * 共享的类型定义
 */

/**
 * 通用作者信息
 */
export interface Author {
  id: string;
  username: string;
  avatarUrl: string;
}

/**
 * 通用资源项（用于探索页面）
 */
export interface ExploreItem {
  id: string;
  type: "solutions" | "mcp" | "agents" | "prompts" | "skills";
  name: string;
  description: string | null;
  tags: string[] | null;
  downloads: number;
  likes: number;
  rating: number | null;
  ai_tool?: string | null;
  isLikedByCurrentUser?: boolean;
}

/**
 * 通用 DTO 基础字段
 */
export interface BaseDto {
  id: string;
  name: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  downloads: number;
  likes: number;
  rating: number;
  isLikedByCurrentUser: boolean;
  author: Author;
  createdAt: string;
  updatedAt: string;
}

