using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

/// <summary>
/// User summary info for embedding in other DTOs
/// </summary>
public record UserSummaryDto(
    Guid Id,
    string Username,
    string AvatarUrl
);

/// <summary>
/// Full user info for user endpoints
/// </summary>
public record UserDto(
    Guid Id,
    string Username,
    string Email,
    string AvatarUrl,
    string Bio,
    UserRole Role,
    UserSettingsDto Settings,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

/// <summary>
/// User settings
/// </summary>
public record UserSettingsDto(
    Theme Theme,
    bool NotificationsEnabled
);
