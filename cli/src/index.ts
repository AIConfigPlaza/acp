#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { loginCommand } from './commands/login.js'
import { applyCommand } from './commands/apply.js'
import { localeCommand } from './commands/locale.js'
import { handleError } from './utils/logger.js'
import { t } from './i18n/index.js'

/**
 * ACP CLI 主入口
 */

// 版本号在构建时注入
// @ts-ignore - 构建时通过 tsup define 注入
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0-dev'

async function main() {
  const program = new Command()

  program
    .name('acp')
    .description(
      chalk.gray(await t('cli.description'))
    )
    .version(version, '-v, --version', await t('cli.version'))
    .helpOption('-h, --help', await t('cli.help'))

  // 注册命令
  program.addCommand(loginCommand)
  program.addCommand(applyCommand)
  program.addCommand(localeCommand)

  // 自定义帮助显示
  program.on('--help', async () => {
    console.log(chalk.bold('\n' + await t('cli.exampleTitle') + '\n'))
    console.log(chalk.gray('  $ acp login'))
    console.log(chalk.gray('  $ acp apply'))
    console.log(chalk.gray('  $ acp apply --ide vscode --dir ./my-project'))
    console.log(chalk.gray('  $ acp locale'))
    console.log()
  })

  // 解析命令
  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    await handleError(error)
    process.exit(1)
  }
}

main()
