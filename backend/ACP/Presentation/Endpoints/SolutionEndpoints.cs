using System.ComponentModel.DataAnnotations;
using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

public static class SolutionEndpoints
{
    public static IEndpointRouteBuilder MapSolutionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/solutions").RequireAuthorization();

        // 获取当前用户自己创建的解决方案列表（包含已点赞的）
        group.MapGet("/mine", async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            page = page <= 0 ? 1 : page;
            limit = limit <= 0 ? 100 : Math.Min(limit, 100);

            // 获取用户点赞的解决方案 ID 列表
            var likedSolutionIds = await db.UserLikes
                .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.Solution)
                .Select(l => l.ResourceId)
                .ToListAsync();

            // 查询用户创建的或已点赞的解决方案
            var query = db.Solutions
                .Include(s => s.User)
                .Include(s => s.AgentConfig).ThenInclude(a => a.User)
                .Where(s => s.UserId == userId || likedSolutionIds.Contains(s.Id));

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync();

            // 获取点赞状态
            var solutionIds = items.Select(s => s.Id).ToList();
            var agentConfigIds = items.Where(s => s.AgentConfig != null).Select(s => s.AgentConfigId).Distinct().ToList();

            var likes = await db.UserLikes
                .Where(l => l.UserId == userId && 
                    ((l.ResourceType == LikeResourceType.Solution && solutionIds.Contains(l.ResourceId)) ||
                     (l.ResourceType == LikeResourceType.AgentConfig && agentConfigIds.Contains(l.ResourceId))))
                .ToListAsync();

            var likedSolutionIdsSet = likes.Where(l => l.ResourceType == LikeResourceType.Solution).Select(l => l.ResourceId).ToHashSet();
            var likedAgentConfigIds = likes.Where(l => l.ResourceType == LikeResourceType.AgentConfig).Select(l => l.ResourceId).ToHashSet();

            var dtos = items.Select(s => s.ToDto(
                likedSolutionIdsSet.Contains(s.Id),
                likedAgentConfigIds.Contains(s.AgentConfigId)
            )).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetMySolutions").WithSummary("获取当前用户自己创建的解决方案列表（包含已点赞的）");

        group.MapGet(string.Empty, async (ICurrentUser currentUser, [FromQuery] int page, [FromQuery] int limit, [FromQuery] string? aiTool, [FromQuery] bool? isPublic, AppDbContext db) =>
        {
            page = page <= 0 ? 1 : page;
            limit = limit is <= 0 or > 100 ? 20 : limit;

            var query = db.Solutions
                .Include(s => s.User)
                .Include(s => s.AgentConfig).ThenInclude(a => a.User)
                .AsQueryable();
            if (isPublic.HasValue) query = query.Where(c => c.IsPublic == isPublic.Value);
            if (!string.IsNullOrWhiteSpace(aiTool) && Enum.TryParse<AiTool>(aiTool, true, out var tool)) query = query.Where(c => c.AiTool == tool);
            var total = await query.CountAsync();
            var items = await query.OrderByDescending(c => c.CreatedAt).Skip((page - 1) * limit).Take(limit).ToListAsync();

            // Get liked resource ids for current user (both solutions and agent configs)
            var likedSolutionIds = new HashSet<Guid>();
            var likedAgentConfigIds = new HashSet<Guid>();
            if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
            {
                var solutionIds = items.Select(s => s.Id).ToList();
                var agentConfigIds = items.Where(s => s.AgentConfig != null).Select(s => s.AgentConfigId).Distinct().ToList();

                var likes = await db.UserLikes
                    .Where(l => l.UserId == currentUser.UserId.Value && 
                        ((l.ResourceType == LikeResourceType.Solution && solutionIds.Contains(l.ResourceId)) ||
                         (l.ResourceType == LikeResourceType.AgentConfig && agentConfigIds.Contains(l.ResourceId))))
                    .ToListAsync();

                likedSolutionIds = likes.Where(l => l.ResourceType == LikeResourceType.Solution).Select(l => l.ResourceId).ToHashSet();
                likedAgentConfigIds = likes.Where(l => l.ResourceType == LikeResourceType.AgentConfig).Select(l => l.ResourceId).ToHashSet();
            }

            var dtos = items.Select(s => s.ToDto(
                likedSolutionIds.Contains(s.Id),
                likedAgentConfigIds.Contains(s.AgentConfigId)
            )).ToList();
            return Results.Ok(ApiResponse.Ok(dtos, new PaginationMeta(page, limit, total)));
        }).WithName("GetSolutions").WithSummary("获取解决方案列表");

