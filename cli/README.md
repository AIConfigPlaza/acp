# ACP CLI

**AI-Config-Plaza CLI** - 统一 AI 编程工具配置管理工具

## 📖 简介

ACP CLI 是一个专为简化 AI 编程工具配置而设计的命令行工具。通过统一的配置标准，帮助开发者快速初始化和配置 AI 工具（如 VS Code、Cursor、Codex、Claude Code、CodeBuddy、Qoder 等）。

### 核心特性

- 🔐 **统一认证**：通过 CLI Token 统一管理 API 访问权限
- 📦 **一键应用**：快速拉取并应用配置到本地项目
- 🔍 **智能搜索**：支持按名称搜索和分页浏览配置
- 🎨 **多 IDE 支持**：自动适配不同 AI IDE 的配置路径
- 🌐 **多语言支持**：支持中文和英文界面切换
- ✨ **友好交互**：清晰的终端提示和进度反馈

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install -g @ai-config-plaza/acp-cli

# 使用 pnpm
pnpm add -g @ai-config-plaza/acp-cli

│   │   ├── locale.ts     # 语言切换命令
│   │   └── update.ts     # 自更新命令
yarn global add @ai-config-plaza/acp-cli
```

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/AIConfigPlaza/acp.git
cd acp/cli

# 安装依赖
pnpm install

# 本地构建
pnpm build

# 链接到全局（用于本地测试）
npm link
```

## 📋 使用指南

### 1. 登录

首次使用需要登录并保存 CLI Token：

```bash
acp login
```

系统会提示输入 CLI Token，Token 将保存在用户主目录 `~/.acp/token` 中。

### 2. 应用配置

拉取并应用配置到本地项目：

```bash
# 在当前目录应用配置

### `acp update`

更新 ACP CLI 到最新版本。

**选项**：
- `-t, --target <target>`：更新目标（`global` 全局，`local` 本地项目；默认 `global`）

**示例**：
```bash
# 全局更新（推荐）
acp update

# 指定本地更新
acp update --target local
```
# 指定 IDE 类型
acp apply --ide vscode

# 指定目标目录
acp apply --dir ./my-project

# 完整示例
acp apply --ide cursor --dir ~/projects/my-app
```

### 3. 交互流程

执行 `acp apply` 后，CLI 会引导你完成以下步骤：

1. **选择资源类型**：目前支持 Solution（解决方案）
2. **搜索配置**：输入关键词搜索，或留空显示全部
3. **分页浏览**：每页显示 20 条记录，支持上下翻页
4. **选择配置**：从列表中选择需要的配置
5. **选择 IDE**：选择目标 AI IDE 类型
6. **确认覆盖**：如果文件已存在，会提示是否覆盖

### 4. 切换语言

ACP CLI 支持中文和英文界面：

```bash
# 打开语言设置
acp locale
```

或通过环境变量临时设置：

```bash
# Windows PowerShell
$env:ACP_CLI_LOCALE = "en-US"
acp apply

# Linux/macOS
export ACP_CLI_LOCALE=en-US
acp apply
```

支持的语言代码：
- `zh-CN`：简体中文（默认）
- `en-US`：English

详细文档：[多语言支持文档](docs/i18n.md)

## 📁 配置输出路径

不同 AI IDE 的配置文件输出路径：

| IDE         | Prompts 路径         | Agents 文件   | MCP 配置                | Skills 路径           |
| ----------- | -------------------- | ------------- | ----------------------- | -------------------- |
| VS Code     | `.github/prompts/`   | `AGENTS.md`   | `.vscode/mcp.json`      | `.github/skills/`    |
| Cursor      | `.cursor/commands/`  | `AGENTS.md`   | `.cursor/mcp.json`      | `.cursor/skills/`    |
| Codex       | `~/.codex/prompts/`  | `AGENTS.md`   | `.codex/config.toml`    | `.codex/skills/`     |
| Claude Code | `.claude/commands/`  | `AGENTS.md`   | `.mcp.json`             | `.claude/skills/`    |
| CodeBuddy   | `.codebuddy/commands/` | `AGENTS.md` | 不支持                  | `.codebuddy/skills/` |
| Qoder       | `.qoder/commands/`   | `AGENTS.md`   | `.mcp.json`             | `qoder/skills/`      |

