import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { saveToken, getToken, initDefaultConfig } from '../config/token.js'
import { logger } from '../utils/logger.js'
import { t } from '../i18n/index.js'

/**
 * acp login 命令
 * 提示用户输入 CLI Token 并保存
 */

export const loginCommand = new Command('login')
  .description('登录 ACP CLI，保存访问令牌 / Login to ACP CLI and save access token')
  .action(async () => {
    try {
      logger.title(await t('login.title'))

      // 初始化默认配置（首次使用时）
      await initDefaultConfig()

      // 检查是否已有 token
      const existingToken = await getToken()
      if (existingToken) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: await t('login.alreadyLoggedIn'),
            default: false
          }
        ])

        if (!overwrite) {
          logger.info(await t('login.cancelled'))
          return
        }
      }

      // 提示输入 token
      const { token } = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: await t('login.inputToken'),
          validate: async (input: string) => {
            if (!input.trim()) {
              return await t('login.tokenEmpty')
            }
            if (input.trim().length < 10) {
              return await t('login.tokenInvalid')
            }
            return true
          },
          mask: '*'
        }
      ])

      // 保存 token
      await saveToken(token)

      logger.success(await t('login.success'))
      console.log(chalk.gray('\n' + await t('login.hint') + '\n'))
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`${await t('login.failed')}: ${error.message}`)
      }
      process.exit(1)
    }
  })
