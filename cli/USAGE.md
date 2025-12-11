# ACP CLI 使用说明

## 📦 安装方式

### 本地开发安装

```bash
# 1. 克隆仓库
git clone https://github.com/AIConfigPlaza/acp.git
cd acp/cli

# 2. 安装依赖
pnpm install

# 3. 构建项目
pnpm build

# 4. 全局链接（用于本地测试）
npm link
```

### 全局安装（发布后）

```bash
npm install -g @ai-config-plaza/acp-cli
# 或
pnpm add -g @ai-config-plaza/acp-cli
```

## 🚀 快速开始

### 1. 登录

首次使用需要登录，系统会提示输入 CLI Token：

```bash
acp login
```

**交互过程：**
```
🔐 ACP CLI 登录

? 请输入 CLI Token: ****************************************
✓ 登录成功！Token 已保存到 ~/.acp/token

提示: 现在可以使用 acp fetch 命令拉取配置
```

Token 存储位置：
- Windows: `C:\Users\<用户名>\.acp\token`
- macOS/Linux: `~/.acp/token`

### 2. 切换语言（可选）

ACP CLI 支持中文和英文界面切换：

```bash
# 打开语言选择菜单
acp locale
```

**支持的语言：**
- `zh-CN`: 简体中文（默认）
- `en-US`: English

**通过环境变量设置：**
```bash
# Windows PowerShell
$env:ACP_CLI_LOCALE = "en-US"

# macOS/Linux
export ACP_CLI_LOCALE=en-US
```

### 3. 应用配置

登录后即可拉取并应用配置到项目：

```bash
# 基本用法（在当前目录）
acp apply

# 指定 IDE 类型
acp apply --ide cursor

# 指定目标目录
acp apply --dir ~/my-project

# 完整命令
acp apply --ide vscode --dir ./my-app
```

**交互流程：**

#### Step 1: 选择资源类型
```
🚀 ACP 配置应用

? 请选择资源类型: (Use arrow keys)
❯ 解决方案 (Solution)
  Agent 配置 (暂不支持)
  Prompt (暂不支持)
  MCP 配置 (暂不支持)
```

#### Step 2: 搜索配置
```
✓ 获取到 42 个解决方案

? 搜索解决方案 (按名称搜索，留空显示全部): python
```

#### Step 3: 选择配置（分页显示，每页 20 条）
```
? 选择解决方案 (第 1/3 页): (Use arrow keys)
❯ Python Web 开发解决方案 - 包含 FastAPI、Flask 等框架配置
  Python 数据分析方案 - Pandas、NumPy、Matplotlib 工具集
  Python 自动化测试 - pytest、unittest 完整配置
  >>> 下一页
  取消
```

#### Step 4: 选择 IDE 类型
```
? 请选择 AI IDE 类型: (Use arrow keys)
❯ VS Code
  Cursor
  Codex
  Claude Code
```

#### Step 5: 确认覆盖（如果文件已存在）
```
📦 应用解决方案: Python Web 开发解决方案

→ 写入 Agent 配置: AGENTS.md
? 文件 AGENTS.md 已存在，是否覆盖? (Y/n)

→ 写入 2 个 Prompt 配置到: .github/prompts
? Prompt api-design.prompt.md 已存在，是否覆盖? (Y/n)
✓ 已写入: .github/prompts/api-design.prompt.md
✓ 已写入: .github/prompts/error-handling.prompt.md

→ 写入 MCP 配置: mcp.json
✓ 已写入: mcp.json

✨ 解决方案 Python Web 开发解决方案 应用成功！

配置已应用到: D:\projects\my-app
```

## 📁 配置输出说明

### VS Code
```
my-project/
├── .github/
│   └── prompts/
│       ├── xxx.prompt.md
│       └── yyy.prompt.md
├── .vscode/
│   └── mcp.json
└── AGENTS.md
```

### Cursor
```
my-project/
├── .cursor/
│   ├── commands/
│   │   ├── xxx.prompt.md
│   │   └── yyy.prompt.md
│   └── mcp.json
└── AGENTS.md
```

### Codex
```
~/.codex/
└── prompts/
    ├── xxx.prompt.md
    └── yyy.prompt.md

my-project/
├── .codex/
│   └── config.toml
└── AGENTS.md
```

### Claude Code
```
my-project/
├── .claude/
│   └── commands/
│       ├── xxx.prompt.md
│       └── yyy.prompt.md
├── .mcp.json
└── AGENTS.md
```

### MCP 配置格式说明

**JSON 格式（VS Code）：**
```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token"
      }
    }
  }
}
```

