using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// SkillResource DTO for responses
/// </summary>
public record SkillResourceDto(
    Guid Id,
    Guid SkillId,
    string RelativePath,
    string FileName,
    string FileContent,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
