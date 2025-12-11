using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;

namespace ACP.Presentation.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users").RequireAuthorization();

        group.MapGet("/me", async (ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            {
                return Results.Unauthorized();
            }

            var user = await db.Users.FindAsync(currentUser.UserId.Value);
            if (user == null) return Results.NotFound(ApiResponse.Fail("NOT_FOUND", "User not found"));

            return Results.Ok(ApiResponse.Ok(user.ToDto()));
        }).WithName("GetCurrentUser").WithSummary("获取当前登录用户信息");

        group.MapPut("/me", async (ICurrentUser currentUser, AppDbContext db, UpdateUserRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            {
                return Results.Unauthorized();
            }

            var user = await db.Users.FindAsync(currentUser.UserId.Value);
            if (user == null) return Results.NotFound();

            user.Username = request.Username ?? user.Username;
            user.Email = request.Email ?? user.Email;
            user.AvatarUrl = request.AvatarUrl ?? user.AvatarUrl;
            user.Bio = request.Bio ?? user.Bio;
            user.Settings.Theme = request.Theme ?? user.Settings.Theme;
            user.Settings.NotificationsEnabled = request.NotificationsEnabled ?? user.Settings.NotificationsEnabled;
            user.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok(user.ToDto()));
        }).WithName("UpdateCurrentUser").WithSummary("更新当前登录用户信息");

        return app;
    }
}

public record UpdateUserRequest(string? Username, string? Email, string? AvatarUrl, string? Bio, Theme? Theme, bool? NotificationsEnabled);
