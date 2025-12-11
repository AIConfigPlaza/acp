using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// Agent config DTO for responses
/// </summary>
public record AgentConfigDto(
    Guid Id,
    string Name,
    string Description,
    string Content,
    ConfigFormat Format,
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
/// Agent config DTO for like response
/// </summary>
public record AgentLikeDto(int Likes, bool IsLiked);
