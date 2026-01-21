import { Terminal, Copy, Check, ArrowRight, Download, Command, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import ReactMarkdown from "react-markdown";

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-foreground">{code}</code>
      </pre>
    </div>
  );
}

export default function PublicCLI() {
  const { language } = useLanguage();
  const [usageContent, setUsageContent] = useState<string>("");
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [usageError, setUsageError] = useState<string | null>(null);

  // Fetch USAGE.md from GitHub
  useEffect(() => {
    setIsLoadingUsage(true);
    setUsageError(null);
    fetch("https://raw.githubusercontent.com/AIConfigPlaza/acp/main/cli/USAGE.md")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        setUsageContent(text);
        setIsLoadingUsage(false);
      })
      .catch((err) => {
        console.error("Failed to fetch USAGE.md:", err);
        setUsageError(err instanceof Error ? err.message : "Failed to load documentation");
        setIsLoadingUsage(false);
      });
  }, []);

  const content = {
    en: {
      title: "ACP CLI Tool",
      subtitle: "Sync AI configurations to your local development environment",
      heroTitle: "Command Line Interface",
      heroDesc: "The ACP CLI allows you to sync your AI configurations directly to your local development environment. Pull solutions, agents, prompts, MCP configurations, and skills with a single command.",
      viewGithub: "View on GitHub",
      getStarted: "Get Started",
      installation: "Installation",
      quickStart: "Quick Start",
      commands: "Available Commands",
      structure: "Generated Structure",
      features: "Features",
      featureList: [
        { title: "One-Click Sync", desc: "Pull complete AI configurations with a single command" },
        { title: "Team Sharing", desc: "Share configurations across your team seamlessly" },
        { title: "Easy Integration", desc: "Seamlessly integrate AI configs into your development workflow" },
        { title: "Cross-Platform", desc: "Works on Windows, macOS, and Linux" },
      ],
      backHome: "Back to Home",
      docs: "Documentation",
      loadingDocs: "Loading documentation...",
      failedToLoad: "Failed to load documentation",
      retry: "Retry",
      cliUsageDocs: "CLI Usage Documentation",
      viewOnGitHub: "View on GitHub",
    },
    zh: {
      title: "ACP 命令行工具",
      subtitle: "将 AI 配置同步到本地开发环境",
      heroTitle: "命令行界面",
      heroDesc: "ACP CLI 允许您将 AI 配置直接同步到本地开发环境。只需一个命令即可拉取方案、Agent、提示词、MCP 配置和 Skills。",
      viewGithub: "在 GitHub 查看",
      getStarted: "开始使用",
      installation: "安装",
      quickStart: "快速开始",
      commands: "可用命令",
      structure: "生成的目录结构",
      features: "功能特性",
      featureList: [
        { title: "一键同步", desc: "一个命令拉取完整的 AI 配置" },
        { title: "团队共享", desc: "无缝在团队间共享配置" },
        { title: "轻松集成", desc: "无缝将 AI 配置集成到开发工作流中" },
        { title: "跨平台支持", desc: "支持 Windows、macOS 和 Linux" },
      ],
      backHome: "返回首页",
      docs: "文档",
      loadingDocs: "加载文档中...",
      failedToLoad: "无法加载文档",
      retry: "重试",
      cliUsageDocs: "CLI 使用文档",
      viewOnGitHub: "在 GitHub 查看",
    },
  };

  const t = content[language];

  const codeBlocks = [
    { title: t.installation, code: "npm install -g acp-cli" },
    { title: t.quickStart, code: `acp init\n# Enter your ACP token when prompted\n# Select a plan to sync` },
    { title: "acp list", code: "acp list plans     # List all available plans\nacp list agents    # List all agents\nacp list prompts   # List all prompts" },
    { title: "acp pull", code: "acp pull <plan-name>    # Pull a specific plan\nacp pull --all          # Pull all configurations" },
    { title: "acp auth", code: "acp whoami              # Check current auth status\nacp login               # Login to ACP\nacp logout              # Logout from ACP" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/docs">
              <Button variant="ghost" size="sm">
                <BookOpen size={16} className="mr-2" />
                {t.docs}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm">{t.backHome}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Terminal size={18} />
            <span className="text-sm font-medium">CLI Tool</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t.title}</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t.subtitle}</p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href="https://github.com/AIConfigPlaza/acp" target="_blank" rel="noopener noreferrer">
                <Download size={18} className="mr-2" />
                {t.getStarted}
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="https://github.com/AIConfigPlaza/acp" target="_blank" rel="noopener noreferrer">
                {t.viewGithub}
                <ArrowRight size={16} className="ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">{t.features}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.featureList.map((feature, index) => (
              <div key={index} className="p-6 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Command size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation from USAGE.md */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">{t.docs}</h2>
          {isLoadingUsage ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t.loadingDocs}</span>
            </div>
          ) : usageError ? (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="text-destructive mb-2">{t.failedToLoad}</p>
              <p className="text-sm text-muted-foreground">{usageError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setIsLoadingUsage(true);
                  setUsageError(null);
                  fetch("https://raw.githubusercontent.com/AIConfigPlaza/acp/main/cli/USAGE.md")
                    .then((res) => {
                      if (!res.ok) {
                        throw new Error(`Failed to fetch: ${res.status}`);
                      }
                      return res.text();
                    })
                    .then((text) => {
                      setUsageContent(text);
                      setIsLoadingUsage(false);
                    })
                    .catch((err) => {
                      console.error("Failed to fetch USAGE.md:", err);
                      setUsageError(err instanceof Error ? err.message : t.failedToLoad);
                      setIsLoadingUsage(false);
                    });
                }}
              >
                {t.retry}
              </Button>
            </div>
          ) : usageContent ? (
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="px-6 py-4 bg-muted/50 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">{t.cliUsageDocs}</span>
                  <a
                    href="https://github.com/AIConfigPlaza/acp/blob/main/cli/USAGE.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {t.viewOnGitHub}
                  </a>
                </div>
              </div>
              <div className="p-6 prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                <ReactMarkdown
                  components={{
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <div className="rounded-lg overflow-hidden border border-border/50 bg-muted/50 my-4">
                          <div className="px-4 py-2 bg-muted border-b border-border/50 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">{match[1]}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => {
                                navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                              }}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                          <pre className="p-4 overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {usageContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
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