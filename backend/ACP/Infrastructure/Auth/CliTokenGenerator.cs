using System.Security.Cryptography;

namespace ACP.Infrastructure.Auth;

/// <summary>
/// CLI Token 生成器
/// </summary>
public static class CliTokenGenerator
{
    private const string TokenPrefix = "acp-";
    private const int TokenLength = 64;

    /// <summary>
    /// 生成以 "acp-" 为前缀的64位随机字符串令牌
    /// </summary>
    public static string GenerateToken()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var randomBytes = new byte[TokenLength];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        var result = new char[TokenLength];
        for (int i = 0; i < TokenLength; i++)
        {
            result[i] = chars[randomBytes[i] % chars.Length];
        }

        return TokenPrefix + new string(result);
    }
}
