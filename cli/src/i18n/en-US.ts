/**
 * English Language Pack
 */

export const enUS = {
  // Common
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',
    success: 'Success',
    failed: 'Failed',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  },

  // CLI Main
  cli: {
    name: 'acp',
    description: 'AI-Config-Plaza CLI - Unified AI Programming Tool Configuration Management',
    version: 'Show version number',
    help: 'Show help information',
    exampleTitle: 'Examples:'
  },

  // login command
  login: {
    command: 'login',
    description: 'Login to ACP CLI and save access token',
    title: '🔐 ACP CLI Login',
    alreadyLoggedIn: 'Already logged in. Do you want to login again?',
    cancelled: 'Login cancelled',
    inputToken: 'Please enter CLI Token:',
    tokenEmpty: 'Token cannot be empty',
    tokenInvalid: 'Invalid token format (at least 10 characters)',
    success: 'Login successful! Token saved to ~/.acp/token',
    hint: 'Tip: You can now use acp apply command to fetch configurations',
    failed: 'Login failed'
  },

  // apply command
  apply: {
    command: 'apply',
    description: 'Fetch and apply configurations to local project',
    title: '🚀 ACP Configuration Apply',
    optionType: 'Resource type (solution|agent|prompt|mcp)',
    optionIde: 'AI IDE type (vscode|cursor|codex|claude-code)',
    optionDir: 'Target directory',
    notLoggedIn: 'Not logged in. Please run acp login first',
    loginFirst: 'Run acp login command to login',
    selectResourceType: 'Please select resource type:',
    resourceTypes: {
      solution: 'Solution',
      agent: 'Agent Configuration (Not supported yet)',
      prompt: 'Prompt (Not supported yet)',
      mcp: 'MCP Configuration (Not supported yet)'
    },
    notSupported: 'Standalone application of agent/prompt/mcp is not supported yet. Please use solution type',
    noSelection: 'No configuration selected',
    selectIde: 'Please select AI IDE type:',
    applied: 'Configuration applied to:',
    searchPlaceholder: 'Search solutions (enter name or description)',
    noResults: 'No solutions found',
    loadingMore: 'Loading more...',
    noMore: 'No more items',
    selected: 'Selected',
    selectSolution: 'Please select a solution:',
    fetching: 'Fetching solution list...',
    fetchSuccess: 'Fetched {count} solutions',
    noSolutions: 'No solutions available',
    searchPrompt: 'Search solutions (search by name, leave empty to show all):',
    noMatch: 'No matching solutions found',
    selectSolutionPage: 'Select solution (Page {current}/{total}):',
    nextPage: '>>> Next Page',
    prevPage: '<<< Previous Page',
    cancel: 'Cancel',
    fetchingDetail: 'Fetching solution details...',
    fetchDetailFailed: 'Failed to fetch solutions',
    ideTypes: {
      vscode: 'VS Code',
      cursor: 'Cursor',
      codex: 'Codex',
      claudeCode: 'Claude Code'
    }
  },

  // locale command
  locale: {
    command: 'locale',
    description: 'Switch CLI language',
    title: '🌐 Language Settings',
    current: 'Current Language',
    selectLanguage: 'Please select language:',
    success: 'Language switched to',
    failed: 'Failed to switch language',
    restartHint: 'Tip: Changes take effect immediately for new commands'
  },

  // Error handling
  error: {
    errorCode: 'Error Code:',
    suggestions: '💡 Suggestions:',
    needHelp: 'Need help? Visit:',
    unknownError: 'Unknown error'
  }
}
