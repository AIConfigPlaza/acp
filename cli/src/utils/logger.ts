import chalk from 'chalk'
import { t } from '../i18n/index.js'

/**
 * 日志工具 - 提供统一的终端输出格式
 */

// 使用 Unicode 符号代替 figures
const symbols = {
  info: 'ℹ',
  tick: '✓',
  warning: '⚠',
  cross: '✖',
  arrowRight: '→'
}

export const logger = {
  /**
   * 普通信息
   */
  info: (message: string) => {
    console.log(chalk.blue(symbols.info) + ' ' + message)
  },

  /**
   * 成功信息
   */
  success: (message: string) => {
    console.log(chalk.green(symbols.tick) + ' ' + chalk.green(message))
  },

  /**
   * 警告信息
   */
  warning: (message: string) => {
    console.log(chalk.yellow(symbols.warning) + ' ' + chalk.yellow(message))
  },

  /**
   * 错误信息
   */
  error: (message: string) => {
    console.error(chalk.red(symbols.cross) + ' ' + chalk.red(message))
  },

  /**
   * 步骤信息
   */
  step: (message: string) => {
    console.log(chalk.cyan(symbols.arrowRight) + ' ' + chalk.gray(message))
  },

  /**
   * 标题
   */
  title: (message: string) => {
    console.log('\n' + chalk.bold.underline(message) + '\n')
  },

  /**
   * 普通文本（无图标）
   */
  log: (message: string) => {
    console.log(message)
  }
}

/**
 * 自定义 CLI 错误类
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public suggestions?: string[]
  ) {
    super(message)
    this.name = 'CLIError'
  }
}

/**
 * 错误处理函数
 */
export async function handleError(error: unknown): Promise<void> {
  console.error()

  if (error instanceof CLIError) {
    logger.error(error.message)

    if (error.code) {
      const errorCodeText = await t('error.errorCode')
      console.log(chalk.gray(`${errorCodeText} ${error.code}`))
    }

    if (error.suggestions?.length) {
      const suggestionsText = await t('error.suggestions')
      console.log(chalk.yellow.bold(`\n${suggestionsText}\n`))
      error.suggestions.forEach((suggestion, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${suggestion}`))
      })
    }
  } else if (error instanceof Error) {
    logger.error(error.message)

    if (process.env.DEBUG) {
      console.log(chalk.gray('\n' + error.stack))
    }
  } else {
    logger.error(await t('error.unknownError'))
  }

  const needHelpText = await t('error.needHelp')
  console.log(
    chalk.gray(`\n${needHelpText} `) +
      chalk.blue.underline('https://github.com/AIConfigPlaza/acp-cli')
  )
  console.log()
}
