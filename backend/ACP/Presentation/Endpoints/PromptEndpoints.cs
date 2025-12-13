using System.ComponentModel.DataAnnotations;
using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

public static class PromptEndpoints
{
    private const int DefaultLimit = 100;

    public static IEndpointRouteBuilder MapPromptEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/custom-prompts").RequireAuthorization();

        // 获取当前用户自己创建的 Prompt 列表（包含已点赞的）
        group.MapGet("/mine", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            // 获取用户点赞的 Prompt ID 列表
            var likedPromptIds = await db.UserLikes
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.CustomPrompt)
                .Select(l => l.ResourceId)
                .ToListAsync();

            // 查询用户创建的或已点赞的 Prompt
            var query = db.CustomPrompts
                .Include(c => c.User)
                .Where(c => c.UserId == userId || likedPromptIds.Contains(c.Id));

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var likedIdsSet = likedPromptIds.ToHashSet();
            var dtos = items.Select(c => c.ToDto(likedIdsSet.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetMyCustomPrompts").WithSummary("获取当前用户自己创建的Prompt列表（包含已点赞的）");

        // 获取所有公开的 Prompt 列表（不包含当前用户创建的）
        group.MapGet("/public", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            var query = db.CustomPrompts
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
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.CustomPrompt && resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToHashSetAsync();

            var dtos = items.Select(c => c.ToDto(likedIds.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetPublicCustomPrompts").WithSummary("获取所有公开的Prompt列表（不包含当前用户创建的）");

        group.MapGet(string.Empty, async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, [FromQuery] string? category, [FromQuery] bool? isPublic, AppDbContext db) =>
        {
            page = page <= 0 ? 1 : page;
            limit = limit is <= 0 or > 100 ? 20 : limit;

            var query = db.CustomPrompts.Include(c => c.User).AsQueryable();
            if (isPublic.HasValue) query = query.Where(c => c.IsPublic == isPublic.Value);
            var total = await query.CountAsync();
            var items = await query.OrderByDescending(c => c.CreatedAt).Skip((page - 1) * limit).Take(limit).ToListAsync();

            // Get liked resource ids for current user
            var likedIds = new HashSet<Guid>();
            if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
            {
                var resourceIds = items.Select(c => c.Id).ToList();
                likedIds = (await db.UserLikes
                    .Where(l => l.UserId == currentUser.UserId.Value && l.ResourceType == LikeResourceType.CustomPrompt && resourceIds.Contains(l.ResourceId))
                    .Select(l => l.ResourceId)
                    .ToListAsync()).ToHashSet();
            }

            var dtos = items.Select(c => c.ToDto(likedIds.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetCustomPrompts").WithSummary("获取自定义提示词列表");

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            var entity = await db.CustomPrompts.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();

            var isLiked = currentUser.IsAuthenticated && currentUser.UserId.HasValue && 
                await db.UserLikes.AnyAsync(l => l.UserId == currentUser.UserId.Value && l.ResourceId == id && l.ResourceType == LikeResourceType.CustomPrompt);
            return Results.Ok(ApiResponse.Ok(entity.ToDto(isLiked)));
        }).WithName("GetCustomPrompt").WithSummary("根据ID获取自定义提示词详情");

        group.MapPost(string.Empty, async (ICurrentUser currentUser, AppDbContext db, CreatePromptRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var user = await db.Users.FindAsync(userId);
            var entity = new CustomPrompt
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                Content = request.Content,
                Tags = request.Tags ?? new(),
                IsPublic = request.IsPublic,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                User = user!
            };
            db.CustomPrompts.Add(entity);
            await db.SaveChangesAsync();
            return Results.Created($"/api/custom-prompts/{entity.Id}", ApiResponse.Ok(entity.ToDto(false)));
        }).WithName("CreateCustomPrompt").WithSummary("创建自定义提示词");

        group.MapPut("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db, UpdatePromptRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.CustomPrompts.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();
            entity.Name = request.Name ?? entity.Name;
            entity.Description = request.Description ?? entity.Description;
            entity.Content = request.Content ?? entity.Content;
            entity.Tags = request.Tags ?? entity.Tags;
            entity.IsPublic = request.IsPublic ?? entity.IsPublic;
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var isLiked = await db.UserLikes.AnyAsync(l => l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.CustomPrompt);
            return Results.Ok(ApiResponse.Ok(entity.ToDto(isLiked)));
        }).WithName("UpdateCustomPrompt").WithSummary("更新自定义提示词");

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.CustomPrompts.FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();
            db.CustomPrompts.Remove(entity);
            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok());
        }).WithName("DeleteCustomPrompt").WithSummary("删除自定义提示词");

        group.MapPost("/{id:guid}/like", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.CustomPrompts.FindAsync(id);
            if (entity == null) return Results.NotFound();

            var existingLike = await db.UserLikes.FirstOrDefaultAsync(l => 
                l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.CustomPrompt);

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
                    ResourceType = LikeResourceType.CustomPrompt,
                    CreatedAt = DateTime.UtcNow
                });
                entity.Likes += 1;
                isLiked = true;
            }

            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok(new PromptLikeDto(entity.Likes, isLiked)));
        }).WithName("LikeCustomPrompt").WithSummary("点赞/取消点赞自定义提示词");

        return app;
    }
}

public record CreatePromptRequest([Required] string Name, string Description, [Required] string Content, List<string>? Tags, bool IsPublic = true);
public record UpdatePromptRequest(string? Name, string? Description, string? Content, List<string>? Tags, bool? IsPublic);
