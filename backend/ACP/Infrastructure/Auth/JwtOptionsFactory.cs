using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ACP.Infrastructure.Auth;

public static class JwtOptionsFactory
{
    public static TokenValidationParameters Create(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is required");
        var issuer = configuration["Jwt:Issuer"];
        var audience = configuration["Jwt:Audience"];

        // 验证密钥长度：HS256 需要至少 128 位（16 字节）
        var keyBytes = Encoding.UTF8.GetBytes(key);
        if (keyBytes.Length < 16)
        {
            throw new InvalidOperationException(
                $"JWT key must be at least 16 characters (128 bits) for HS256 algorithm. " +
                $"Current key length: {keyBytes.Length * 8} bits ({keyBytes.Length} bytes). " +
                $"Please configure a longer Jwt:Key in appsettings.json or environment variables.");
        }

        return new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrWhiteSpace(issuer),
            ValidateAudience = !string.IsNullOrWhiteSpace(audience),
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    }
}