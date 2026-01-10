using ACP.Application.Auth;
using ACP.Domain.Entities;
using ACP.Infrastructure.Data;
using ACP.Presentation.Dtos;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ACP.Presentation.Endpoints;

/// <summary>
/// 官网聚合查询端点 - 支持匿名访问
/// </summary>
public static class ExploreEndpoints
{
    public static IEndpointRouteBuilder MapExploreEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/explore");

        // 聚合查询 - 返回所有类型的数据
        group.MapGet(string.Empty, GetExploreData)
            .WithName("GetExploreData")
            .WithSummary("获取官网聚合数据，支持匿名访问和分页");

        // 单独查询各类型数据
        group.MapGet("/solutions", GetSolutions)
            .WithName("ExploreSolutions")
            .WithSummary("获取解决方案列表");

        group.MapGet("/agents", GetAgents)
            .WithName("ExploreAgents")
            .WithSummary("获取Agent配置列表");

        group.MapGet("/prompts", GetPrompts)
            .WithName("ExplorePrompts")
            .WithSummary("获取自定义提示词列表");

        group.MapGet("/mcps", GetMcps)
            .WithName("ExploreMcps")
            .WithSummary("获取MCP配置列表");

        group.MapGet("/skills", GetSkills)
            .WithName("ExploreSkills")
            .WithSummary("获取Skills列表");

