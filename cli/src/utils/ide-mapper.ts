import { homedir } from 'os'
import type { AiIdeType, IdePathMapping } from '../types/index.js'

// 重新导出类型
export type { AiIdeType, IdePathMapping }

/**
 * AI IDE 路径映射配置
 * 定义不同 IDE 的配置文件输出路径
 */

export const IDE_PATH_MAPPINGS: Record<AiIdeType, IdePathMapping> = {
  vscode: {
    prompts: '.github/prompts',
    agents: 'AGENTS.md',
    mcp: '.vscode/mcp.json',
    skills: '.github/skills'
  },
  cursor: {
    prompts: '.cursor/commands',
    agents: 'AGENTS.md',
    mcp: '.cursor/mcp.json',
    skills: '.cursor/skills'
  },
  codex: {
    prompts: '~/.codex/prompts',
    agents: 'AGENTS.md',
    mcp: '.codex/config.toml',
    skills: '.codex/skills'
  },
  'claude-code': {
    prompts: '.claude/commands',
    agents: 'AGENTS.md',
    mcp: '.mcp.json',
    skills: '.claude/skills'
  },
  codebuddy: {
    prompts: '.codebuddy/commands',
    agents: 'AGENTS.md',
    mcp: '.mcp.json',
    skills: '.codebuddy/skills'
  },
  qoder: {
    prompts: '.qoder/commands',
    agents: 'AGENTS.md',
    mcp: '.mcp.json',
    skills: 'qoder/skills'
  }
}

/**
 * 展开路径中的 ~ 为用户主目录
 */
function expandPath(path: string): string {
  if (path.startsWith('~')) {
    return path.replace('~', homedir())
  }
  return path
}

/**
 * 获取 IDE 路径映射
 */
export function getIdePathMapping(ide: AiIdeType): IdePathMapping {
  const mapping = IDE_PATH_MAPPINGS[ide]
  return {
    prompts: expandPath(mapping.prompts),
    agents: expandPath(mapping.agents),
    mcp: expandPath(mapping.mcp),
    skills: expandPath(mapping.skills)
  }
}

/**
 * 获取所有支持的 IDE 列表
 */
export function getSupportedIdes(): AiIdeType[] {
  return Object.keys(IDE_PATH_MAPPINGS) as AiIdeType[]
}

/**
 * 验证 IDE 类型是否支持
 */
export function isValidIde(ide: string): ide is AiIdeType {
  return ide in IDE_PATH_MAPPINGS
}
