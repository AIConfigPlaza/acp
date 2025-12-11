using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

/// <summary>
/// CLI 专用接口，使用 CLI Token 进行鉴权
/// 仅返回用户自己创建的数据，或点赞过的公开数据
/// </summary>
public static class CliEndpoints
{
    public static IEndpointRouteBuilder MapCliEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cli").AllowAnonymous();

        // 获取用户的 Solution 列表（自己创建的 + 点赞过的公开数据）
        group.MapGet("/solutions", GetUserSolutions)
            .WithName("CliGetSolutions")
            .WithSummary("获取用户的解决方案列表（自己创建的和点赞过的公开数据）");

        // 获取用户的 Agent 配置列表
        group.MapGet("/agents", GetUserAgents)
            .WithName("CliGetAgents")
            .WithSummary("获取用户的Agent配置列表（自己创建的和点赞过的公开数据）");

        // 获取用户的 Prompt 列表
        group.MapGet("/prompts", GetUserPrompts)
            .WithName("CliGetPrompts")
            .WithSummary("获取用户的Prompt列表（自己创建的和点赞过的公开数据）");

        // 获取用户的 MCP 配置列表
        group.MapGet("/mcps", GetUserMcpConfigs)
            .WithName("CliGetMcpConfigs")
            .WithSummary("获取用户的MCP配置列表（自己创建的和点赞过的公开数据）");

        // 根据ID获取Solution详情
        group.MapGet("/solutions/{id:guid}", GetSolutionById)
            .WithName("CliGetSolutionById")
            .WithSummary("根据ID获取解决方案详情");

        // 根据ID获取Agent配置详情
        group.MapGet("/agents/{id:guid}", GetAgentById)
            .WithName("CliGetAgentById")
            .WithSummary("根据ID获取Agent配置详情");

        // 根据ID获取Prompt详情
        group.MapGet("/prompts/{id:guid}", GetPromptById)
            .WithName("CliGetPromptById")
            .WithSummary("根据ID获取Prompt详情");

        // 根据ID获取MCP配置详情
        group.MapGet("/mcps/{id:guid}", GetMcpConfigById)
            .WithName("CliGetMcpConfigById")
            .WithSummary("根据ID获取MCP配置详情");

