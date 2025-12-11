namespace ACP.Presentation.Dtos;

/// <summary>
/// CLI 令牌 DTO
/// </summary>
public record CliTokenDto(
    Guid Id,
    string Token,
    DateTime CreatedAt,
    DateTime? LastUsedAt
);