        group.MapGet("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            var entity = await db.Solutions
                .Include(s => s.User)
                .Include(s => s.AgentConfig).ThenInclude(a => a.User)
                .Include(s => s.McpConfigs).ThenInclude(m => m.User)
                .Include(s => s.CustomPrompts).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (entity == null) return Results.NotFound();

            // Get liked status for all related resources
            var isLiked = false;
            var agentConfigIsLiked = false;
            HashSet<Guid>? likedMcpConfigIds = null;
            HashSet<Guid>? likedCustomPromptIds = null;

            if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
            {
                var mcpConfigIds = entity.McpConfigs.Select(m => m.Id).ToList();
                var customPromptIds = entity.CustomPrompts.Select(p => p.Id).ToList();

                var likes = await db.UserLikes
                    .Where(l => l.UserId == currentUser.UserId.Value && (
                        (l.ResourceType == LikeResourceType.Solution && l.ResourceId == id) ||
                        (l.ResourceType == LikeResourceType.AgentConfig && l.ResourceId == entity.AgentConfigId) ||
                        (l.ResourceType == LikeResourceType.McpConfig && mcpConfigIds.Contains(l.ResourceId)) ||
                        (l.ResourceType == LikeResourceType.CustomPrompt && customPromptIds.Contains(l.ResourceId))
                    ))
                    .ToListAsync();

                isLiked = likes.Any(l => l.ResourceType == LikeResourceType.Solution && l.ResourceId == id);
                agentConfigIsLiked = likes.Any(l => l.ResourceType == LikeResourceType.AgentConfig && l.ResourceId == entity.AgentConfigId);
                likedMcpConfigIds = likes.Where(l => l.ResourceType == LikeResourceType.McpConfig).Select(l => l.ResourceId).ToHashSet();
                likedCustomPromptIds = likes.Where(l => l.ResourceType == LikeResourceType.CustomPrompt).Select(l => l.ResourceId).ToHashSet();
            }

            return Results.Ok(ApiResponse.Ok(entity.ToDetailDto(isLiked, agentConfigIsLiked, likedMcpConfigIds, likedCustomPromptIds)));
        }).WithName("GetSolution").WithSummary("根据ID获取解决方案详情");

        group.MapPost(string.Empty, async (ICurrentUser currentUser, AppDbContext db, CreateSolutionRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var user = await db.Users.FindAsync(userId);
            var agentConfig = await db.AgentConfigs.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == request.AgentConfigId);
            
            var entity = new Solution
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Name = request.Name,
                Description = request.Description,
                AiTool = request.AiTool,
                AgentConfigId = request.AgentConfigId,
                Tags = request.Tags ?? new(),
                IsPublic = request.IsPublic,
                Compatibility = request.Compatibility ?? new Compatibility(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                User = user!,
                AgentConfig = agentConfig!
            };

            if (request.McpConfigIds?.Any() == true)
            {
                var mcp = await db.McpConfigs.Include(m => m.User).Where(x => request.McpConfigIds.Contains(x.Id)).ToListAsync();
                foreach (var item in mcp) entity.McpConfigs.Add(item);
            }

            if (request.CustomPromptIds?.Any() == true)
            {
                var prompts = await db.CustomPrompts.Include(p => p.User).Where(x => request.CustomPromptIds.Contains(x.Id)).ToListAsync();
                foreach (var item in prompts) entity.CustomPrompts.Add(item);
            }

            db.Solutions.Add(entity);
            await db.SaveChangesAsync();
            return Results.Created($"/api/solutions/{entity.Id}", ApiResponse.Ok(entity.ToDetailDto()));
        }).WithName("CreateSolution").WithSummary("创建解决方案");

        group.MapPut("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db, UpdateSolutionRequest request) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.Solutions
                .Include(s => s.User)
                .Include(s => s.AgentConfig).ThenInclude(a => a.User)
                .Include(s => s.McpConfigs).ThenInclude(m => m.User)
                .Include(s => s.CustomPrompts).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();

            entity.Name = request.Name ?? entity.Name;
            entity.Description = request.Description ?? entity.Description;
            entity.AiTool = request.AiTool ?? entity.AiTool;
            entity.Tags = request.Tags ?? entity.Tags;
            entity.IsPublic = request.IsPublic ?? entity.IsPublic;
            entity.Compatibility = request.Compatibility ?? entity.Compatibility;

            if (request.AgentConfigId.HasValue && request.AgentConfigId != entity.AgentConfigId)
            {
                entity.AgentConfigId = request.AgentConfigId.Value;
                entity.AgentConfig = (await db.AgentConfigs.Include(a => a.User).FirstOrDefaultAsync(a => a.Id == request.AgentConfigId.Value))!;
            }

            if (request.McpConfigIds != null)
            {
                entity.McpConfigs.Clear();
                var mcp = await db.McpConfigs.Include(m => m.User).Where(x => request.McpConfigIds.Contains(x.Id)).ToListAsync();
                foreach (var item in mcp) entity.McpConfigs.Add(item);
            }

            if (request.CustomPromptIds != null)
            {
                entity.CustomPrompts.Clear();
                var prompts = await db.CustomPrompts.Include(p => p.User).Where(x => request.CustomPromptIds.Contains(x.Id)).ToListAsync();
                foreach (var item in prompts) entity.CustomPrompts.Add(item);
            }

            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            // Get liked status for all related resources
            var mcpConfigIds = entity.McpConfigs.Select(m => m.Id).ToList();
            var customPromptIds = entity.CustomPrompts.Select(p => p.Id).ToList();

            var likes = await db.UserLikes
                .Where(l => l.UserId == userId && (
                    (l.ResourceType == LikeResourceType.Solution && l.ResourceId == id) ||
                    (l.ResourceType == LikeResourceType.AgentConfig && l.ResourceId == entity.AgentConfigId) ||
                    (l.ResourceType == LikeResourceType.McpConfig && mcpConfigIds.Contains(l.ResourceId)) ||
                    (l.ResourceType == LikeResourceType.CustomPrompt && customPromptIds.Contains(l.ResourceId))
                ))
                .ToListAsync();

            var isLiked = likes.Any(l => l.ResourceType == LikeResourceType.Solution && l.ResourceId == id);
            var agentConfigIsLiked = likes.Any(l => l.ResourceType == LikeResourceType.AgentConfig && l.ResourceId == entity.AgentConfigId);
            var likedMcpConfigIds = likes.Where(l => l.ResourceType == LikeResourceType.McpConfig).Select(l => l.ResourceId).ToHashSet();
            var likedCustomPromptIds = likes.Where(l => l.ResourceType == LikeResourceType.CustomPrompt).Select(l => l.ResourceId).ToHashSet();

            return Results.Ok(ApiResponse.Ok(entity.ToDetailDto(isLiked, agentConfigIsLiked, likedMcpConfigIds, likedCustomPromptIds)));
        }).WithName("UpdateSolution").WithSummary("更新解决方案");

        group.MapDelete("/{id:guid}", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.Solutions.FirstOrDefaultAsync(s => s.Id == id);
            if (entity == null) return Results.NotFound();
            if (entity.UserId != userId) return Results.Forbid();
            db.Solutions.Remove(entity);
            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok());
        }).WithName("DeleteSolution").WithSummary("删除解决方案");

        group.MapPost("/{id:guid}/like", async (Guid id, ICurrentUser currentUser, AppDbContext db) =>
        {
            if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
                return Results.Unauthorized();

            var userId = currentUser.UserId.Value;
            var entity = await db.Solutions.FindAsync(id);
            if (entity == null) return Results.NotFound();

            var existingLike = await db.UserLikes.FirstOrDefaultAsync(l => 
                l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.Solution);

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
                    ResourceType = LikeResourceType.Solution,
                    CreatedAt = DateTime.UtcNow
                });
                entity.Likes += 1;
                isLiked = true;
            }

            await db.SaveChangesAsync();
            return Results.Ok(ApiResponse.Ok(new SolutionLikeDto(entity.Likes, isLiked)));
        }).WithName("LikeSolution").WithSummary("点赞/取消点赞解决方案");

        group.MapPost("/{id:guid}/apply", (Guid id) =>
        {
            // 这里预留应用方案的实际实现
            return Results.Ok(ApiResponse.Ok(new SolutionApplyDto(id)));
        }).WithName("ApplySolution").WithSummary("应用解决方案");

        return app;
    }
}

public record CreateSolutionRequest([Required] string Name, string Description, [Required] AiTool AiTool, [Required] Guid AgentConfigId, List<Guid>? McpConfigIds, List<Guid>? CustomPromptIds, List<string>? Tags, bool IsPublic = true, Compatibility? Compatibility = null);
public record UpdateSolutionRequest(string? Name, string? Description, AiTool? AiTool, Guid? AgentConfigId, List<Guid>? McpConfigIds, List<Guid>? CustomPromptIds, List<string>? Tags, bool? IsPublic, Compatibility? Compatibility);
