import fs from 'fs-extra'
import path from 'path'
import os from 'os'

/**
 * Token 和 BASE_URL 配置管理
 * 优先级: 环境变量 > ~/.acp/ 配置文件
 */

const TOKEN_ENV_KEY = 'ACP_CLI_TOKEN'
const BASE_URL_ENV_KEY = 'ACP_CLI_BASE_URL'
const DEFAULT_BASE_URL = 'https://api.ai-config-plaza.com'

const CONFIG_DIR = path.join(os.homedir(), '.acp')
const TOKEN_FILE = path.join(CONFIG_DIR, 'token')
const BASE_URL_FILE = path.join(CONFIG_DIR, 'base-url')

/**
 * 读取 CLI Token
 */
export async function getToken(): Promise<string | null> {
  // 1. 优先读取环境变量
  const envToken = process.env[TOKEN_ENV_KEY]
  if (envToken?.trim()) {
    return envToken.trim()
  }

  // 2. 读取本地配置文件
  try {
    if (await fs.pathExists(TOKEN_FILE)) {
      const token = await fs.readFile(TOKEN_FILE, 'utf-8')
      return token.trim() || null
    }
  } catch (error) {
    // 读取失败返回 null
  }

  return null
}

/**
 * 保存 CLI Token 到本地配置文件
 */
export async function saveToken(token: string): Promise<void> {
  if (!token?.trim()) {
    throw new Error('Token 不能为空')
  }

  // 确保配置目录存在
  await fs.ensureDir(CONFIG_DIR)

  // 写入 token 文件
  await fs.writeFile(TOKEN_FILE, token.trim(), 'utf-8')
}

/**
 * 删除本地 Token
 */
export async function removeToken(): Promise<void> {
  if (await fs.pathExists(TOKEN_FILE)) {
    await fs.remove(TOKEN_FILE)
  }
}

/**
 * 检查是否已登录
 */
export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken()
  return token !== null && token.length > 0
}

/**
 * 读取 BASE_URL
 */
export async function getBaseUrl(): Promise<string> {
  // 1. 优先读取环境变量
  const envBaseUrl = process.env[BASE_URL_ENV_KEY]
  if (envBaseUrl?.trim()) {
    return envBaseUrl.trim()
  }

  // 2. 读取本地配置文件
  try {
    if (await fs.pathExists(BASE_URL_FILE)) {
      const baseUrl = await fs.readFile(BASE_URL_FILE, 'utf-8')
      if (baseUrl.trim()) {
        return baseUrl.trim()
      }
    }
  } catch (error) {
    // 读取失败，使用默认值
  }

  // 3. 返回默认值
  return DEFAULT_BASE_URL
}

/**
 * 保存 BASE_URL 到本地配置文件
 */
export async function saveBaseUrl(baseUrl: string): Promise<void> {
  if (!baseUrl?.trim()) {
    throw new Error('BASE_URL 不能为空')
  }

  // 验证 URL 格式
  try {
    new URL(baseUrl.trim())
  } catch {
    throw new Error('BASE_URL 格式不正确，请输入有效的 URL')
  }

  // 确保配置目录存在
  await fs.ensureDir(CONFIG_DIR)

  // 写入 base-url 文件
  await fs.writeFile(BASE_URL_FILE, baseUrl.trim(), 'utf-8')
}

/**
 * 删除本地 BASE_URL
 */
export async function removeBaseUrl(): Promise<void> {
  if (await fs.pathExists(BASE_URL_FILE)) {
    await fs.remove(BASE_URL_FILE)
  }
}

/**
 * 初始化默认配置（首次使用时）
 */
export async function initDefaultConfig(): Promise<void> {
  await fs.ensureDir(CONFIG_DIR)

  // 如果 BASE_URL 不存在，初始化默认值
  if (!(await fs.pathExists(BASE_URL_FILE))) {
    await saveBaseUrl(DEFAULT_BASE_URL)
  }
}
