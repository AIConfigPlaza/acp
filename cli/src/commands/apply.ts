import { Command } from 'commander'
import inquirer from 'inquirer'
import chalk from 'chalk'
import ora from 'ora'
import { apiClient } from '../api/client.js'
import { logger, CLIError } from '../utils/logger.js'
import { isLoggedIn } from '../config/token.js'
import { type AiIdeType } from '../utils/ide-mapper.js'
import { searchByName, paginate } from '../utils/pagination.js'
import { applySolution } from '../apply/writer.js'
import type { Solution } from '../types/index.js'
import { t } from '../i18n/index.js'

/**
 * acp apply 命令
 * 拉取并应用配置到本地项目
 */

type ResourceType = 'solution' | 'agent' | 'prompt' | 'mcp'

export const applyCommand = new Command('apply')
  .description('拉取并应用配置到本地项目 / Fetch and apply configurations to local project')
  .option('-t, --type <type>', '资源类型 (solution|agent|prompt|mcp) / Resource type', 'solution')
  .option('-i, --ide <ide>', 'AI IDE 类型 / AI IDE type (vscode|cursor|codex|claude-code)')
  .option('-d, --dir <path>', '目标目录 / Target directory', process.cwd())
  .action(async (options) => {
    try {
      // 检查登录状态
      if (!(await isLoggedIn())) {
        throw new CLIError(
          await t('apply.notLoggedIn'),
          'NOT_LOGGED_IN',
          [await t('apply.loginFirst')]
        )
      }

      logger.title(await t('apply.title'))

      // 1. 选择资源类型
      const resourceType = await selectResourceType(options.type)

      // 2. 根据类型拉取并选择资源
      let selectedSolution: Solution | null = null

      if (resourceType === 'solution') {
        selectedSolution = await fetchAndSelectSolution()
      } else {
        throw new CLIError(await t('apply.notSupported'))
      }

      if (!selectedSolution) {
        logger.info(await t('apply.noSelection'))
        return
      }

      // 3. 选择 IDE 类型
      const ide = options.ide || (await selectIde())

      // 4. 应用配置
      await applySolution(selectedSolution, {
        ide: ide as AiIdeType,
        targetDir: options.dir
      })

      const appliedMsg = await t('apply.applied')
      console.log(chalk.gray(`\n${appliedMsg} ${chalk.cyan(options.dir)}\n`))
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message)
      }
      process.exit(1)
    }
  })

/**
 * 选择资源类型
 */
async function selectResourceType(defaultType?: string): Promise<ResourceType> {
  if (defaultType && ['solution', 'agent', 'prompt', 'mcp'].includes(defaultType)) {
    return defaultType as ResourceType
  }

  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: await t('apply.selectResourceType'),
      choices: [
        { name: chalk.cyan(await t('apply.resourceTypes.solution')), value: 'solution' },
        { name: chalk.gray(await t('apply.resourceTypes.agent')), value: 'agent', disabled: true },
        { name: chalk.gray(await t('apply.resourceTypes.prompt')), value: 'prompt', disabled: true },
        { name: chalk.gray(await t('apply.resourceTypes.mcp')), value: 'mcp', disabled: true }
      ],
      default: 'solution'
    }
  ])

  return type
}

/**
 * 拉取并选择解决方案
 */
async function fetchAndSelectSolution(): Promise<Solution | null> {
  const spinner = ora(await t('apply.fetching')).start()

  try {
    // 1. 拉取解决方案列表
    const response = await apiClient.getSolutions()
    spinner.stop()

    if (!response.data || response.data.length === 0) {
      logger.warning(await t('apply.noSolutions'))
      return null
    }

    logger.success(await t('apply.fetchSuccess', { count: response.data.length }))

    // 2. 搜索过滤
    const { searchQuery } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchQuery',
        message: await t('apply.searchPrompt'),
        default: ''
      }
    ])

    let filteredSolutions = searchByName(response.data, searchQuery)

    if (filteredSolutions.length === 0) {
      logger.warning(await t('apply.noMatch'))
      return null
    }

    // 3. 分页显示
    const PAGE_SIZE = 20
    let currentPage = 1
    let selectedSolution: Solution | null = null

    while (!selectedSolution) {
      const paginatedResult = paginate(filteredSolutions, {
        page: currentPage,
        pageSize: PAGE_SIZE
      })

      // 构建选择列表
      const choices = paginatedResult.items.map((solution) => ({
        name: `${chalk.cyan(solution.name)} ${chalk.yellow(`@${solution.author.username}`)} - ${chalk.gray(solution.description)}`,
        value: solution.id,
        short: solution.name
      }))

      // 添加分页控制选项
      if (paginatedResult.hasNext) {
        choices.push({
          name: chalk.yellow(await t('apply.nextPage')),
          value: '__NEXT_PAGE__',
          short: await t('apply.nextPage')
        })
      }

      if (paginatedResult.hasPrev) {
        choices.unshift({
          name: chalk.yellow(await t('apply.prevPage')),
          value: '__PREV_PAGE__',
          short: await t('apply.prevPage')
        })
      }

      choices.push({
        name: chalk.red(await t('apply.cancel')),
        value: '__CANCEL__',
        short: await t('apply.cancel')
      })

      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message: await t('apply.selectSolutionPage', { 
            current: currentPage, 
            total: paginatedResult.totalPages 
          }),
          choices,
          pageSize: 15
        }
      ])

      if (selected === '__CANCEL__') {
        return null
      } else if (selected === '__NEXT_PAGE__') {
        currentPage++
      } else if (selected === '__PREV_PAGE__') {
        currentPage--
      } else {
        // 获取详情
        const detailSpinner = ora(await t('apply.fetchingDetail')).start()
        const detailResponse = await apiClient.getSolutionById(selected)
        detailSpinner.stop()

        selectedSolution = detailResponse.data
      }
    }

    return selectedSolution
  } catch (error) {
    spinner.fail(await t('apply.fetchDetailFailed'))
    throw error
  }
}

/**
 * 选择 IDE 类型
 */
async function selectIde(): Promise<AiIdeType> {
  const { ide } = await inquirer.prompt([
    {
      type: 'list',
      name: 'ide',
      message: await t('apply.selectIde'),
      choices: [
        { name: chalk.cyan(await t('apply.ideTypes.vscode')), value: 'vscode' },
        { name: chalk.cyan(await t('apply.ideTypes.cursor')), value: 'cursor' },
        { name: chalk.cyan(await t('apply.ideTypes.codex')), value: 'codex' },
        { name: chalk.cyan(await t('apply.ideTypes.claudeCode')), value: 'claude-code' }
      ],
      default: 'vscode'
    }
  ])

  return ide
}
