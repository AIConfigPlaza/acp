import fs from 'fs-extra'
import path from 'path'
import os from 'os'

/**
 * 语言配置管理
 * 支持的语言: zh-CN (中文), en-US (英文)
 */

export type Locale = 'zh-CN' | 'en-US'

const LOCALE_ENV_KEY = 'ACP_CLI_LOCALE'
const DEFAULT_LOCALE: Locale = 'zh-CN'

const CONFIG_DIR = path.join(os.homedir(), '.acp')
const LOCALE_FILE = path.join(CONFIG_DIR, 'locale')

/**
 * 读取当前语言配置
 */
export async function getLocale(): Promise<Locale> {
  // 1. 优先读取环境变量
  const envLocale = process.env[LOCALE_ENV_KEY]
  if (envLocale && isValidLocale(envLocale)) {
    return envLocale as Locale
  }

  // 2. 读取本地配置文件
  try {
    if (await fs.pathExists(LOCALE_FILE)) {
      const locale = (await fs.readFile(LOCALE_FILE, 'utf-8')).trim()
      if (isValidLocale(locale)) {
        return locale as Locale
      }
    }
  } catch (error) {
    // 读取失败使用默认值
  }

  // 3. 返回默认语言
  return DEFAULT_LOCALE
}

/**
 * 保存语言配置到本地文件
 */
export async function saveLocale(locale: Locale): Promise<void> {
  if (!isValidLocale(locale)) {
    throw new Error(`不支持的语言: ${locale}`)
  }

  // 确保配置目录存在
  await fs.ensureDir(CONFIG_DIR)

  // 保存语言配置
  await fs.writeFile(LOCALE_FILE, locale, 'utf-8')
}

/**
 * 验证语言代码是否有效
 */
function isValidLocale(locale: string): boolean {
  return locale === 'zh-CN' || locale === 'en-US'
}

/**
 * 获取所有支持的语言列表
 */
export function getSupportedLocales(): Locale[] {
  return ['zh-CN', 'en-US']
}

/**
 * 获取语言显示名称
 */
export function getLocaleName(locale: Locale): string {
  const names: Record<Locale, string> = {
    'zh-CN': '简体中文',
    'en-US': 'English'
  }
  return names[locale]
}
