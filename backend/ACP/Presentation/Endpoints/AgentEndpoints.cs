using System.ComponentModel.DataAnnotations;
using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

public static class AgentEndpoints
{
    private const int DefaultLimit = 100;

    public static IEndpointRouteBuilder MapAgentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/agent-configs").RequireAuthorization();

        // 获取当前用户自己创建的 Agent 配置列表（包含已点赞的）
        group.MapGet("/mine", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            // 获取用户点赞的 Agent 配置 ID 列表
            var likedAgentIds = await db.UserLikes
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.AgentConfig)
                .Select(l => l.ResourceId)
                .ToListAsync();

            // 查询用户创建的或已点赞的 Agent 配置
            var query = db.AgentConfigs
                .Include(c => c.User)
                .Where(c => c.UserId == userId || likedAgentIds.Contains(c.Id));

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            var likedIdsSet = likedAgentIds.ToHashSet();
            var dtos = items.Select(c => c.ToDto(likedIdsSet.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetMyAgentConfigs").WithSummary("获取当前用户自己创建的Agent配置列表（包含已点赞的）");

        // 获取所有公开的 Agent 配置列表（不包含当前用户创建的）
        group.MapGet("/public", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? DefaultLimit : Math.Min(limit, DefaultLimit);

            var query = db.AgentConfigs
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
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.AgentConfig && resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToHashSetAsync();

            var dtos = items.Select(c => c.ToDto(likedIds.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetPublicAgentConfigs").WithSummary("获取所有公开的Agent配置列表（不包含当前用户创建的）");

        group.MapGet(string.Empty, async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, [FromQuery] string? format, [FromQuery] bool? isPublic, AppDbContext db) =>
        {
            page = page <= 0 ? 1 : page;
            limit = limit is <= 0 or > 100 ? 20 : limit;

            var query = db.AgentConfigs.Include(c => c.User).AsQueryable();
            if (isPublic.HasValue) query = query.Where(c => c.IsPublic == isPublic.Value);
            if (!string.IsNullOrWhiteSpace(format) && Enum.TryParse<ConfigFormat>(format, true, out var fmt)) query = query.Where(c => c.Format == fmt);
            var total = await query.CountAsync();
            var items = await query.OrderByDescending(c => c.CreatedAt).Skip((page - 1) * limit).Take(limit).ToListAsync();

            // Get liked resource ids for current user
            var likedIds = new HashSet<Guid>();
            if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
            {
                var resourceIds = items.Select(c => c.Id).ToList();
                likedIds = (await db.UserLikes
                    .Where(l => l.UserId == currentUser.UserId.Value && l.ResourceType == LikeResourceType.AgentConfig && resourceIds.Contains(l.ResourceId))
                    .Select(l => l.ResourceId)
                    .ToListAsync()).ToHashSet();
            }

            var dtos = items.Select(c => c.ToDto(likedIds.Contains(c.Id))).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetAgentConfigs").WithSummary("获取Agent配置列表");

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            var entity = await db.AgentConfigs.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();

            var isLiked = currentUser.IsAuthenticated && currentUser.UserId.HasValue && 
                await db.UserLikes.AnyAsync(l => l.UserId == currentUser.UserId.Value && l.ResourceId == id && l.ResourceType == LikeResourceType.AgentConfig);
            return Results.Ok(ApiResponse.Ok(entity.ToDto(isLiked)));
        }).WithName("GetAgentConfig").WithSummary("根据ID获取Agent配置详情");

        group.MapPost(string.Empty, async (ICurrentUser currentUser, AppDbContext db, [FromBody] CreateAgentRequest? request, ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("AgentEndpoints.CreateAgentConfig");
            
            try
            {
                // 检查请求体是否为 null
                if (request == null)
                {
                    logger.LogWarning("Request body is null");
                    return Results.BadRequest(ApiResponse.Fail("INVALID_REQUEST", "Request body is required"));
                }

            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var user = await db.Users.FindAsync(userId);
                
                if (user == null)
                {
                    logger.LogWarning("User not found: UserId={UserId}", userId);
                    return Results.BadRequest(ApiResponse.Fail("USER_NOT_FOUND", "User not found"));
                }

                // 验证必填字段
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return Results.BadRequest(ApiResponse.Fail("VALIDATION_ERROR", "Name is required"));
                }
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return Results.BadRequest(ApiResponse.Fail("VALIDATION_ERROR", "Content is required"));
                }

            var entity = new AgentConfig
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                    Description = request.Description ?? string.Empty,
                Content = request.Content,
                Format = request.Format,
                Tags = request.Tags ?? new(),
                IsPublic = request.IsPublic,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                    User = user
            };
                
            db.AgentConfigs.Add(entity);
            await db.SaveChangesAsync();
                
                logger.LogInformation("Agent config created successfully: Id={Id}, Name={Name}, UserId={UserId}", 
                    entity.Id, entity.Name, userId);
                
            return Results.Created($"/api/agent-configs/{entity.Id}", ApiResponse.Ok(entity.ToDto(false)));
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                logger.LogError(dbEx, "Database error while creating agent config: UserId={UserId}, Name={Name}", 
                    currentUser.UserId, request?.Name);
                var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                return Results.BadRequest(ApiResponse.Fail("DATABASE_ERROR", 
                    $"Database error: {innerMessage}", dbEx));
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to create agent config: UserId={UserId}, Name={Name}, ExceptionType={ExceptionType}", 
                    currentUser.UserId, request?.Name, ex.GetType().Name);
                return Results.BadRequest(ApiResponse.Fail("CREATE_FAILED", 
                    $"Failed to create agent config: {ex.Message}", ex));
            }
        }).WithName("CreateAgentConfig").WithSummary("创建Agent配置");

