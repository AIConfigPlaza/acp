using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace ACP.Infrastructure.Auth;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TokenService> _logger;
    private readonly AppDbContext _dbContext;

    public TokenService(IConfiguration configuration, ILogger<TokenService> logger, AppDbContext dbContext)
    {
        _configuration = configuration;
        _logger = logger;
        _dbContext = dbContext;
    }

    public string GenerateJwtToken(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is required");
        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
        
        // 验证密钥长度：HS256 需要至少 128 位（16 字节）
        if (keyBytes.Length < 16)
        {
            throw new InvalidOperationException(
                $"JWT key must be at least 16 characters (128 bits) for HS256 algorithm. " +
                $"Current key length: {keyBytes.Length * 8} bits ({keyBytes.Length} bytes). " +
                $"Please configure a longer Jwt:Key in appsettings.json or environment variables.");
        }

        var key = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }

    public ClaimsPrincipal? ValidateJwtToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var parameters = JwtOptionsFactory.Create(_configuration);
            return tokenHandler.ValidateToken(token, parameters, out _);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to validate JWT token");
            return null;
        }
    }

    public string GenerateApiToken(User user)
    {
        var token = $"{user.Id:N}-{Guid.NewGuid():N}";
        user.ApiToken = token;
        return token;
    }

    public async Task<(string AccessToken, string RefreshToken)?> RefreshTokenAsync(string refreshToken)
    {
        try
        {
            // 查找具有该刷新令牌的用户
            var user = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

            if (user == null)
            {
                _logger.LogWarning("Refresh token not found");
                return null;
            }

            // 验证刷新令牌是否过期
            if (user.RefreshTokenExpiresAt == null || user.RefreshTokenExpiresAt <= DateTime.UtcNow)
            {
                _logger.LogWarning("Refresh token expired for user {UserId}", user.Id);
                return null;
            }

            // 生成新的JWT令牌和刷新令牌
            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            // 更新用户的刷新令牌
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30);
            user.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation("Successfully refreshed token for user {UserId}", user.Id);
            return (newAccessToken, newRefreshToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh token");
            return null;
        }
    }
}