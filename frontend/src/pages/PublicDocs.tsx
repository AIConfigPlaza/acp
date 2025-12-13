import { BookOpen, Terminal, Server, Bot, FileText, GitBranch, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

export default function PublicDocs() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Documentation",
      subtitle: "Everything you need to know about ACP",
      backHome: "Back to Home",
      cli: "CLI Tool",
      gettingStarted: "Getting Started",
      gettingStartedDesc: "Learn the basics of ACP and how to set up your first AI configuration.",
      concepts: "Core Concepts",
      conceptsList: [
        { icon: Bot, title: "Agents", desc: "Define AI agent roles, behaviors, and personalities for your workflows." },
        { icon: FileText, title: "Prompts", desc: "Create reusable prompt templates with variables and categories." },
        { icon: Server, title: "MCP Services", desc: "Connect and manage Model Context Protocol services." },
        { icon: GitBranch, title: "Solutions", desc: "Combine agents, prompts, and services into complete workflows." },
      ],
      guides: "Guides",
      guidesList: [
        { title: "Quick Start Guide", desc: "Get up and running with ACP in 5 minutes", link: "#" },
        { title: "CLI Installation", desc: "Install and configure the ACP command line tool", link: "/cli" },
        { title: "Creating Your First Agent", desc: "Step-by-step guide to creating an AI agent", link: "#" },
        { title: "Building Solutions", desc: "Learn how to combine components into workflows", link: "#" },
      ],
      apiReference: "API Reference",
      apiDesc: "Complete API documentation for integrating ACP into your applications.",
      viewApi: "View API Docs",
      faq: "FAQ",
      faqList: [
        { q: "What is ACP?", a: "ACP (AI Config Plaza) is a platform for managing AI configurations, including agents, prompts, and MCP services." },
        { q: "How do I sync configurations locally?", a: "Use the ACP CLI tool to pull configurations to your local development environment." },
        { q: "Can I share configurations with my team?", a: "Yes! You can add your configurations on the website and set them as public." },
        { q: "What AI tools are supported?", a: "ACP supports Cursor, Claude, and other AI development tools." },
      ],
    },
    zh: {
      title: "文档中心",
      subtitle: "关于 ACP 您需要知道的一切",
      backHome: "返回首页",
      cli: "命令行工具",
      gettingStarted: "快速入门",
      gettingStartedDesc: "了解 ACP 的基础知识以及如何设置您的第一个 AI 配置。",
      concepts: "核心概念",
      conceptsList: [
        { icon: Bot, title: "Agents", desc: "为您的工作流定义 AI Agent 的角色、行为和个性。" },
        { icon: FileText, title: "提示词", desc: "创建带有变量和分类的可复用提示词模板。" },
        { icon: Server, title: "MCP 服务", desc: "连接和管理模型上下文协议服务。" },
        { icon: GitBranch, title: "Solutions", desc: "将 Agents、提示词和服务组合成完整的工作流。" },
      ],
      guides: "使用指南",
      guidesList: [
        { title: "快速开始指南", desc: "5 分钟内开始使用 ACP", link: "#" },
        { title: "CLI 安装", desc: "安装和配置 ACP 命令行工具", link: "/cli" },
        { title: "创建您的第一个 Agent", desc: "创建 AI Agent 的分步指南", link: "#" },
        { title: "构建 Solutions", desc: "学习如何将组件组合成工作流", link: "#" },
      ],
      apiReference: "API 参考",
      apiDesc: "将 ACP 集成到您的应用程序的完整 API 文档。",
      viewApi: "查看 API 文档",
      faq: "常见问题",
      faqList: [
        { q: "什么是 ACP？", a: "ACP（AI Config Plaza）是一个用于管理 AI 配置的平台，包括 Agents、提示词和 MCP 服务。" },
        { q: "如何在本地同步配置？", a: "使用 ACP CLI 工具将配置拉取到本地开发环境。" },
        { q: "我可以与团队共享配置吗？", a: "可以！您可以在网站添加您的配置并设置公开。" },
        { q: "支持哪些 AI 工具？", a: "ACP 支持 Cursor、Claude 和其他 AI 开发工具。" },
      ],
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/cli">
              <Button variant="ghost" size="sm">
                <Terminal size={16} className="mr-2" />
                {t.cli}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm">{t.backHome}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6 bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <BookOpen size={18} />
            <span className="text-sm font-medium">Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t.title}</h1>
          <p className="text-xl text-muted-foreground">{t.subtitle}</p>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t.gettingStarted}</h2>
            <p className="text-muted-foreground mb-6">{t.gettingStartedDesc}</p>
            <div className="flex gap-4">
              <Button asChild>
                <Link to="/cli">
                  <Terminal size={16} className="mr-2" />
                  {t.cli}
                </Link>
              </Button>
              <Button variant="outline">
                {language === "zh" ? "查看教程" : "View Tutorial"}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Concepts */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.concepts}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.conceptsList.map((concept, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <concept.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{concept.title}</h3>
                <p className="text-muted-foreground">{concept.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.guides}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {t.guidesList.map((guide, index) => (
              <Link
                key={index}
                to={guide.link}
                className="p-5 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{guide.desc}</p>
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">{t.apiReference}</h2>
              <p className="text-muted-foreground">{t.apiDesc}</p>
            </div>
            <Button variant="outline" asChild>
              <a href="#" target="_blank" rel="noopener noreferrer">
                {t.viewApi}
                <ExternalLink size={14} className="ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">{t.faq}</h2>
          <div className="space-y-4">
            {t.faqList.map((item, index) => (
              <div key={index} className="p-5 rounded-xl border border-border/50 bg-card">
                <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          © 2024 ACP - AI Config Plaza. All rights reserved.
        </div>
      </footer>
    </div>
  );
}