        return app;
    }

    /// <summary>
    /// 聚合查询 - 返回所有类型的公开数据（支持分页）
    /// </summary>
    private static async Task<IResult> GetExploreData(
        ICurrentUser currentUser,
        AppDbContext db,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] ExploreSortBy sortBy = ExploreSortBy.Likes)
    {
        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 50 ? 20 : limit;

        // 并行查询所有类型的数据
        var solutionsTask = QuerySolutions(db, currentUser, page, limit, search, sortBy);
        var agentsTask = QueryAgents(db, currentUser, page, limit, search, sortBy);
        var promptsTask = QueryPrompts(db, currentUser, page, limit, search, sortBy);
        var mcpsTask = QueryMcps(db, currentUser, page, limit, search, sortBy);
        var skillsTask = QuerySkills(db, currentUser, page, limit, search, sortBy);

        await Task.WhenAll(solutionsTask, agentsTask, promptsTask, mcpsTask, skillsTask);

        var result = new ExploreAggregateDto(
            Solutions: new ExplorePagedList<SolutionDto>(solutionsTask.Result.Items, solutionsTask.Result.Total),
            Agents: new ExplorePagedList<AgentConfigDto>(agentsTask.Result.Items, agentsTask.Result.Total),
            Prompts: new ExplorePagedList<CustomPromptDto>(promptsTask.Result.Items, promptsTask.Result.Total),
            Mcps: new ExplorePagedList<McpConfigDto>(mcpsTask.Result.Items, mcpsTask.Result.Total),
            Skills: new ExplorePagedList<SkillDto>(skillsTask.Result.Items, skillsTask.Result.Total)
        );

        return Results.Ok(ApiResponse.Ok(result, new PaginationMeta(page, limit, 0)));
    }

    /// <summary>
    /// 分页查询解决方案列表
    /// </summary>
    private static async Task<IResult> GetSolutions(
        ICurrentUser currentUser,
        AppDbContext db,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] ExploreSortBy sortBy = ExploreSortBy.Likes)
    {
        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 100 ? 20 : limit;

        var result = await QuerySolutions(db, currentUser, page, limit, search, sortBy);
        return Results.Ok(ApiResponse.Ok(result.Items, new PaginationMeta(page, limit, result.Total)));
    }

    /// <summary>
    /// 分页查询Agent配置列表
    /// </summary>
    private static async Task<IResult> GetAgents(
        ICurrentUser currentUser,
        AppDbContext db,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] ExploreSortBy sortBy = ExploreSortBy.Likes)
    {
        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 100 ? 20 : limit;

        var result = await QueryAgents(db, currentUser, page, limit, search, sortBy);
        return Results.Ok(ApiResponse.Ok(result.Items, new PaginationMeta(page, limit, result.Total)));
    }

    /// <summary>
    /// 分页查询自定义提示词列表
    /// </summary>
    private static async Task<IResult> GetPrompts(
        ICurrentUser currentUser,
        AppDbContext db,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] ExploreSortBy sortBy = ExploreSortBy.Likes)
    {
        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 100 ? 20 : limit;

        var result = await QueryPrompts(db, currentUser, page, limit, search, sortBy);
        return Results.Ok(ApiResponse.Ok(result.Items, new PaginationMeta(page, limit, result.Total)));
    }

    /// <summary>
    /// 分页查询MCP配置列表
    /// </summary>
    private static async Task<IResult> GetMcps(
        ICurrentUser currentUser,
        AppDbContext db,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] ExploreSortBy sortBy = ExploreSortBy.Likes)
    {
        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 100 ? 20 : limit;

        var result = await QueryMcps(db, currentUser, page, limit, search, sortBy);
        return Results.Ok(ApiResponse.Ok(result.Items, new PaginationMeta(page, limit, result.Total)));
    }

    /// <summary>
    /// 分页查询Skills列表
    /// </summary>
    private static async Task<IResult> GetSkills(
        ICurrentUser currentUser,
        AppDbContext db,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? search = null,
        [FromQuery] ExploreSortBy sortBy = ExploreSortBy.Likes)
    {
        page = page <= 0 ? 1 : page;
        limit = limit is <= 0 or > 100 ? 20 : limit;

        var result = await QuerySkills(db, currentUser, page, limit, search, sortBy);
        return Results.Ok(ApiResponse.Ok(result.Items, new PaginationMeta(page, limit, result.Total)));
    }

    #region 私有查询方法

    private static async Task<(List<SolutionDto> Items, int Total)> QuerySolutions(
        AppDbContext db, ICurrentUser currentUser, int page, int limit, string? search, ExploreSortBy sortBy)
    {
        var query = db.Solutions
            .Include(s => s.User)
            .Include(s => s.AgentConfig).ThenInclude(a => a.User)
            .Where(s => s.IsPublic)
            .AsQueryable();

        // 名称模糊查询
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => EF.Functions.ILike(s.Name, $"%{search}%") || 
                                     EF.Functions.ILike(s.Description, $"%{search}%"));
        }

        // 排序
        query = sortBy switch
        {
            ExploreSortBy.Likes => query.OrderByDescending(s => s.Likes).ThenByDescending(s => s.CreatedAt),
            ExploreSortBy.Downloads => query.OrderByDescending(s => s.Downloads).ThenByDescending(s => s.CreatedAt),
            ExploreSortBy.CreatedAt => query.OrderByDescending(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.Likes).ThenByDescending(s => s.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();

        // 获取当前用户点赞状态
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

        return (dtos, total);
    }

    private static async Task<(List<AgentConfigDto> Items, int Total)> QueryAgents(
        AppDbContext db, ICurrentUser currentUser, int page, int limit, string? search, ExploreSortBy sortBy)
    {
        var query = db.AgentConfigs
            .Include(a => a.User)
            .Where(a => a.IsPublic)
            .AsQueryable();

        // 名称模糊查询
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a => EF.Functions.ILike(a.Name, $"%{search}%") || 
                                     EF.Functions.ILike(a.Description, $"%{search}%"));
        }

        // 排序
        query = sortBy switch
        {
            ExploreSortBy.Likes => query.OrderByDescending(a => a.Likes).ThenByDescending(a => a.CreatedAt),
            ExploreSortBy.Downloads => query.OrderByDescending(a => a.Downloads).ThenByDescending(a => a.CreatedAt),
            ExploreSortBy.CreatedAt => query.OrderByDescending(a => a.CreatedAt),
            _ => query.OrderByDescending(a => a.Likes).ThenByDescending(a => a.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();

        // 获取当前用户点赞状态
        var likedIds = new HashSet<Guid>();
        if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
        {
            var resourceIds = items.Select(a => a.Id).ToList();
            likedIds = (await db.UserLikes
                .Where(l => l.UserId == currentUser.UserId.Value && 
                            l.ResourceType == LikeResourceType.AgentConfig && 
                            resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToListAsync()).ToHashSet();
        }

        var dtos = items.Select(a => a.ToDto(likedIds.Contains(a.Id))).ToList();
        return (dtos, total);
    }

    private static async Task<(List<CustomPromptDto> Items, int Total)> QueryPrompts(
        AppDbContext db, ICurrentUser currentUser, int page, int limit, string? search, ExploreSortBy sortBy)
    {
        var query = db.CustomPrompts
            .Include(p => p.User)
            .Where(p => p.IsPublic)
            .AsQueryable();

        // 名称模糊查询
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p => EF.Functions.ILike(p.Name, $"%{search}%") || 
                                     EF.Functions.ILike(p.Description, $"%{search}%"));
        }

        // 排序
        query = sortBy switch
        {
            ExploreSortBy.Likes => query.OrderByDescending(p => p.Likes).ThenByDescending(p => p.CreatedAt),
            ExploreSortBy.Downloads => query.OrderByDescending(p => p.Downloads).ThenByDescending(p => p.CreatedAt),
            ExploreSortBy.CreatedAt => query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.Likes).ThenByDescending(p => p.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();

        // 获取当前用户点赞状态
        var likedIds = new HashSet<Guid>();
        if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
        {
            var resourceIds = items.Select(p => p.Id).ToList();
            likedIds = (await db.UserLikes
                .Where(l => l.UserId == currentUser.UserId.Value && 
                            l.ResourceType == LikeResourceType.CustomPrompt && 
                            resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToListAsync()).ToHashSet();
        }

        var dtos = items.Select(p => p.ToDto(likedIds.Contains(p.Id))).ToList();
        return (dtos, total);
    }

    private static async Task<(List<McpConfigDto> Items, int Total)> QueryMcps(
        AppDbContext db, ICurrentUser currentUser, int page, int limit, string? search, ExploreSortBy sortBy)
    {
        var query = db.McpConfigs
            .Include(m => m.User)
            .Where(m => m.IsPublic)
            .AsQueryable();

        // 名称模糊查询
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(m => EF.Functions.ILike(m.Name, $"%{search}%") || 
                                     EF.Functions.ILike(m.Description, $"%{search}%"));
        }

        // 排序
        query = sortBy switch
        {
            ExploreSortBy.Likes => query.OrderByDescending(m => m.Likes).ThenByDescending(m => m.CreatedAt),
            ExploreSortBy.Downloads => query.OrderByDescending(m => m.Downloads).ThenByDescending(m => m.CreatedAt),
            ExploreSortBy.CreatedAt => query.OrderByDescending(m => m.CreatedAt),
            _ => query.OrderByDescending(m => m.Likes).ThenByDescending(m => m.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();

        // 获取当前用户点赞状态
        var likedIds = new HashSet<Guid>();
        if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
        {
            var resourceIds = items.Select(m => m.Id).ToList();
            likedIds = (await db.UserLikes
                .Where(l => l.UserId == currentUser.UserId.Value && 
                            l.ResourceType == LikeResourceType.McpConfig && 
                            resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToListAsync()).ToHashSet();
        }

        var dtos = items.Select(m => m.ToDto(likedIds.Contains(m.Id))).ToList();
        return (dtos, total);
    }

    private static async Task<(List<SkillDto> Items, int Total)> QuerySkills(
        AppDbContext db, ICurrentUser currentUser, int page, int limit, string? search, ExploreSortBy sortBy)
    {
        var query = db.Skills
            .Include(s => s.User)
            .Where(s => s.IsPublic)
            .AsQueryable();

        // 名称模糊查询
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(s => EF.Functions.ILike(s.Name, $"%{search}%") || 
                                     EF.Functions.ILike(s.SkillMarkdown, $"%{search}%"));
        }

        // 排序
        query = sortBy switch
        {
            ExploreSortBy.Likes => query.OrderByDescending(s => s.Likes).ThenByDescending(s => s.CreatedAt),
            ExploreSortBy.Downloads => query.OrderByDescending(s => s.Downloads).ThenByDescending(s => s.CreatedAt),
            ExploreSortBy.CreatedAt => query.OrderByDescending(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.Likes).ThenByDescending(s => s.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * limit).Take(limit).ToListAsync();

        // 获取当前用户点赞状态
        var likedIds = new HashSet<Guid>();
        if (currentUser.IsAuthenticated && currentUser.UserId.HasValue)
        {
            var resourceIds = items.Select(s => s.Id).ToList();
            likedIds = (await db.UserLikes
                .Where(l => l.UserId == currentUser.UserId.Value && 
                            l.ResourceType == LikeResourceType.Skill && 
                            resourceIds.Contains(l.ResourceId))
                .Select(l => l.ResourceId)
                .ToListAsync()).ToHashSet();
        }

        var dtos = items.Select(s => s.ToDto(likedIds.Contains(s.Id))).ToList();
        return (dtos, total);
    }

    #endregion
}

/// <summary>
/// 探索页面排序方式
/// </summary>
public enum ExploreSortBy
{
    /// <summary>
    /// 按点赞数倒序（默认）
    /// </summary>
    Likes = 0,

    /// <summary>
    /// 按创建时间倒序
    /// </summary>
    CreatedAt = 1,

    /// <summary>
    /// 按下载量倒序
    /// </summary>
    Downloads = 2
}

/// <summary>
/// 探索页面分页列表
/// </summary>
public record ExplorePagedList<T>(List<T> Items, int Total);

/// <summary>
/// 探索页面聚合响应 DTO
/// </summary>
public record ExploreAggregateDto(
    ExplorePagedList<SolutionDto> Solutions,
    ExplorePagedList<AgentConfigDto> Agents,
    ExplorePagedList<CustomPromptDto> Prompts,
    ExplorePagedList<McpConfigDto> Mcps,
    ExplorePagedList<SkillDto> Skills
);
