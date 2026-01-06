using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// CLI 专用 Solution 列表项 DTO
/// </summary>
public record CliSolutionDto(
    Guid Id,
    string Name,
    string Description,
    AiTool AiTool,
    Guid AgentConfigId,
    List<string> Tags,
    bool IsPublic,
    bool IsOwner,
    bool IsLiked,
    int Downloads,
    int Likes,
    decimal Rating,
    Compatibility Compatibility,
    UserSummaryDto Author,
    CliAgentConfigDto? AgentConfig,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// CLI 专用 Solution 详情 DTO（包含完整关联数据）
/// </summary>
public record CliSolutionDetailDto(
    Guid Id,
    string Name,
    string Description,
    AiTool AiTool,
    Guid AgentConfigId,
    List<string> Tags,
    bool IsPublic,
    bool IsOwner,
    bool IsLiked,
    int Downloads,
    int Likes,
    decimal Rating,
    Compatibility Compatibility,
    UserSummaryDto Author,
    CliAgentConfigDto? AgentConfig,
    List<CliMcpConfigDto> McpConfigs,
    List<CliCustomPromptDto> CustomPrompts,
    List<CliSkillDto> Skills,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// CLI 专用 Agent 配置 DTO
/// </summary>
public record CliAgentConfigDto(
    Guid Id,
    string Name,
    string Description,
    string Content,
    ConfigFormat Format,
    List<string> Tags,
    bool IsPublic,
    bool IsOwner,
    bool IsLiked,
    int Downloads,
    int Likes,
    decimal Rating,
    UserSummaryDto Author,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// CLI 专用 Prompt DTO
/// </summary>
public record CliCustomPromptDto(
    Guid Id,
    string Name,
    string Description,
    string Content,
    List<string> Tags,
    bool IsPublic,
    bool IsOwner,
    bool IsLiked,
    int Downloads,
    int Likes,
    decimal Rating,
    UserSummaryDto Author,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// CLI 专用 MCP 配置 DTO
/// </summary>
public record CliMcpConfigDto(
    Guid Id,
    string Name,
    string Description,
    string ConfigJson,
    List<string> Tags,
    bool IsPublic,
    bool IsOwner,
    bool IsLiked,
    int Downloads,
    int Likes,
    decimal Rating,
    UserSummaryDto Author,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// CLI 专用 SkillResource DTO
/// </summary>
public record CliSkillResourceDto(
    Guid Id,
    Guid SkillId,
    string RelativePath,
    string FileName,
    string FileContent,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// CLI 专用 Skill DTO
/// </summary>
public record CliSkillDto(
    Guid Id,
    string Name,
    string SkillMarkdown,
    List<string> Tags,
    bool IsPublic,
    bool IsOwner,
    bool IsLiked,
    int Downloads,
    int Likes,
    decimal Rating,
    UserSummaryDto Author,
    List<CliSkillResourceDto> SkillResources,
    DateTime CreatedAt,
    DateTime UpdatedAt
);