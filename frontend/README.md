# AI Config Plaza (ACP)

> 一个用于管理和共享 AI 配置的平台，支持 Agents、Prompts、MCP Services 和 Solutions 的统一管理。

## 📋 项目简介

AI Config Plaza (ACP) 是一个现代化的 AI 配置管理平台，帮助开发者：

- 🤖 **管理 AI Agents** - 创建和管理 AI 代理配置
- 📝 **管理 Prompts** - 创建和共享提示词模板
- 🔌 **管理 MCP Services** - 配置 Model Context Protocol 服务
- 🎯 **创建 Solutions** - 组合 Agents、Prompts 和 MCP Services 创建完整的解决方案
- 🌐 **共享配置** - 公开分享配置供社区使用
- 📊 **统计分析** - 查看配置的下载量、点赞数和评分

## ✨ 主要功能

- 🏠 **首页探索** - 浏览和搜索所有公开的配置
- 📦 **个人仪表板** - 管理自己的配置和查看统计信息
- 🔍 **智能搜索** - 支持按名称、描述、标签搜索
- ⭐ **点赞收藏** - 收藏喜欢的配置
- 📥 **一键下载** - 快速获取配置到本地
- 🌍 **多语言支持** - 支持中文和英文
- 🎨 **现代化 UI** - 基于 shadcn/ui 和 Tailwind CSS 的美观界面

## 🚀 快速开始

### 前置要求

- Node.js >= 18.x
- npm >= 9.x 或 yarn >= 1.22.x

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node.js 版本：

```bash
# 安装 Node.js 18
nvm install 18
nvm use 18
```

### 安装步骤

```bash
# 1. 克隆仓库
git clone <YOUR_GIT_URL>
cd ai-config-plaza

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选，开发环境有默认值）
cp .env.example .env.local

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 查看应用。

## ⚙️ 环境变量配置

### 环境变量说明

项目已配置默认的后端 API 地址，无需配置即可使用。如需覆盖或本地开发，可在项目根目录创建 `.env.local` 文件（此文件不会被提交到 git）：

```env
# 后端 API 基础 URL（可选）
# 默认值: https://api.ai-config-plaza.com
# 本地开发示例: http://localhost:5066 或 http://acp.dev.localhost:5066
VITE_API_BASE_URL=https://api.ai-config-plaza.com

# GitHub OAuth Client ID（必需）
# 在 GitHub Settings > Developer settings > OAuth Apps 中创建应用后获取
VITE_GITHUB_CLIENT_ID=your-github-client-id

# GitHub OAuth 回调地址（可选）
# 如果不设置，默认使用: ${window.location.origin}/auth/callback
VITE_GITHUB_REDIRECT_URI=http://localhost:8080/auth/callback
```

### 默认值

- **VITE_API_BASE_URL**: 默认使用 `https://api.ai-config-plaza.com`
- **VITE_GITHUB_REDIRECT_URI**: 默认使用 `${window.location.origin}/auth/callback`

### GitHub OAuth 配置步骤

1. 访问 [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - **Application name**: 你的应用名称
   - **Homepage URL**: 你的前端地址，例如 `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/auth/callback`（开发环境）或你的生产环境回调地址
4. 创建后，复制 **Client ID** 到 `VITE_GITHUB_CLIENT_ID`
5. 在后端的 `appsettings.json` 中配置 `GitHub:ClientId` 和 `GitHub:ClientSecret`

## 🛠️ 技术栈

### 核心框架

- **[React 18](https://react.dev/)** - UI 框架
- **[TypeScript](https://www.typescriptlang.org/)** - 类型安全
- **[Vite](https://vitejs.dev/)** - 构建工具

### UI 组件库

- **[shadcn/ui](https://ui.shadcn.com/)** - 基于 Radix UI 的组件库
- **[Tailwind CSS](https://tailwindcss.com/)** - 实用优先的 CSS 框架
- **[Lucide React](https://lucide.dev/)** - 图标库

### 状态管理与数据获取

- **[TanStack Query](https://tanstack.com/query)** - 数据获取和缓存
- **[React Router](https://reactrouter.com/)** - 路由管理

### 其他工具

- **[React Hook Form](https://react-hook-form.com/)** - 表单管理
- **[Zod](https://zod.dev/)** - 数据验证
- **[date-fns](https://date-fns.org/)** - 日期处理

## 📁 项目结构

```
ai-config-plaza/
├── public/                 # 静态资源
├── src/
│   ├── components/         # React 组件
│   │   ├── ui/            # shadcn/ui 基础组件
│   │   ├── dialogs/       # 对话框组件
│   │   ├── layout/        # 布局组件
│   │   └── shared/        # 共享组件
│   ├── contexts/          # React Context
│   ├── hooks/             # 自定义 Hooks
│   ├── i18n/              # 国际化配置
│   ├── lib/               # 工具函数和类型定义
│   ├── pages/             # 页面组件
│   └── App.tsx            # 应用入口
├── .env.local             # 环境变量（不提交到 git）
├── package.json           # 项目配置
└── vite.config.ts         # Vite 配置
```

## 📜 可用脚本

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 构建开发版本
npm run build:dev

# 预览生产构建
npm run preview

# 运行 ESLint
npm run lint
```

## 🏗️ 构建与部署

### 开发环境

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 部署

生产环境**必须**配置 `VITE_API_BASE_URL` 环境变量，否则会显示配置错误提示。

## 🔧 开发指南

### 代码规范

项目使用 ESLint 进行代码检查，建议在提交前运行：

```bash
npm run lint
```

### 组件开发

- 使用 TypeScript 编写类型安全的组件
- 遵循 React Hooks 最佳实践
- 使用 shadcn/ui 组件库保持 UI 一致性
- 组件应支持国际化（i18n）

### API 集成

- 使用 `@/lib/api` 中的 `apiRequest` 函数进行 API 调用
- 使用 TanStack Query 管理数据获取和缓存
- 在 `@/hooks` 目录中创建自定义 hooks 封装 API 调用

## 📝 功能模块

### Agents（代理）

- 创建和管理 AI 代理配置
- 支持 Markdown 格式的配置内容
- 支持标签和公开/私有设置

### Prompts（提示词）

- 创建可复用的提示词模板
- 支持分类和标签
- 支持变量和动态内容

### MCP Services

- 配置 Model Context Protocol 服务
- 支持 JSON 格式的配置
- 管理服务连接和认证

### Solutions（解决方案）

- 组合 Agents、Prompts 和 MCP Services
- 创建完整的工作流配置
- 支持多 AI 工具（Cursor、Claude 等）

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🔗 相关链接

- [后端 API 文档](./../acp-backend/)
- [设计文档](./../acp-backend/ACP（AI配置广场）设计文档%20.md)

## 💬 反馈与支持

如有问题或建议，请提交 [Issue](../../issues) 或联系项目维护者。

---

**Made with ❤️ by the ACP Team**
