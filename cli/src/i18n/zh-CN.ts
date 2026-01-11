/**
 * 中文语言包
 */

export const zhCN = {
  // 通用
  common: {
    confirm: '确认',
    cancel: '取消',
    yes: '是',
    no: '否',
    success: '成功',
    failed: '失败',
    error: '错误',
    warning: '警告',
    info: '提示'
  },

  // CLI 主程序
  cli: {
    name: 'acp',
    description: 'AI-Config-Plaza CLI - 统一 AI 编程工具配置管理',
    version: '显示版本号',
    help: '显示帮助信息',
    exampleTitle: '示例:'
  },

  // login 命令
  login: {
    command: 'login',
    description: '登录 ACP CLI，保存访问令牌',
    title: '🔐 ACP CLI 登录',
    alreadyLoggedIn: '检测到已登录，是否重新登录?',
    cancelled: '已取消登录',
    inputToken: '请输入 CLI Token:',
    tokenEmpty: 'Token 不能为空',
    tokenInvalid: 'Token 格式不正确（至少 10 个字符）',
    success: '登录成功！Token 已保存到 ~/.acp/token',
    hint: '提示: 现在可以使用 acp apply 命令拉取配置',
    failed: '登录失败'
  },

  // apply 命令
  apply: {
    command: 'apply',
    description: '拉取并应用配置到本地项目',
    title: '🚀 ACP 配置应用',
    optionType: '资源类型 (solution|agent|prompt|mcp)',
    optionIde: 'AI IDE 类型 (vscode|cursor|codex|claude-code)',
    optionDir: '目标目录',
    notLoggedIn: '未登录，请先执行 acp login',
    loginFirst: '运行 acp login 命令登录',
    selectResourceType: '请选择资源类型:',
    resourceTypes: {
      solution: '解决方案 (Solution)',
      agent: 'Agent 配置 (暂不支持)',
      prompt: 'Prompt (暂不支持)',
      mcp: 'MCP 配置 (暂不支持)'
    },
    notSupported: '暂不支持独立应用 agent/prompt/mcp，请使用 solution 类型',
    noSelection: '未选择任何配置',
    selectIde: '请选择 AI IDE 类型:',
    applied: '配置已应用到:',
    searchPlaceholder: '搜索解决方案（输入名称或描述）',
    noResults: '没有找到解决方案',
    loadingMore: '加载更多...',
    noMore: '没有更多了',
    selected: '已选择',
    selectSolution: '请选择一个解决方案:',
    fetching: '正在获取解决方案列表...',
    fetchSuccess: '获取到 {count} 个解决方案',
    noSolutions: '暂无可用的解决方案',
    searchPrompt: '搜索解决方案 (按名称搜索，留空显示全部):',
    noMatch: '未找到匹配的解决方案',
    selectSolutionPage: '选择解决方案 (第 {current}/{total} 页):',
    nextPage: '>>> 下一页',
    prevPage: '<<< 上一页',
    cancel: '取消',
    fetchingDetail: '正在获取解决方案详情...',
    fetchDetailFailed: '获取解决方案失败',
    ideTypes: {
      vscode: 'VS Code',
      cursor: 'Cursor',
      codex: 'Codex',
      claudeCode: 'Claude Code'
    }
  },

  // locale 命令
  locale: {
    command: 'locale',
    description: '切换 CLI 语言',
    title: '🌐 语言设置',
    current: '当前语言',
    selectLanguage: '请选择语言:',
    success: '语言已切换为',
    failed: '语言切换失败',
    restartHint: '提示: 已生效，新命令将使用所选语言'
  },

  // update 命令
  update: {
    command: 'update',
    description: '更新 ACP CLI 到最新版本',
    title: '⬆️ CLI 自更新',
    currentVersion: '当前版本',
    latestVersion: '最新版本',
    alreadyLatest: '已是最新版本，无需更新',
    checkingLatest: '正在检查最新版本...',
    fetchFailed: '获取最新版本失败',
    selectTarget: '请选择更新目标:',
    targets: {
      global: '全局 (推荐)',
      local: '本地项目'
    },
    noPkgManager: '未检测到可用的包管理器 (pnpm/npm/yarn)',
    selectPkgManager: '请选择包管理器:',
    executing: '正在使用 {manager} 执行更新...',
    success: '更新成功！',
    failed: '更新失败',
    verifyHint: '提示: 运行 acp -v 查看当前版本'
  },

  // 错误处理
  error: {
    errorCode: '错误代码:',
    suggestions: '💡 建议:',
    needHelp: '需要帮助? 访问:',
    unknownError: '未知错误'
  }
}
