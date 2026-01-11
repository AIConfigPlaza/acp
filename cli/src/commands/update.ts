import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import axios from 'axios'
import { spawnSync } from 'child_process'
import { logger, CLIError } from '../utils/logger.js'
import { t } from '../i18n/index.js'

/**
 * acp update 命令
 * 检查并更新 ACP CLI 到最新版本
 */

// 版本号在构建时注入
// @ts-ignore - 构建时通过 tsup define 注入
const currentVersion = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0-dev'
const packageName = '@ai-config-plaza/acp-cli'

type UpdateTarget = 'global' | 'local'

function getAvailablePkgManagers(): string[] {
  const managers = ['pnpm', 'npm', 'yarn']
  const available: string[] = []
  for (const m of managers) {
    const res = spawnSync(m, ['--version'], { stdio: 'pipe', shell: true })
    if (res.status === 0) available.push(m)
  }
  return available
}

function runUpdate(target: UpdateTarget, manager: string): number {
  const isGlobal = target === 'global'
  let args: string[] = []

  if (manager === 'pnpm') {
    args = isGlobal
      ? ['add', '-g', `${packageName}@latest`]
      : ['add', `${packageName}@latest`]
  } else if (manager === 'npm') {
    args = isGlobal
      ? ['install', '-g', `${packageName}@latest`]
      : ['install', `${packageName}@latest`, '--save']
  } else if (manager === 'yarn') {
    args = isGlobal
      ? ['global', 'add', `${packageName}@latest`]
      : ['add', `${packageName}@latest`]
  } else {
    return 1
  }

  const execSpinner = ora().start()
  execSpinner.text = manager + ' ' + args.join(' ')

  const res = spawnSync(manager, args, { stdio: 'inherit', shell: true })
  execSpinner.stop()
  return res.status ?? 1
}

export const updateCommand = new Command('update')
  .description('更新 ACP CLI 到最新版本 / Update ACP CLI to latest version')
  .option('-t, --target <target>', '更新目标 (global|local) / Update target', 'global')
  .action(async (options) => {
    try {
      logger.title(await t('update.title'))

      // 显示当前版本
      logger.info(`${await t('update.currentVersion')}: ${chalk.cyan(currentVersion)}`)

      // 查询 npm 最新版本
      const spinner = ora(await t('update.checkingLatest')).start()
      let latestVersion = ''
      try {
        const resp = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`)
        latestVersion = resp.data?.version || ''
      } catch (e) {
        spinner.fail(await t('update.fetchFailed'))
        throw new CLIError(await t('update.fetchFailed'), 'FETCH_LATEST_FAILED')
      }

      spinner.stop()
      if (!latestVersion) {
        throw new CLIError(await t('update.fetchFailed'), 'LATEST_EMPTY')
      }

      logger.info(`${await t('update.latestVersion')}: ${chalk.cyan(latestVersion)}`)

      if (currentVersion === latestVersion) {
        logger.success(await t('update.alreadyLatest'))
        return
      }

      // 选择更新目标
      const target: UpdateTarget = ['global', 'local'].includes(options.target)
        ? options.target
        : (await (async () => {
            const { targetSel } = await inquirer.prompt([
              {
                type: 'list',
                name: 'targetSel',
                message: await t('update.selectTarget'),
                choices: [
                  { name: await t('update.targets.global'), value: 'global' },
                  { name: await t('update.targets.local'), value: 'local' }
                ],
                default: 'global'
              }
            ])
            return targetSel as UpdateTarget
          })())

      // 检测包管理器
      const managers = getAvailablePkgManagers()
      if (managers.length === 0) {
        throw new CLIError(await t('update.noPkgManager'), 'NO_PKG_MANAGER', [
          '安装 pnpm 或 npm 后重试',
          'https://pnpm.io/installation'
        ])
      }

      let manager = managers[0]
      if (managers.length > 1) {
        const { pm } = await inquirer.prompt([
          {
            type: 'list',
            name: 'pm',
            message: await t('update.selectPkgManager'),
            choices: managers.map(m => ({ name: m, value: m })),
            default: manager
          }
        ])
        manager = pm
      }

      logger.step(await t('update.executing', { manager }))
      const code = runUpdate(target, manager)
      if (code === 0) {
        logger.success(await t('update.success'))
        logger.info(await t('update.verifyHint'))
      } else {
        throw new CLIError(await t('update.failed'), 'UPDATE_FAILED')
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message)
      }
      process.exit(1)
    }
  })