### 文件格式

- **Prompts**：输出为 `*.prompt.md` 格式的 Markdown 文件
- **Agents**：输出为项目根目录的 `AGENTS.md` 文件
- **MCP 配置**：
  - VS Code: JSON 格式（`servers` 结构）在 `.vscode/mcp.json`
  - Cursor/Claude Code: JSON 格式（`mcpServers` 结构）
  - Codex: TOML 格式（`[mcp_servers.xxx]` 结构）在 `.codex/config.toml`

## 🔧 命令参考

### `acp login`

登录并保存 CLI Token。

**示例**：
```bash
acp login
```

### `acp apply`

拉取并应用配置到本地项目。

**选项**：
- `-t, --type <type>`：资源类型（目前仅支持 `solution`）
- `-i, --ide <ide>`：AI IDE 类型（`vscode`|`cursor`|`codex`|`claude-code`|`codebuddy`|`qoder`）
- `-d, --dir <path>`：目标目录（默认为当前目录）

**示例**：
```bash
# 基本用法
acp apply

# 指定 IDE
acp apply --ide cursor

# 指定目录
acp apply --dir ~/my-project

# 完整命令
acp apply --type solution --ide vscode --dir ./project
```

### `acp locale`

切换 CLI 界面语言。

**示例**：
```bash
# 打开语言选择菜单
acp locale
```

**支持的语言**：
- `zh-CN`：简体中文
- `en-US`：English

## 🛠️ 开发

### 项目结构

```
acp/cli/
├── bin/                  # 可执行文件入口
│   └── acp.js
├── src/
│   ├── commands/         # 命令实现
│   │   ├── login.ts      # 登录命令
│   │   ├── apply.ts      # 应用配置命令
│   │   └── locale.ts     # 语言切换命令
│   ├── api/              # API 客户端
│   │   └── client.ts
│   ├── config/           # 配置管理
│   │   ├── token.ts      # Token 存储
│   │   └── locale.ts     # 语言配置
│   ├── i18n/             # 国际化
│   │   ├── index.ts      # i18n 工具函数
│   │   ├── zh-CN.ts      # 中文语言包
│   │   └── en-US.ts      # 英文语言包
│   ├── apply/            # 配置应用
│   │   └── writer.ts     # 文件写入逻辑
│   ├── utils/            # 工具函数
│   │   ├── logger.ts     # 日志工具
│   │   ├── ide-mapper.ts # IDE 路径映射
│   │   └── pagination.ts # 分页工具
│   ├── types/            # 类型定义
│   │   └── index.ts
│   └── index.ts          # 主入口
├── docs/                 # 文档
│   └── i18n.md           # 多语言支持文档
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

### 技术栈

- **运行时**：Node.js 18+
- **语言**：TypeScript 5.x
- **命令解析**：Commander.js
- **交互提示**：Inquirer.js
- **HTTP 客户端**：Axios
- **终端样式**：Chalk
- **进度动画**：Ora
- **文件操作**：fs-extra
- **构建工具**：tsup

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（使用 tsx 直接运行）
pnpm dev

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck

# 运行测试
pnpm test
```

## 🌐 API 服务

ACP CLI 连接到 ACP 平台的后端 API 服务：
- **认证方式**：通过 `X-CLI-TOKEN` HTTP Header 携带 Token

## 🐛 问题反馈

遇到问题？请提交 Issue：

- GitHub Issues: https://github.com/AIConfigPlaza/acp/issues
- 
---

**Made with ❤️ by AIConfigPlaza Team**
