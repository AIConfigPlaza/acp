namespace ACP.Domain.Entities;

public enum UserRole
{
    User,
    Admin
}

public enum Theme
{
    Light,
    Dark,
    System
}

public enum ConfigFormat
{
    Markdown,
    Yaml,
    Json
}

public enum AiTool
{
    ClaudeCode,
    Copilot,
    Codex,
    Cursor,
    Aider,
    Custom
}