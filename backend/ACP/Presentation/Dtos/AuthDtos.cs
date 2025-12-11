namespace ACP.Presentation.Dtos;

/// <summary>
/// Auth login response
/// </summary>
public record AuthResponseDto(
    string Token,
    string RefreshToken,
    UserDto User
);

/// <summary>
/// Token refresh response
/// </summary>
public record RefreshTokenResponseDto(
    string AccessToken,
    string RefreshToken
);

/// <summary>
/// Token validation response
/// </summary>
public record ValidateTokenDto(Guid UserId);
