#!/usr/bin/env node

/**
 * ACP CLI 入口文件
 * 负责加载并执行主程序
 */

import('../dist/index.js').catch((error) => {
  console.error('启动 ACP CLI 失败:', error.message)
  console.error('')
  console.error('请确保已执行构建命令: pnpm build')
  process.exit(1)
})
