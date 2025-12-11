using System.Security.Claims;
using ACP.Domain.Entities;
using ACP.Infrastructure.Auth;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

public static class CliTokenEndpoints
{

    public static IEndpointRouteBuilder MapCliTokenEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cli-token").RequireAuthorization();

        group.MapGet(string.Empty, async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var token = await db.CliTokens.FirstOrDefaultAsync(t => t.UserId == userId);
            if (token == null)
            {
                return Results.Ok(ApiResponse.Ok<CliTokenDto?>(null));
            }
            return Results.Ok(ApiResponse.Ok(token.ToDto()));
        }).WithName("GetCliToken").WithSummary("获取当前用户的CLI令牌");

        group.MapPost("/refresh", async (ClaimsPrincipal principal, AppDbContext db) =>
        {
            var userId = Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var existingToken = await db.CliTokens.FirstOrDefaultAsync(t => t.UserId == userId);

            var newTokenValue = CliTokenGenerator.GenerateToken();

            if (existingToken != null)
            {
                // 更新现有令牌
                existingToken.Token = newTokenValue;
                existingToken.CreatedAt = DateTime.UtcNow;
                existingToken.LastUsedAt = null;
            }
            else
            {
                // 创建新令牌
                existingToken = new CliToken
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Token = newTokenValue,
                    CreatedAt = DateTime.UtcNow
                };
                db.CliTokens.Add(existingToken);
            }

            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok(existingToken.ToDto()));
        }).WithName("RefreshCliToken").WithSummary("创建或刷新CLI令牌");

        return app;
    }
}
