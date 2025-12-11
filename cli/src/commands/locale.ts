import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { getLocale, saveLocale, getSupportedLocales, getLocaleName, type Locale } from '../config/locale.js'
import { t } from '../i18n/index.js'
import { logger } from '../utils/logger.js'

/**
 * acp locale 命令
 * 切换 CLI 语言
 */

export const localeCommand = new Command('locale')
  .description('切换 CLI 语言 / Switch CLI language')
  .action(async () => {
    try {
      // 获取当前语言
      const currentLocale = await getLocale()
      
      // 显示标题
      const title = await t('locale.title')
      logger.title(title)

      // 显示当前语言
      const currentText = await t('locale.current')
      console.log(chalk.gray(`${currentText}: `) + chalk.cyan(getLocaleName(currentLocale)))
      console.log()

      // 选择新语言
      const supportedLocales = getSupportedLocales()
      const selectText = await t('locale.selectLanguage')
      
      const { newLocale } = await inquirer.prompt([
        {
          type: 'list',
          name: 'newLocale',
          message: selectText,
          choices: supportedLocales.map(locale => ({
            name: locale === currentLocale 
              ? chalk.cyan(`${getLocaleName(locale)} (当前 / Current)`)
              : getLocaleName(locale),
            value: locale
          })),
          default: currentLocale
        }
      ])

      // 如果选择的是当前语言，则不做任何操作
      if (newLocale === currentLocale) {
        logger.info(`${await t('locale.current')}: ${getLocaleName(currentLocale)}`)
        return
      }

      // 保存新语言
      await saveLocale(newLocale as Locale)

      // 显示成功消息（使用新语言）
      // 注意：这里需要手动构造消息，因为 t() 函数还在使用旧语言缓存
      if (newLocale === 'zh-CN') {
        logger.success(`语言已切换为 ${getLocaleName(newLocale)}`)
        console.log(chalk.gray('\n提示: 已生效，新命令将使用所选语言\n'))
      } else {
        logger.success(`Language switched to ${getLocaleName(newLocale)}`)
        console.log(chalk.gray('\nTip: Changes take effect immediately for new commands\n'))
      }

    } catch (error) {
      if (error instanceof Error) {
        logger.error(`${await t('locale.failed')}: ${error.message}`)
      }
      process.exit(1)
    }
  })