**JSON 格式（Cursor/Claude Code）：**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token"
      }
    }
  }
}
```

**TOML 格式（Codex）：**
```toml
[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/path"]

[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "your_token" }
```

## 🔧 高级用法

### 环境变量配置

**Token 配置：**

可以通过环境变量设置 Token，避免每次登录：

**Windows PowerShell:**
```powershell
$env:ACP_CLI_TOKEN = "your-token-here"
```

**Windows CMD:**
```cmd
set ACP_CLI_TOKEN=your-token-here
```

**macOS/Linux:**
```bash
export ACP_CLI_TOKEN="your-token-here"
```

**语言配置：**

可以通过环境变量设置界面语言：

**Windows PowerShell:**
```powershell
$env:ACP_CLI_LOCALE = "en-US"  # 英文
$env:ACP_CLI_LOCALE = "zh-CN"  # 中文
```

**macOS/Linux:**
```bash
export ACP_CLI_LOCALE=en-US  # 英文
export ACP_CLI_LOCALE=zh-CN  # 中文
```

### 批量应用

可以编写脚本批量应用配置到多个项目：

```bash
# apply-to-all.sh
#!/bin/bash

projects=("project1" "project2" "project3")

for project in "${projects[@]}"; do
  echo "Applying config to $project..."
  acp apply --ide vscode --dir "./$project"
done
```

### CI/CD 集成

在 CI/CD 流程中自动应用配置：

```yaml
# .github/workflows/apply-config.yml
name: Apply ACP Config

on:
  push:
    branches: [main]

jobs:
  apply:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install ACP CLI
        run: npm install -g acp-cli
      
      - name: Apply Config
        env:
          ACP_CLI_TOKEN: ${{ secrets.ACP_CLI_TOKEN }}
        run: acp apply --ide vscode --dir .
```

## 🐛 故障排查

### 1. 登录失败

**问题：** Token 无效或格式错误

**解决方案：**
- 检查 Token 是否正确复制（无多余空格）
- 确认 Token 未过期
- 重新获取 Token

### 2. 网络错误

**问题：** `网络错误，请检查网络连接`

**解决方案：**
- 检查网络连接
- 检查代理设置

## 📝 命令参考

### `acp login`

登录并保存 CLI Token。

**用法：**
```bash
acp login
```

**说明：**
- Token 保存在 `~/.acp/token`
- 可通过 `ACP_CLI_TOKEN` 环境变量覆盖

---

### `acp locale`

切换 CLI 界面语言。

**用法：**
```bash
acp locale
```

**交互过程：**
```
🌐 语言设置

当前语言: 简体中文

? 请选择语言:
  ❯ 简体中文 (当前 / Current)
    English
```

**说明：**
- 支持中文（zh-CN）和英文（en-US）
- 语言配置保存在 `~/.acp/locale`
- 可通过 `ACP_CLI_LOCALE` 环境变量覆盖
- 切换后立即生效，无需重启

**示例：**
```bash
# 通过命令切换（持久化）
acp locale

# 通过环境变量临时切换
$env:ACP_CLI_LOCALE = "en-US"
acp apply
```

---

### `acp apply`
## 📝 命令参考

### `acp login`

登录并保存 CLI Token。

**用法：**
```bash
---

### `acp --version`

显示 CLI 版本号。

**用法：**
```bash
acp --version
# 或
acp -v
```

---

### `acp --help`

显示帮助信息。

**用法：**
```bash
acp --help
# 或
acp -h

# 查看特定命令帮助
acp login --help
acp apply --help
acp locale --help
```

## 🌐 多语言支持

ACP CLI 支持完整的中英文双语界面。

### 快速切换

**方法 1: 使用 locale 命令（推荐）**
```bash
acp locale
# 在交互界面中选择语言
```

**方法 2: 环境变量**
```bash
# 临时切换为英文
$env:ACP_CLI_LOCALE = "en-US"
acp --help

# 临时切换为中文
$env:ACP_CLI_LOCALE = "zh-CN"
acp --help
```

### 配置优先级

1. 环境变量 `ACP_CLI_LOCALE`（最高优先级）
2. 本地配置文件 `~/.acp/locale`
3. 默认语言 `zh-CN`

### 更多信息

详细的多语言功能说明，请查看：
- [多语言支持文档](docs/i18n.md)
- [使用示例](docs/i18n-examples.md)

## 🔗 相关链接
# 基本用法
acp apply

# 指定 IDE
acp apply --ide cursor

# 指定目录
acp apply --dir ~/my-project

# 完整命令
acp apply --type solution --ide vscode --dir ./app
```

---

### `acp --version`

显示 CLI 版本号。

```bash
acp --version
# 或
acp -v
```

---

### `acp --help`

显示帮助信息。

```bash
acp --help
# 或
acp -h
```

## 🔗 相关链接

- GitHub 仓库: https://github.com/AIConfigPlaza/acp-cli
- 问题反馈: https://github.com/AIConfigPlaza/acp-cli/issues

## 📄 许可证

MIT License
