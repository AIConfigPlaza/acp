using ACP.Domain.Entities;
using System.Text.Json.Serialization;

namespace ACP.Application.Auth;

public interface IGitHubAuthService
{
    Task<string> ExchangeCodeForTokenAsync(string code, string? redirectUri = null, CancellationToken cancellationToken = default);
    Task<GitHubUser> GetGitHubUserAsync(string accessToken);
    Task<User> AuthenticateUserAsync(GitHubUser gitHubUser);
}

public class GitHubUser
{
    [JsonPropertyName("id")]
    public int Id { get; set; }
    
    [JsonPropertyName("login")]
    public string Login { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string? Email { get; set; }
    
    [JsonPropertyName("avatar_url")]
    public string AvatarUrl { get; set; } = string.Empty;
    
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    
    [JsonPropertyName("bio")]
    public string? Bio { get; set; }
}