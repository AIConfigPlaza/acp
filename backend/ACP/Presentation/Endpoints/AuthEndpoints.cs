using System.ComponentModel.DataAnnotations;
using ACP.Application.Auth;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Authorization;

namespace ACP.Presentation.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/auth");

        group.MapPost("/github/callback", async (GitHubCallbackRequest request, IGitHubAuthService gitHubAuth, ITokenService tokenService, AppDbContext db, ILoggerFactory loggerFactory, CancellationToken cancellationToken) =>
        {
            var logger = loggerFactory.CreateLogger("AuthEndpoints.GitHubCallback");

            try
            {
                if (request == null)
                {
                    logger.LogWarning("GitHub callback request is null");
                    return Results.BadRequest(ApiResponse.Fail("INVALID_REQUEST", "Request body is required"));
                }

                if (string.IsNullOrWhiteSpace(request.AccessToken) && string.IsNullOrWhiteSpace(request.Code))
                {
                    logger.LogWarning("GitHub callback: Both code and access_token are missing");
                    return Results.BadRequest(ApiResponse.Fail("INVALID_TOKEN", "code or access_token is required"));
                }

                var accessToken = request.AccessToken;

                if (string.IsNullOrWhiteSpace(accessToken) && !string.IsNullOrWhiteSpace(request.Code))
                {
                    try
                    {
                        logger.LogInformation("Exchanging GitHub code for token");
                        accessToken = await gitHubAuth.ExchangeCodeForTokenAsync(request.Code, request.RedirectUri, cancellationToken);
                        logger.LogInformation("Successfully exchanged code for token");
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "GitHub code exchange failed: Code={Code}, RedirectUri={RedirectUri}", 
                            request.Code, request.RedirectUri);
                        return Results.BadRequest(ApiResponse.Fail("GITHUB_EXCHANGE_FAILED", ex.Message, ex));
                    }
                }

                if (string.IsNullOrWhiteSpace(accessToken))
                {
                    logger.LogWarning("Unable to resolve access token");
                    return Results.BadRequest(ApiResponse.Fail("INVALID_TOKEN", "Unable to resolve access token"));
                }

                try
                {
                    logger.LogInformation("Fetching GitHub user information");
                    var ghUser = await gitHubAuth.GetGitHubUserAsync(accessToken);
                    logger.LogInformation("Successfully fetched GitHub user: {Username}", ghUser.Login);

                    logger.LogInformation("Authenticating user in database");
                    var user = await gitHubAuth.AuthenticateUserAsync(ghUser);
                    logger.LogInformation("Successfully authenticated user: {UserId}", user.Id);

                    logger.LogInformation("Generating JWT token and refresh token");
                    var jwt = tokenService.GenerateJwtToken(user);
                    var refresh = tokenService.GenerateRefreshToken();

                    // 保存refresh token到用户记录
                    user.RefreshToken = refresh;
                    user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(30);
                    await db.SaveChangesAsync();

                    logger.LogInformation("GitHub authentication successful for user: {UserId}", user.Id);
                    return Results.Ok(ApiResponse.Ok(new AuthResponseDto(jwt, refresh, user.ToDto())));
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "GitHub auth failed after token exchange");
                    return Results.BadRequest(ApiResponse.Fail("GITHUB_AUTH_FAILED", ex.Message, ex));
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled error in GitHub callback: {ExceptionType}, {Message}, {StackTrace}", 
                    ex.GetType().Name, ex.Message, ex.StackTrace);
                
                // 返回详细的错误信息，包括堆栈跟踪
                return Results.BadRequest(ApiResponse.Fail("INTERNAL_ERROR", 
                    $"An error occurred: {ex.GetType().Name} - {ex.Message}", ex));
            }
        })
        .WithName("GitHubCallback")
        .WithSummary("GitHub OAuth回调登录")
        ;

        group.MapPost("/refresh", async (RefreshTokenRequest request, ITokenService tokenService, ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("AuthEndpoints.RefreshToken");

            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                logger.LogWarning("Refresh token is missing");
                return Results.BadRequest(ApiResponse.Fail("INVALID_REQUEST", "Refresh token is required"));
            }

            var result = await tokenService.RefreshTokenAsync(request.RefreshToken);

            if (result == null)
            {
                logger.LogWarning("Refresh token validation failed");
                return Results.Unauthorized();
            }

            logger.LogInformation("Token refreshed successfully");
            return Results.Ok(ApiResponse.Ok(new RefreshTokenResponseDto(result.Value.AccessToken, result.Value.RefreshToken)));
        })
        .WithName("RefreshToken")
        .WithSummary("使用RefreshToken刷新JWT令牌")
        ;

        group.MapGet("/validate", [Authorize] (ICurrentUser currentUser) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            {
                return Results.Unauthorized();
            }
            return Results.Ok(ApiResponse.Ok(new ValidateTokenDto(currentUser.UserId.Value)));
        })
        .WithName("ValidateToken")
        .WithSummary("验证用户令牌有效性")
        ;

        group.MapPost("/logout", () => Results.Ok(ApiResponse.Ok()))
        .WithName("Logout")
        .WithSummary("用户登出")
        ;

        return app;
    }
}

public record GitHubCallbackRequest(string? Code, string? AccessToken, string? RedirectUri);

public record RefreshTokenRequest(string RefreshToken);