using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace ACP.Infrastructure.Auth;

public class GitHubAuthService : IGitHubAuthService
{
    private readonly HttpClient _httpClient;
    private readonly AppDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ITokenService _tokenService;
    private readonly ILogger<GitHubAuthService> _logger;

    public GitHubAuthService(HttpClient httpClient, AppDbContext dbContext, IConfiguration configuration, ITokenService tokenService, ILogger<GitHubAuthService> logger)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _configuration = configuration;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<string> ExchangeCodeForTokenAsync(string code, string? redirectUri = null, CancellationToken cancellationToken = default)
    {
        var clientId = _configuration["GitHub:ClientId"];
        var clientSecret = _configuration["GitHub:ClientSecret"];

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new InvalidOperationException("GitHub client credentials are not configured");
        }

        var form = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret,
            ["code"] = code,
        };

        if (!string.IsNullOrWhiteSpace(redirectUri))
        {
            form["redirect_uri"] = redirectUri;
        }

        var content = new FormUrlEncodedContent(form);

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token")
        {
            Content = content,
        };

        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.UserAgent.Add(new ProductInfoHeaderValue("acp", "1.0"));

        var response = await _httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogError("GitHub token exchange failed: {Status} {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException($"GitHub token exchange failed: {response.StatusCode} {errorBody}");
        }

        var tokenResponse = await response.Content.ReadFromJsonAsync<GitHubTokenResponse>(cancellationToken: cancellationToken);

        if (tokenResponse == null || string.IsNullOrWhiteSpace(tokenResponse.AccessToken))
        {
            throw new InvalidOperationException("GitHub did not return an access token");
        }

        return tokenResponse.AccessToken;
    }

    public async Task<GitHubUser> GetGitHubUserAsync(string accessToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
        request.Headers.UserAgent.Add(new ProductInfoHeaderValue("acp", "1.0"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        var response = await _httpClient.SendAsync(request);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("GitHub user fetch failed: {Status} {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException($"GitHub user fetch failed: {response.StatusCode} {errorBody}");
        }

        // 读取原始响应内容用于调试
        var responseBody = await response.Content.ReadAsStringAsync();
        _logger.LogInformation("GitHub API response: {ResponseBody}", responseBody);

        // 使用 JsonSerializerOptions 确保正确反序列化
        var options = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        
        var user = System.Text.Json.JsonSerializer.Deserialize<GitHubUser>(responseBody, options);
        if (user == null)
        {
            _logger.LogError("Failed to deserialize GitHub user from response: {ResponseBody}", responseBody);
            throw new InvalidOperationException("GitHub did not return user information");
        }

        _logger.LogInformation("Parsed GitHub user: Id={Id}, Login={Login}, AvatarUrl={AvatarUrl}", 
            user.Id, user.Login, user.AvatarUrl);

        return user;
    }

    public async Task<User> AuthenticateUserAsync(GitHubUser gitHubUser)
    {
        try
        {
            _logger.LogInformation("Authenticating user: GitHubId={GitHubId}, Login={Login}, AvatarUrl={AvatarUrl}", 
                gitHubUser.Id, gitHubUser.Login, gitHubUser.AvatarUrl);

            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.GitHubId == gitHubUser.Id.ToString());

            if (user != null)
            {
                _logger.LogInformation("Updating existing user: UserId={UserId}, OldAvatarUrl={OldAvatarUrl}, NewAvatarUrl={NewAvatarUrl}", 
                    user.Id, user.AvatarUrl, gitHubUser.AvatarUrl);

                user.Username = gitHubUser.Login;
                user.Email = gitHubUser.Email ?? user.Email;
                // 只有当新的头像 URL 不为空时才更新
                if (!string.IsNullOrWhiteSpace(gitHubUser.AvatarUrl))
                {
                    user.AvatarUrl = gitHubUser.AvatarUrl;
                }
                user.Bio = gitHubUser.Bio ?? user.Bio;
                user.UpdatedAt = DateTime.UtcNow;

                if (string.IsNullOrWhiteSpace(user.ApiToken))
                {
                    _tokenService.GenerateApiToken(user);
                }
                _dbContext.Users.Update(user);
            }
            else
            {
                _logger.LogInformation("Creating new user: Login={Login}, AvatarUrl={AvatarUrl}", 
                    gitHubUser.Login, gitHubUser.AvatarUrl);

                user = new User
                {
                    Id = Guid.NewGuid(),
                    GitHubId = gitHubUser.Id.ToString(),
                    Username = gitHubUser.Login,
                    Email = gitHubUser.Email ?? string.Empty,
                    AvatarUrl = gitHubUser.AvatarUrl ?? string.Empty,
                    Bio = gitHubUser.Bio ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Settings = new UserSettings()
                };

                _tokenService.GenerateApiToken(user);
                _dbContext.Users.Add(user);
                
                // 为新用户自动创建 CLI Token
                var cliToken = new CliToken
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    Token = CliTokenGenerator.GenerateToken(),
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.CliTokens.Add(cliToken);
                
                _logger.LogInformation("Created CLI token for new user: UserId={UserId}", user.Id);
            }

            await _dbContext.SaveChangesAsync();
            
            _logger.LogInformation("User authenticated successfully: UserId={UserId}, AvatarUrl={AvatarUrl}", 
                user.Id, user.AvatarUrl);

            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to authenticate user: GitHubId={GitHubId}, Username={Username}, AvatarUrl={AvatarUrl}", 
                gitHubUser.Id, gitHubUser.Login, gitHubUser.AvatarUrl);
            throw;
        }
    }
}

public sealed class GitHubTokenResponse
{
    [JsonPropertyName("access_token")]
    public string? AccessToken { get; set; }

    [JsonPropertyName("token_type")]
    public string? TokenType { get; set; }

    [JsonPropertyName("scope")]
    public string? Scope { get; set; }
}