/**
 * API 响应类型定义
 */

// 全局类型声明
declare global {
  const __VERSION__: string
}

// 通用响应结构
export interface ApiResponse<T> {
  data: T
  meta: {
    page: number
    limit: number
    total: number
  }
  success: boolean
}

// 作者信息
export interface Author {
  id: string
  username: string
  avatarUrl: string
}

// Agent 配置
export interface AgentConfig {
  id: string
  name: string
  description: string
  content: string
  format: string
  tags: string[]
  isPublic: boolean
  isOwner: boolean
  isLiked: boolean
  downloads: number
}

// MCP 配置
export interface McpConfig {
  id: string
  name: string
  description: string
  configJson: string
  tags: string[]
  isPublic: boolean
  isOwner: boolean
  isLiked: boolean
  downloads: number
  likes: number
  rating: number
  author: Author
  createdAt: string
  updatedAt: string
}

// Prompt
export interface Prompt {
  id: string
  name: string
  description: string
  content: string
  tags: string[]
  isPublic: boolean
  isOwner: boolean
  isLiked: boolean
  downloads: number
  likes: number
  rating: number
  author: Author
  createdAt: string
  updatedAt: string
}

// SkillResource
export interface SkillResource {
  id: string
  skillId: string
  relativePath: string
  fileName: string
  fileContent: string
  createdAt: string
  updatedAt: string
}

// Skill
export interface Skill {
  id: string
  name: string
  skillMarkdown: string
  tags: string[]
  isPublic: boolean
  isLiked: boolean
  downloads: number
  likes: number
  rating: number
  author: Author
  skillResources?: SkillResource[]
  createdAt: string
  updatedAt: string
}

// 解决方案
export interface Solution {
  id: string
  name: string
  description: string
  aiTool: string
  agentConfigId: string
  tags: string[]
  isPublic: boolean
  isOwner: boolean
  isLiked: boolean
  downloads: number
  likes: number
  rating: number
  compatibility: {
    minVersion: string
    maxVersion: string
  }
  author: Author
  agentConfig: AgentConfig
  mcpConfigs?: McpConfig[]
  customPrompts?: Prompt[]
  skills?: Skill[]
  createdAt: string
  updatedAt: string
}

// AI IDE 类型
export type AiIdeType = 'vscode' | 'cursor' | 'codex' | 'claude-code'

// 配置输出路径映射
export interface IdePathMapping {
  prompts: string
  agents: string
  mcp: string
  skills: string
}
