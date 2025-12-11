using System.Security.Claims;
using ACP.Domain.Entities;

namespace ACP.Application.Auth;

public interface ITokenService
{
    string GenerateJwtToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateJwtToken(string token);
    string GenerateApiToken(User user);
    Task<(string AccessToken, string RefreshToken)?> RefreshTokenAsync(string refreshToken);
}