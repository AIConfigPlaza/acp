import { getLocale, type Locale } from '../config/locale.js'
import { zhCN } from './zh-CN.js'
import { enUS } from './en-US.js'

/**
 * 国际化工具 - 提供多语言支持
 */

// 语言包映射
const messages: Record<Locale, typeof zhCN> = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 当前语言缓存
let currentLocale: Locale | null = null
let currentMessages: typeof zhCN | null = null

/**
 * 初始化 i18n
 */
async function initI18n(): Promise<void> {
  if (!currentLocale) {
    currentLocale = await getLocale()
    currentMessages = messages[currentLocale]
  }
}

/**
 * 翻译函数 - 根据键路径获取翻译文本
 * @param key - 翻译键，支持点分隔的路径，如 'login.title'
 * @param params - 替换参数对象
 * @returns 翻译后的文本
 */
export async function t(key: string, params?: Record<string, string | number>): Promise<string> {
  await initI18n()

  // 通过点分隔的路径获取嵌套值
  const keys = key.split('.')
  let value: any = currentMessages

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // 如果找不到翻译，返回 key 本身
      return key
    }
  }

  // 如果不是字符串，返回 key
  if (typeof value !== 'string') {
    return key
  }

  // 替换参数
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return paramKey in params ? String(params[paramKey]) : match
    })
  }

  return value
}

/**
 * 同步翻译函数（需要先初始化）
 * @param key - 翻译键
 * @param params - 替换参数对象
 * @returns 翻译后的文本
 */
export function tSync(key: string, params?: Record<string, string | number>): string {
  if (!currentMessages) {
    // 如果未初始化，返回 key
    return key
  }

  const keys = key.split('.')
  let value: any = currentMessages

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  if (typeof value !== 'string') {
    return key
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return paramKey in params ? String(params[paramKey]) : match
    })
  }

  return value
}

/**
 * 获取当前语言
 */
export async function getCurrentLocale(): Promise<Locale> {
  await initI18n()
  return currentLocale!
}

/**
 * 重新加载语言配置（切换语言后调用）
 */
export async function reloadLocale(): Promise<void> {
  currentLocale = null
  currentMessages = null
  await initI18n()
}

/**
 * 获取完整的语言包（用于类型提示）
 */
export function getMessages() {
  return currentMessages || zhCN
}
