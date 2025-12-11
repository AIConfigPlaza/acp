using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// Custom prompt DTO for responses
/// </summary>
public record CustomPromptDto(
    Guid Id,
    string Name,
    string Description,
    string Content,
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
/// Custom prompt DTO for like response
/// </summary>
public record PromptLikeDto(int Likes, bool IsLiked);
