using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// Solution DTO for list responses
/// </summary>
public record SolutionDto(
    Guid Id,
    string Name,
    string Description,
    AiTool AiTool,
    Guid AgentConfigId,
    List<string> Tags,
    bool IsPublic,
    int Downloads,
    int Likes,
    decimal Rating,
    bool IsLikedByCurrentUser,
    Compatibility Compatibility,
    UserSummaryDto Author,
    AgentConfigDto? AgentConfig,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// Solution DTO for detail responses with full related data
/// </summary>
public record SolutionDetailDto(
    Guid Id,
    string Name,
    string Description,
    AiTool AiTool,
    Guid AgentConfigId,
    List<string> Tags,
    bool IsPublic,
    int Downloads,
    int Likes,
    decimal Rating,
    bool IsLikedByCurrentUser,
    Compatibility Compatibility,
    UserSummaryDto Author,
    AgentConfigDto? AgentConfig,
    List<McpConfigDto> McpConfigs,
    List<CustomPromptDto> CustomPrompts,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// Solution DTO for like response
/// </summary>
public record SolutionLikeDto(int Likes, bool IsLiked);

/// <summary>
/// Solution DTO for apply response
/// </summary>
public record SolutionApplyDto(Guid Applied);
