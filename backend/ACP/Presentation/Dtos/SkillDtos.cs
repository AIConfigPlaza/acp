using System.ComponentModel.DataAnnotations;
using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// Skill DTO for list responses
/// </summary>
public record SkillDto(
    Guid Id,
    string Name,
    string SkillMarkdown,
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
/// Skill DTO for detail responses with full related data
/// </summary>
public record SkillDetailDto(
    Guid Id,
    string Name,
    string SkillMarkdown,
    List<string> Tags,
    bool IsPublic,
    int Downloads,
    int Likes,
    decimal Rating,
    bool IsLikedByCurrentUser,
    UserSummaryDto Author,
    List<SkillResourceDto> SkillResources,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// Skill DTO for like response
/// </summary>
public record SkillLikeDto(int Likes, bool IsLiked);

/// <summary>
/// Request DTO for creating a Skill
/// </summary>
public record CreateSkillRequest(
    [Required] string Name,
    [Required] string SkillMarkdown,
    List<string>? Tags,
    bool IsPublic = true,
    List<CreateSkillResourceRequest>? SkillResources = null
);

/// <summary>
/// Request DTO for creating a SkillResource
/// </summary>
public record CreateSkillResourceRequest(
    [Required] string RelativePath,
    [Required] string FileName,
    [Required] string FileContent
);

/// <summary>
/// Request DTO for updating a Skill
/// </summary>
public record UpdateSkillRequest(
    string? Name,
    string? SkillMarkdown,
    List<string>? Tags,
    bool? IsPublic,
    List<CreateSkillResourceRequest>? SkillResources = null
);
