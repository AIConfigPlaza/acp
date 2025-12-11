using System.ComponentModel.DataAnnotations;
using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

public static class McpEndpoints
{
    private const int DefaultLimit = 100;

    public static IEndpointRouteBuilder MapMcpEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/mcp-configs").RequireAuthorization();

        // 获取当前用户自己创建的 MCP 配置列表
        group.MapGet("/mine", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            var query = db.McpConfigs
                .Include(c => c.User)
                .Where(c => c.UserId == userId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // 获取点赞状态
            var resourceIds = items.Select(c => c.Id).ToList();
            var likedIds = await db.UserLikes
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.McpConfig && resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToHashSetAsync();

            var dtos = items.Select(c => c.ToDto(likedIds.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetMyMcpConfigs").WithSummary("获取当前用户自己创建的MCP配置列表");

        // 获取所有公开的 MCP 配置列表（不包含当前用户创建的）
        group.MapGet("/public", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            var query = db.McpConfigs
                .Include(c => c.User)
                .Where(c => c.IsPublic && c.UserId != userId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // 获取点赞状态
            var resourceIds = items.Select(c => c.Id).ToList();
            var likedIds = await db.UserLikes
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.McpConfig && resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToHashSetAsync();

            var dtos = items.Select(c => c.ToDto(likedIds.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetPublicMcpConfigs").WithSummary("获取所有公开的MCP配置列表（不包含当前用户创建的）");

        group.MapGet(string.Empty, async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, [FromQuery] string? type, [FromQuery] bool? isPublic, AppDbContext db) =>
        {
            page = page <= 0 ? 1 : page;
            limit = limit is <= 0 or > 100 ? 20 : limit;

            var query = db.McpConfigs.Include(c => c.User).AsQueryable();
            if (isPublic.HasValue) query = query.Where(c => c.IsPublic == isPublic.Value);

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(c => c.CreatedAt).Skip((page - 1) * limit).Take(limit).ToListAsync();

            // Get liked resource ids for current user
            var likedIds = new HashSet<Guid>();
            if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
            {
                var resourceIds = items.Select(c => c.Id).ToList();
                likedIds = (await db.UserLikes
                    .Where(l => l.UserId == currentUser.UserId.Value && l.ResourceType == LikeResourceType.McpConfig && resourceIds.Contains(l.ResourceId))
                    .Select(l => l.ResourceId)
                    .ToListAsync()).ToHashSet();
            }

            var dtos = items.Select(c => c.ToDto(likedIds.Contains(c.Id))).ToList();

            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetMcpConfigs").WithSummary("获取MCP配置列表");

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            var item = await db.McpConfigs.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
            if (item == null)
                return Results.NotFound(ApiResponse.Fail("NOT_FOUND", "MCP config not found"));

            var isLiked = currentUser.IsAuthenticated && currentUser.UserId.HasValue && 
                await db.UserLikes.AnyAsync(l => l.UserId == currentUser.UserId.Value && l.ResourceId == id && l.ResourceType == LikeResourceType.McpConfig);
            return Results.Ok(ApiResponse.Ok(item.ToDto(isLiked)));
        }).WithName("GetMcpConfig").WithSummary("根据ID获取MCP配置详情");

        group.MapPost(string.Empty, async (ICurrentUser currentUser, AppDbContext db, CreateMcpRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var user = await db.Users.FindAsync(userId);
            var entity = new McpConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                ConfigJson = request.ConfigJson,
                Tags = request.Tags ?? new(),
                IsPublic = request.IsPublic,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                User = user!
            };
            db.McpConfigs.Add(entity);
            await db.SaveChangesAsync();
            return Results.Created($"/api/mcp-configs/{entity.Id}", ApiResponse.Ok(entity.ToDto(false)));
        }).WithName("CreateMcpConfig").WithSummary("创建MCP配置");

        group.MapPut("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db, UpdateMcpRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.McpConfigs.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();

            entity.Name = request.Name ?? entity.Name;
            entity.Description = request.Description ?? entity.Description;
            entity.ConfigJson = request.ConfigJson ?? entity.ConfigJson;
            entity.Tags = request.Tags ?? entity.Tags;
            entity.IsPublic = request.IsPublic ?? entity.IsPublic;
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var isLiked = await db.UserLikes.AnyAsync(l => l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.McpConfig);
            return Results.Ok(ApiResponse.Ok(entity.ToDto(isLiked)));
        }).WithName("UpdateMcpConfig").WithSummary("更新MCP配置");

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.McpConfigs.FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();
            db.McpConfigs.Remove(entity);
            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok());
        }).WithName("DeleteMcpConfig").WithSummary("删除MCP配置");

        group.MapPost("/{id:guid}/like", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.McpConfigs.FindAsync(id);
            if (entity == null) return Results.NotFound();

            var existingLike = await db.UserLikes.FirstOrDefaultAsync(l => 
                l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.McpConfig);

            bool isLiked;
            if (existingLike != null)
            {
                // Unlike: remove the like
                db.UserLikes.Remove(existingLike);
                entity.Likes = Math.Max(0, entity.Likes - 1);
                isLiked = false;
            }
            else
            {
                // Like: add new like
                db.UserLikes.Add(new UserLike
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    ResourceId = id,
                    ResourceType = LikeResourceType.McpConfig,
                    CreatedAt = DateTime.UtcNow
                });
                entity.Likes += 1;
                isLiked = true;
            }

            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok(new McpLikeDto(entity.Likes, isLiked)));
        }).WithName("LikeMcpConfig").WithSummary("点赞/取消点赞MCP配置");

        return app;
    }
}

public record CreateMcpRequest([Required] string Name, string Description, [Required] string ConfigJson, List<string>? Tags, bool IsPublic = true);
public record UpdateMcpRequest(string? Name, string? Description, string? ConfigJson, List<string>? Tags, bool? IsPublic);
