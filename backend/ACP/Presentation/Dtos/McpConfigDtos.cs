using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// MCP config DTO for list responses
/// </summary>
public record McpConfigDto(
    Guid Id,
    string Name,
    string Description,
    string ConfigJson,
    List<string> Tags,
    bool IsPublic,
    int Downloads,
    int Likes,
    decimal Rating,
    bool IsLikedByCurrentUser,
    UserSummaryDto Author,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// MCP config DTO for like response
/// </summary>
public record McpLikeDto(int Likes, bool IsLiked);
