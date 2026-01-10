using System.ComponentModel.DataAnnotations;
using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

public static class SkillEndpoints
{
    private const int DefaultLimit = 100;

    public static IEndpointRouteBuilder MapSkillEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/skills").RequireAuthorization();

        // 获取当前用户自己创建的 Skills 列表（包含已点赞的）
        group.MapGet("/mine", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            // 获取用户点赞的 Skill ID 列表
            var likedSkillIds = await db.UserLikes
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.Skill)
                .Select(l => l.ResourceId)
                .ToListAsync();

            // 查询用户创建的或已点赞的 Skills
            var query = db.Skills
                .Include(s => s.User)
                .Where(s => s.UserId == userId || likedSkillIds.Contains(s.Id));

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var likedIdsSet = likedSkillIds.ToHashSet();
            var dtos = items.Select(s => s.ToDto(likedIdsSet.Contains(s.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetMySkills").WithSummary("获取当前用户自己创建的Skills列表（包含已点赞的）");

        // 获取所有公开的 Skills 列表（不包含当前用户创建的）
        group.MapGet("/public", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            var query = db.Skills
                .Include(s => s.User)
                .Where(s => s.IsPublic && s.UserId != userId);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // 获取点赞状态
            var resourceIds = items.Select(s => s.Id).ToList();
            var likedIds = await db.UserLikes
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.Skill && resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToHashSetAsync();

            var dtos = items.Select(s => s.ToDto(likedIds.Contains(s.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetPublicSkills").WithSummary("获取所有公开的Skills列表（不包含当前用户创建的）");

        group.MapGet(string.Empty, async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, [FromQuery] bool? isPublic, AppDbContext db) =>
        {
            page = page <= 0 ? 1 : page;
            limit = limit is <= 0 or > 100 ? 20 : limit;

            var query = db.Skills.Include(s => s.User).AsQueryable();
            if (isPublic.HasValue) query = query.Where(s => s.IsPublic == isPublic.Value);

            var total = await query.CountAsync();
            var items = await query.OrderByDescending(s => s.CreatedAt).Skip((page - 1) * limit).Take(limit).ToListAsync();

            // Get liked resource ids for current user
            var likedIds = new HashSet<Guid>();
            if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
            {
                var resourceIds = items.Select(s => s.Id).ToList();
                likedIds = (await db.UserLikes
                    .Where(l => l.UserId == currentUser.UserId.Value && l.ResourceType == LikeResourceType.Skill && resourceIds.Contains(l.ResourceId))
                    .Select(l => l.ResourceId)
                    .ToListAsync()).ToHashSet();
            }

            var dtos = items.Select(s => s.ToDto(likedIds.Contains(s.Id))).ToList();

            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetSkills").WithSummary("获取Skills列表");

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            var item = await db.Skills
                .Include(s => s.User)
                .Include(s => s.SkillResources)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (item == null)
                return Results.NotFound(ApiResponse.Fail("NOT_FOUND", "Skill not found"));

            var isLiked = currentUser.IsAuthenticated && currentUser.UserId.HasValue && 
                await db.UserLikes.AnyAsync(l => l.UserId == currentUser.UserId.Value && l.ResourceId == id && l.ResourceType == LikeResourceType.Skill);
            return Results.Ok(ApiResponse.Ok(item.ToDetailDto(isLiked)));
        }).WithName("GetSkill").WithSummary("根据ID获取Skill详情");

        group.MapPost(string.Empty, async (ICurrentUser currentUser, AppDbContext db, CreateSkillRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var user = await db.Users.FindAsync(userId);
            var entity = new Skill
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                SkillMarkdown = request.SkillMarkdown,
                Tags = request.Tags ?? new(),
                IsPublic = request.IsPublic,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                User = user!
            };

            // 添加 SkillResources
            if (request.SkillResources?.Any() == true)
            {
                foreach (var resourceRequest in request.SkillResources)
                {
                    entity.SkillResources.Add(new SkillResource
                    {
                        Id = Guid.NewGuid(),
                        SkillId = entity.Id,
                        RelativePath = resourceRequest.RelativePath,
                        FileName = resourceRequest.FileName,
                        FileContent = resourceRequest.FileContent,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Skill = entity
                    });
                }
            }

            db.Skills.Add(entity);
            await db.SaveChangesAsync();
            return Results.Created($"/api/skills/{entity.Id}", ApiResponse.Ok(entity.ToDetailDto(false)));
        }).WithName("CreateSkill").WithSummary("创建Skill");

        group.MapPut("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db, UpdateSkillRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.Skills
                .Include(s => s.User)
                .Include(s => s.SkillResources)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();

            entity.Name = request.Name ?? entity.Name;
            entity.SkillMarkdown = request.SkillMarkdown ?? entity.SkillMarkdown;
            entity.Tags = request.Tags ?? entity.Tags;
            entity.IsPublic = request.IsPublic ?? entity.IsPublic;
            entity.UpdatedAt = DateTime.UtcNow;

            // 更新 SkillResources：先显式删除所有现有的，然后添加新的
            if (request.SkillResources != null)
            {
                // 显式从数据库中删除现有的 SkillResources
                var existingResources = await db.SkillResources
                    .Where(r => r.SkillId == entity.Id)
                    .ToListAsync();
                if (existingResources.Any())
                {
                    db.SkillResources.RemoveRange(existingResources);
                }

                // 添加新的 SkillResources
                foreach (var resourceRequest in request.SkillResources)
                {
                    var newResource = new SkillResource
                    {
                        Id = Guid.NewGuid(),
                        SkillId = entity.Id,
                        RelativePath = resourceRequest.RelativePath,
                        FileName = resourceRequest.FileName,
                        FileContent = resourceRequest.FileContent,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        Skill = entity
                    };
                    db.SkillResources.Add(newResource);
                }
            }

            await db.SaveChangesAsync();

            var isLiked = await db.UserLikes.AnyAsync(l => l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.Skill);
            return Results.Ok(ApiResponse.Ok(entity.ToDetailDto(isLiked)));
        }).WithName("UpdateSkill").WithSummary("更新Skill");

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.Skills.FirstOrDefaultAsync(s => s.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();
            db.Skills.Remove(entity);
            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok());
        }).WithName("DeleteSkill").WithSummary("删除Skill");

        group.MapPost("/{id:guid}/like", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.Skills.FindAsync(id);
            if (entity == null) return Results.NotFound();

            var existingLike = await db.UserLikes.FirstOrDefaultAsync(l => 
                l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.Skill);

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
                    ResourceType = LikeResourceType.Skill,
                    CreatedAt = DateTime.UtcNow
                });
                entity.Likes += 1;
                isLiked = true;
            }

            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok(new SkillLikeDto(entity.Likes, isLiked)));
        }).WithName("LikeSkill").WithSummary("点赞/取消点赞Skill");

        return app;
    }
}
