import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { logger } from '../utils/logger.js'
import { getIdePathMapping, type AiIdeType } from '../utils/ide-mapper.js'
import type { Solution, Prompt, McpConfig, Skill } from '../types/index.js'

/**
 * 配置应用模块 - 将远程配置写入本地文件
 */

export interface ApplyOptions {
  ide: AiIdeType
  targetDir: string
}

/**
 * 应用解决方案配置
 */
export async function applySolution(
  solution: Solution,
  options: ApplyOptions
): Promise<void> {
  const { ide, targetDir } = options
  const pathMapping = getIdePathMapping(ide)

  logger.title(`📦 应用解决方案: ${chalk.cyan(solution.name)}`)

  // 1. 应用 Agent 配置
  if (solution.agentConfig) {
    await applyAgentConfig(
      solution.agentConfig.content,
      pathMapping.agents,
      targetDir
    )
  }

  // 2. 应用 Prompts
  if (solution.customPrompts?.length) {
    await applyPrompts(
      solution.customPrompts,
      pathMapping.prompts,
      targetDir
    )
  }

  // 3. 应用 MCP 配置
  if (solution.mcpConfigs?.length) {
    await applyMcpConfigs(
      solution.mcpConfigs,
      pathMapping.mcp,
      targetDir
    )
  }

  // 4. 应用 Skills
  if (solution.skills?.length) {
    await applySkills(
      solution.skills,
      pathMapping.skills,
      targetDir
    )
  }

  logger.success(`\n✨ 解决方案 ${chalk.cyan(solution.name)} 应用成功！`)
}

/**
 * 应用 Agent 配置
 */
export async function applyAgentConfig(
  content: string,
  relativePath: string,
  targetDir: string
): Promise<void> {
  const filePath = path.join(targetDir, relativePath)

  logger.step(`写入 Agent 配置: ${chalk.gray(relativePath)}`)

  // 检查文件是否存在
  const exists = await fs.pathExists(filePath)
  if (exists) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `文件 ${chalk.cyan(relativePath)} 已存在，是否覆盖?`,
        default: true
      }
    ])

    if (!overwrite) {
      logger.warning(`跳过: ${relativePath}`)
      return
    }
  }

  // 写入文件
  await fs.ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content, 'utf-8')

  logger.success(`已写入: ${relativePath}`)
}

/**
 * 应用 Prompts
 */