        return app;
    }

    /// <summary>
    /// 获取用户的 Solution 列表（全量）
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, Ok<ApiResponse<List<CliSolutionDto>>>>> GetUserSolutions(
        ICurrentUser currentUser,
        AppDbContext db,
        [FromQuery] string? aiTool = null)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        // 获取用户点赞的 Solution IDs
        var likedSolutionIds = await db.UserLikes
            .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.Solution)
            .Select(l => l.ResourceId)
            .ToListAsync();

        // 查询：用户自己创建的 OR 点赞过的公开数据
        var query = db.Solutions
            .Include(s => s.User)
            .Include(s => s.AgentConfig).ThenInclude(a => a.User)
            .Where(s => s.UserId == userId || (likedSolutionIds.Contains(s.Id) && s.IsPublic));

        // 可选过滤：AI工具类型
        if (!string.IsNullOrWhiteSpace(aiTool) && Enum.TryParse<AiTool>(aiTool, true, out var tool))
        {
            query = query.Where(s => s.AiTool == tool);
        }

        var items = await query
            .OrderByDescending(s => s.CreatedAt)
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
        var likedAgentConfigIdsSet = likes.Where(l => l.ResourceType == LikeResourceType.AgentConfig).Select(l => l.ResourceId).ToHashSet();

        var dtos = items.Select(s => s.ToCliDto(
            isOwner: s.UserId == userId,
            isLiked: likedSolutionIdsSet.Contains(s.Id),
            agentConfigIsLiked: likedAgentConfigIdsSet.Contains(s.AgentConfigId)
        )).ToList();

        return TypedResults.Ok(ApiResponse.Ok(dtos));
    }

    /// <summary>
    /// 获取用户的 Agent 配置列表（全量）
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, Ok<ApiResponse<List<CliAgentConfigDto>>>>> GetUserAgents(
        ICurrentUser currentUser,
        AppDbContext db)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        // 获取用户点赞的 AgentConfig IDs
        var likedAgentIds = await db.UserLikes
            .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.AgentConfig)
            .Select(l => l.ResourceId)
            .ToListAsync();

        // 查询：用户自己创建的 OR 点赞过的公开数据
        var items = await db.AgentConfigs
            .Include(a => a.User)
            .Where(a => a.UserId == userId || (likedAgentIds.Contains(a.Id) && a.IsPublic))
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        // 获取点赞状态
        var itemIds = items.Select(a => a.Id).ToList();
        var likedIds = await db.UserLikes
            .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.AgentConfig && itemIds.Contains(l.ResourceId))
            .Select(l => l.ResourceId)
            .ToHashSetAsync();

        var dtos = items.Select(a => a.ToCliDto(
            isOwner: a.UserId == userId,
            isLiked: likedIds.Contains(a.Id)
        )).ToList();

        return TypedResults.Ok(ApiResponse.Ok(dtos));
    }

    /// <summary>
    /// 获取用户的 Prompt 列表（全量）
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, Ok<ApiResponse<List<CliCustomPromptDto>>>>> GetUserPrompts(
        ICurrentUser currentUser,
        AppDbContext db)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        // 获取用户点赞的 CustomPrompt IDs
        var likedPromptIds = await db.UserLikes
            .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.CustomPrompt)
            .Select(l => l.ResourceId)
            .ToListAsync();

        // 查询：用户自己创建的 OR 点赞过的公开数据
        var items = await db.CustomPrompts
            .Include(p => p.User)
            .Where(p => p.UserId == userId || (likedPromptIds.Contains(p.Id) && p.IsPublic))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        // 获取点赞状态
        var itemIds = items.Select(p => p.Id).ToList();
        var likedIds = await db.UserLikes
            .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.CustomPrompt && itemIds.Contains(l.ResourceId))
            .Select(l => l.ResourceId)
            .ToHashSetAsync();

        var dtos = items.Select(p => p.ToCliDto(
            isOwner: p.UserId == userId,
            isLiked: likedIds.Contains(p.Id)
        )).ToList();

        return TypedResults.Ok(ApiResponse.Ok(dtos));
    }

    /// <summary>
    /// 获取用户的 MCP 配置列表（全量）
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, Ok<ApiResponse<List<CliMcpConfigDto>>>>> GetUserMcpConfigs(
        ICurrentUser currentUser,
        AppDbContext db)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        // 获取用户点赞的 McpConfig IDs
        var likedMcpIds = await db.UserLikes
            .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.McpConfig)
            .Select(l => l.ResourceId)
            .ToListAsync();

        // 查询：用户自己创建的 OR 点赞过的公开数据
        var items = await db.McpConfigs
            .Include(m => m.User)
            .Where(m => m.UserId == userId || (likedMcpIds.Contains(m.Id) && m.IsPublic))
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        // 获取点赞状态
        var itemIds = items.Select(m => m.Id).ToList();
        var likedIds = await db.UserLikes
            .Where(l => l.UserId == userId && l.ResourceType == LikeResourceType.McpConfig && itemIds.Contains(l.ResourceId))
            .Select(l => l.ResourceId)
            .ToHashSetAsync();

        var dtos = items.Select(m => m.ToCliDto(
            isOwner: m.UserId == userId,
            isLiked: likedIds.Contains(m.Id)
        )).ToList();

        return TypedResults.Ok(ApiResponse.Ok(dtos));
    }

    /// <summary>
    /// 根据ID获取 Solution 详情
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, NotFound<ApiResponse>, ForbidHttpResult, Ok<ApiResponse<CliSolutionDetailDto>>>> GetSolutionById(
        Guid id,
        ICurrentUser currentUser,
        AppDbContext db)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        var entity = await db.Solutions
            .Include(s => s.User)
            .Include(s => s.AgentConfig).ThenInclude(a => a.User)
            .Include(s => s.McpConfigs).ThenInclude(m => m.User)
            .Include(s => s.CustomPrompts).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (entity == null)
            return TypedResults.NotFound(ApiResponse.Fail("NOT_FOUND", "Solution 不存在"));

        // 检查访问权限：只有自己创建的或点赞过的公开数据才能访问
        var isOwner = entity.UserId == userId;
        var isLiked = await db.UserLikes.AnyAsync(l =>
            l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.Solution);

        if (!isOwner && !(isLiked && entity.IsPublic))
            return TypedResults.Forbid();

        // 更新下载数量（包括 Solution 及其关联的所有资源）
        entity.Downloads++;
        
        // 更新关联的 AgentConfig 下载量
        if (entity.AgentConfig != null)
        {
            entity.AgentConfig.Downloads++;
        }
        
        // 更新关联的 McpConfigs 下载量
        foreach (var mcpConfig in entity.McpConfigs)
        {
            mcpConfig.Downloads++;
        }
        
        // 更新关联的 CustomPrompts 下载量
        foreach (var customPrompt in entity.CustomPrompts)
        {
            customPrompt.Downloads++;
        }
        
        await db.SaveChangesAsync();

        // 获取所有相关资源的点赞状态
        var mcpConfigIds = entity.McpConfigs.Select(m => m.Id).ToList();
        var customPromptIds = entity.CustomPrompts.Select(p => p.Id).ToList();

        var likes = await db.UserLikes
            .Where(l => l.UserId == userId && (
                (l.ResourceType == LikeResourceType.AgentConfig && l.ResourceId == entity.AgentConfigId) ||
                (l.ResourceType == LikeResourceType.McpConfig && mcpConfigIds.Contains(l.ResourceId)) ||
                (l.ResourceType == LikeResourceType.CustomPrompt && customPromptIds.Contains(l.ResourceId))
            ))
            .ToListAsync();

        var agentConfigIsLiked = likes.Any(l => l.ResourceType == LikeResourceType.AgentConfig && l.ResourceId == entity.AgentConfigId);
        var likedMcpConfigIds = likes.Where(l => l.ResourceType == LikeResourceType.McpConfig).Select(l => l.ResourceId).ToHashSet();
        var likedCustomPromptIds = likes.Where(l => l.ResourceType == LikeResourceType.CustomPrompt).Select(l => l.ResourceId).ToHashSet();

        return TypedResults.Ok(ApiResponse.Ok(entity.ToCliDetailDto(
            isOwner: isOwner,
            isLiked: isLiked,
            agentConfigIsLiked: agentConfigIsLiked,
            likedMcpConfigIds: likedMcpConfigIds,
            likedCustomPromptIds: likedCustomPromptIds
        )));
    }

    /// <summary>
    /// 根据ID获取 Agent 配置详情
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, NotFound<ApiResponse>, ForbidHttpResult, Ok<ApiResponse<CliAgentConfigDto>>>> GetAgentById(
        Guid id,
        ICurrentUser currentUser,
        AppDbContext db)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        var entity = await db.AgentConfigs
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (entity == null)
            return TypedResults.NotFound(ApiResponse.Fail("NOT_FOUND", "Agent 配置不存在"));

        // 检查访问权限
        var isOwner = entity.UserId == userId;
        var isLiked = await db.UserLikes.AnyAsync(l =>
            l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.AgentConfig);

        if (!isOwner && !(isLiked && entity.IsPublic))
            return TypedResults.Forbid();

        // 更新下载数量
        entity.Downloads++;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ApiResponse.Ok(entity.ToCliDto(isOwner, isLiked)));
    }

    /// <summary>
    /// 根据ID获取 Prompt 详情
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, NotFound<ApiResponse>, ForbidHttpResult, Ok<ApiResponse<CliCustomPromptDto>>>> GetPromptById(
        Guid id,
        ICurrentUser currentUser,
        AppDbContext db)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        var entity = await db.CustomPrompts
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (entity == null)
            return TypedResults.NotFound(ApiResponse.Fail("NOT_FOUND", "Prompt 不存在"));

        // 检查访问权限
        var isOwner = entity.UserId == userId;
        var isLiked = await db.UserLikes.AnyAsync(l =>
            l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.CustomPrompt);

        if (!isOwner && !(isLiked && entity.IsPublic))
            return TypedResults.Forbid();

        // 更新下载数量
        entity.Downloads++;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ApiResponse.Ok(entity.ToCliDto(isOwner, isLiked)));
    }

    /// <summary>
    /// 根据ID获取 MCP 配置详情
    /// </summary>
    private static async Task<Results<UnauthorizedHttpResult, NotFound<ApiResponse>, ForbidHttpResult, Ok<ApiResponse<CliMcpConfigDto>>>> GetMcpConfigById(
        Guid id,
        ICurrentUser currentUser,
        AppDbContext db)
    {
        if (!currentUser.IsAuthenticated || !currentUser.UserId.HasValue)
            return TypedResults.Unauthorized();

        var userId = currentUser.UserId.Value;

        var entity = await db.McpConfigs
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (entity == null)
            return TypedResults.NotFound(ApiResponse.Fail("NOT_FOUND", "MCP 配置不存在"));

        // 检查访问权限
        var isOwner = entity.UserId == userId;
        var isLiked = await db.UserLikes.AnyAsync(l =>
            l.UserId == userId && l.ResourceId == id && l.ResourceType == LikeResourceType.McpConfig);

        if (!isOwner && !(isLiked && entity.IsPublic))
            return TypedResults.Forbid();

        // 更新下载数量
        entity.Downloads++;
        await db.SaveChangesAsync();

        return TypedResults.Ok(ApiResponse.Ok(entity.ToCliDto(isOwner, isLiked)));
    }
}