        group.MapPut("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db, UpdateAgentRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.AgentConfigs.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();
            entity.Name = request.Name ?? entity.Name;
            entity.Description = request.Description ?? entity.Description;
            entity.Content = request.Content ?? entity.Content;
            entity.Format = request.Format ?? entity.Format;
            entity.Tags = request.Tags ?? entity.Tags;
            entity.IsPublic = request.IsPublic ?? entity.IsPublic;
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var isLiked = await db.UserLikes.AnyAsync(l => l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.AgentConfig);
            return Results.Ok(ApiResponse.Ok(entity.ToDto(isLiked)));
        }).WithName("UpdateAgentConfig").WithSummary("更新Agent配置");

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.AgentConfigs.FirstOrDefaultAsync(c => c.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();
            db.AgentConfigs.Remove(entity);
            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok());
        }).WithName("DeleteAgentConfig").WithSummary("删除Agent配置");

        group.MapGet("/{id:guid}/download", async (Guid id, AppDbContext db) =>
        {
            var entity = await db.AgentConfigs.FindAsync(id);
            return entity == null ? Results.NotFound() : Results.Text(entity.Content, "text/markdown");
        }).WithName("DownloadAgentConfig").WithSummary("下载Agent配置文件");

        group.MapPost("/{id:guid}/like", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.AgentConfigs.FindAsync(id);
            if (entity == null) return Results.NotFound();

            var existingLike = await db.UserLikes.FirstOrDefaultAsync(l => 
                l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.AgentConfig);

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
                    ResourceType = LikeResourceType.AgentConfig,
                    CreatedAt = DateTime.UtcNow
                });
                entity.Likes += 1;
                isLiked = true;
            }

            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok(new AgentLikeDto(entity.Likes, isLiked)));
        }).WithName("LikeAgentConfig").WithSummary("点赞/取消点赞Agent配置");

        return app;
    }
}

public record CreateAgentRequest([Required] string Name, string Description, [Required] string Content, ConfigFormat Format, List<string>? Tags, bool IsPublic = true);
public record UpdateAgentRequest(string? Name, string? Description, string? Content, ConfigFormat? Format, List<string>? Tags, bool? IsPublic);