export async function applyPrompts(
  prompts: Prompt[],
  promptsDir: string,
  targetDir: string
): Promise<void> {
  const fullPromptsDir = path.join(targetDir, promptsDir)

  logger.step(`写入 ${prompts.length} 个 Prompt 配置到: ${chalk.gray(promptsDir)}`)

  // 确保目录存在
  await fs.ensureDir(fullPromptsDir)

  for (const prompt of prompts) {
    // 生成文件名（清理特殊字符）
    const fileName = sanitizeFileName(prompt.name) + '.prompt.md'
    const filePath = path.join(fullPromptsDir, fileName)

    // 检查是否存在
    const exists = await fs.pathExists(filePath)
    if (exists) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Prompt ${chalk.cyan(fileName)} 已存在，是否覆盖?`,
          default: true
        }
      ])

      if (!overwrite) {
        logger.warning(`跳过: ${fileName}`)
        continue
      }
    }

    // 写入内容
    await fs.writeFile(filePath, prompt.content, 'utf-8')
    logger.success(`已写入: ${path.join(promptsDir, fileName)}`)
  }
}

/**
 * 应用 MCP 配置
 */
export async function applyMcpConfigs(
  mcpConfigs: McpConfig[],
  mcpFile: string,
  targetDir: string
): Promise<void> {
  const filePath = path.join(targetDir, mcpFile)

  logger.step(`写入 MCP 配置: ${chalk.gray(mcpFile)}`)

  // 构造 mcpServers 结构
  const mcpServers: Record<string, any> = {}

  for (const mcpConfig of mcpConfigs) {
    try {
      const config = JSON.parse(mcpConfig.configJson)
      // 使用 MCP 配置的名称作为 key
      mcpServers[mcpConfig.name] = config
    } catch (error) {
      logger.warning(`MCP 配置 ${mcpConfig.name} 格式错误，已跳过`)
    }
  }

  // 检查文件是否存在
  const exists = await fs.pathExists(filePath)
  if (exists) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `文件 ${chalk.cyan(mcpFile)} 已存在，是否覆盖?`,
        default: true
      }
    ])

    if (!overwrite) {
      logger.warning(`跳过: ${mcpFile}`)
      return
    }
  }

  // 写入文件
  await fs.ensureDir(path.dirname(filePath))

  // 根据文件扩展名和路径决定输出格式
  if (mcpFile.endsWith('.toml')) {
    // Codex 使用 TOML 格式
    const tomlContent = convertMcpToToml(mcpServers)
    await fs.writeFile(filePath, tomlContent, 'utf-8')
  } else {
    // JSON 格式
    let mergedConfig: Record<string, any>
    
    // VS Code 使用 "servers"，其他 IDE 使用 "mcpServers"
    if (mcpFile.includes('.vscode')) {
      mergedConfig = {
        servers: mcpServers
      }
    } else {
      mergedConfig = {
        mcpServers
      }
    }
    
    await fs.writeFile(filePath, JSON.stringify(mergedConfig, null, 2), 'utf-8')
  }

  logger.success(`已写入: ${mcpFile}`)
}

/**
 * 将 MCP 配置转换为 TOML 格式（用于 Codex）
 */
function convertMcpToToml(mcpServers: Record<string, any>): string {
  let tomlContent = ''

  for (const [serverName, config] of Object.entries(mcpServers)) {
    tomlContent += `[mcp_servers.${serverName}]\n`
    
    // 写入 command
    if (config.command) {
      tomlContent += `command = ${JSON.stringify(config.command)}\n`
    }

    // 写入 args
    if (config.args && Array.isArray(config.args)) {
      const argsStr = config.args.map((arg: string) => JSON.stringify(arg)).join(', ')
      tomlContent += `args = [${argsStr}]\n`
    }

    // 写入 env
    if (config.env && typeof config.env === 'object') {
      const envEntries = Object.entries(config.env)
      if (envEntries.length > 0) {
        const envStr = envEntries
          .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
          .join(', ')
        tomlContent += `env = { ${envStr} }\n`
      }
    }

    tomlContent += '\n'
  }

  return tomlContent
}

/**
 * 应用 Skills
 */
export async function applySkills(
  skills: Skill[],
  skillsDir: string,
  targetDir: string
): Promise<void> {
  const fullSkillsDir = path.join(targetDir, skillsDir)

  logger.step(`写入 ${skills.length} 个 Skill 配置到: ${chalk.gray(skillsDir)}`)

  // 确保目录存在
  await fs.ensureDir(fullSkillsDir)

  for (const skill of skills) {
    // 生成目录名（清理特殊字符）
    const skillDirName = sanitizeSkillName(skill.name)
    const skillDirPath = path.join(fullSkillsDir, skillDirName)

    logger.step(`处理 Skill: ${chalk.cyan(skill.name)}`)

    // 检查目录是否存在
    const dirExists = await fs.pathExists(skillDirPath)
    if (dirExists) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Skill 目录 ${chalk.cyan(skillDirName)} 已存在，是否覆盖?`,
          default: true
        }
      ])

      if (!overwrite) {
        logger.warning(`跳过: ${skillDirName}`)
        continue
      }
    }

    // 确保目录存在
    await fs.ensureDir(skillDirPath)

    // 1. 创建 SKILL.md 文件
    const skillMdPath = path.join(skillDirPath, 'SKILL.md')
    await fs.writeFile(skillMdPath, skill.skillMarkdown, 'utf-8')
    logger.success(`已写入: ${path.join(skillsDir, skillDirName, 'SKILL.md')}`)

    // 2. 处理 SkillResources
    if (skill.skillResources && skill.skillResources.length > 0) {
      for (const resource of skill.skillResources) {
        // 确保相对路径安全（防止路径遍历攻击）
        const safeRelativePath = sanitizePath(resource.relativePath)
        const resourceFilePath = path.join(skillDirPath, safeRelativePath)

        // 检查文件是否存在
        const fileExists = await fs.pathExists(resourceFilePath)
        if (fileExists) {
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `文件 ${chalk.cyan(path.join(skillDirName, safeRelativePath))} 已存在，是否覆盖?`,
              default: true
            }
          ])

          if (!overwrite) {
            logger.warning(`跳过: ${path.join(skillDirName, safeRelativePath)}`)
            continue
          }
        }

        // 确保父目录存在
        await fs.ensureDir(path.dirname(resourceFilePath))

        // 写入文件内容
        await fs.writeFile(resourceFilePath, resource.fileContent, 'utf-8')
        logger.success(`已写入: ${path.join(skillsDir, skillDirName, safeRelativePath)}`)
      }
    }
  }
}

/**
 * 清理 skill 名称，用于创建目录名
 */
function sanitizeSkillName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '-') // 替换非法字符
    .replace(/\s+/g, '-') // 空格转连字符
    .replace(/-+/g, '-') // 多个连字符合并
    .replace(/^-+|-+$/g, '') // 移除首尾连字符
    .toLowerCase()
}

/**
 * 清理路径，防止路径遍历攻击
 */
function sanitizePath(relativePath: string): string {
  // 移除路径遍历攻击（如 ../, ..\, 等）
  let safePath = relativePath
    .replace(/\.\./g, '') // 移除 ..
    .replace(/^[/\\]+/, '') // 移除开头的 / 或 \
    .replace(/[/\\]+/g, path.sep) // 统一路径分隔符

  // 确保路径是相对路径，不包含绝对路径
  if (path.isAbsolute(safePath)) {
    safePath = path.relative('/', safePath)
  }

  // 移除 Windows 驱动器号（如 C:）
  if (safePath.match(/^[A-Za-z]:/)) {
    safePath = safePath.substring(2)
  }

  return safePath
}

/**
 * 清理文件名中的特殊字符
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '-') // 替换非法字符
    .replace(/\s+/g, '-') // 空格转连字符
    .replace(/-+/g, '-') // 多个连字符合并
    .toLowerCase()
}
