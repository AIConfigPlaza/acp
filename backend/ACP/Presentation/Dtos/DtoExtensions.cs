using ACP.Domain.Entities;

namespace ACP.Presentation.Dtos;

public static class DtoExtensions
{
    public static UserSummaryDto ToSummaryDto(this User user) =>
        new(user.Id, user.Username, user.AvatarUrl);

    public static UserDto ToDto(this User user) =>
        new(
            user.Id,
            user.Username,
            user.Email,
            user.AvatarUrl,
            user.Bio,
            user.Role,
            new UserSettingsDto(user.Settings.Theme, user.Settings.NotificationsEnabled),
            user.CreatedAt,
            user.UpdatedAt
        );

    public static McpConfigDto ToDto(this McpConfig config, bool isLikedByCurrentUser = false) =>
        new(
            config.Id,
            config.Name,
            config.Description,
            config.ConfigJson,
            config.Tags,
            config.IsPublic,
            config.Downloads,
            config.Likes,
            config.Rating,
            isLikedByCurrentUser,
            config.User.ToSummaryDto(),
            config.CreatedAt,
            config.UpdatedAt
        );

    public static AgentConfigDto ToDto(this AgentConfig config, bool isLikedByCurrentUser = false) =>
        new(
            config.Id,
            config.Name,
            config.Description,
            config.Content,
            config.Format,
            config.Tags,
            config.IsPublic,
            config.Downloads,
            config.Likes,
            config.Rating,
            isLikedByCurrentUser,
            config.User.ToSummaryDto(),
            config.CreatedAt,
            config.UpdatedAt
        );

    public static CustomPromptDto ToDto(this CustomPrompt prompt, bool isLikedByCurrentUser = false) =>
        new(
            prompt.Id,
            prompt.Name,
            prompt.Description,
            prompt.Content,
            prompt.Tags,
            prompt.IsPublic,
            prompt.Downloads,
            prompt.Likes,
            prompt.Rating,
            isLikedByCurrentUser,
            prompt.User.ToSummaryDto(),
            prompt.CreatedAt,
            prompt.UpdatedAt
        );

    public static SkillResourceDto ToDto(this SkillResource resource) =>
        new(
            resource.Id,
            resource.SkillId,
            resource.RelativePath,
            resource.FileName,
            resource.FileContent,
            resource.CreatedAt,
            resource.UpdatedAt
        );

    public static SkillDto ToDto(this Skill skill, bool isLikedByCurrentUser = false) =>
        new(
            skill.Id,
            skill.Name,
            skill.SkillMarkdown,
            skill.Tags,
            skill.IsPublic,
            skill.Downloads,
            skill.Likes,
            skill.Rating,
            isLikedByCurrentUser,
            skill.User.ToSummaryDto(),
            skill.CreatedAt,
            skill.UpdatedAt
        );

    public static SkillDetailDto ToDetailDto(this Skill skill, bool isLikedByCurrentUser = false) =>
        new(
            skill.Id,
            skill.Name,
            skill.SkillMarkdown,
            skill.Tags,
            skill.IsPublic,
            skill.Downloads,
            skill.Likes,
            skill.Rating,
            isLikedByCurrentUser,
            skill.User.ToSummaryDto(),
            skill.SkillResources.Select(r => r.ToDto()).ToList(),
            skill.CreatedAt,
            skill.UpdatedAt
        );

    public static SolutionDto ToDto(this Solution solution, bool isLikedByCurrentUser = false, bool agentConfigIsLiked = false) =>
        new(
            solution.Id,
            solution.Name,
            solution.Description,
            solution.AiTool,
            solution.AgentConfigId,
            solution.Tags,
            solution.IsPublic,
            solution.Downloads,
            solution.Likes,
            solution.Rating,
            isLikedByCurrentUser,
            solution.Compatibility,
            solution.User.ToSummaryDto(),
            solution.AgentConfig?.ToDto(agentConfigIsLiked),
            solution.CreatedAt,
            solution.UpdatedAt
        );

    public static SolutionDetailDto ToDetailDto(
        this Solution solution, 
        bool isLikedByCurrentUser = false,
        bool agentConfigIsLiked = false,
        HashSet<Guid>? likedMcpConfigIds = null,
        HashSet<Guid>? likedCustomPromptIds = null,
        HashSet<Guid>? likedSkillIds = null) =>
        new(
            solution.Id,
            solution.Name,
            solution.Description,
            solution.AiTool,
            solution.AgentConfigId,
            solution.Tags,
            solution.IsPublic,
            solution.Downloads,
            solution.Likes,
            solution.Rating,
            isLikedByCurrentUser,
            solution.Compatibility,
            solution.User.ToSummaryDto(),
            solution.AgentConfig?.ToDto(agentConfigIsLiked),
            solution.McpConfigs.Select(m => m.ToDto(likedMcpConfigIds?.Contains(m.Id) ?? false)).ToList(),
            solution.CustomPrompts.Select(p => p.ToDto(likedCustomPromptIds?.Contains(p.Id) ?? false)).ToList(),
            solution.Skills.Select(s => s.ToDto(likedSkillIds?.Contains(s.Id) ?? false)).ToList(),
            solution.CreatedAt,
            solution.UpdatedAt
        );

    public static CliTokenDto ToDto(this CliToken token) =>
        new(
            token.Id,
            token.Token,
            token.CreatedAt,
            token.LastUsedAt
        );

    #region CLI 专用 DTO 转换方法

    /// <summary>
    /// 转换为 CLI 专用 Solution 列表 DTO
    /// </summary>
    public static CliSolutionDto ToCliDto(this Solution solution, bool isOwner, bool isLiked, bool agentConfigIsLiked = false) =>
        new(
            solution.Id,
            solution.Name,
            solution.Description,
            solution.AiTool,
            solution.AgentConfigId,
            solution.Tags,
            solution.IsPublic,
            isOwner,
            isLiked,
            solution.Downloads,
            solution.Likes,
            solution.Rating,
            solution.Compatibility,
            solution.User.ToSummaryDto(),
            solution.AgentConfig?.ToCliDto(isOwner: solution.AgentConfig.UserId == solution.UserId, isLiked: agentConfigIsLiked),
            solution.CreatedAt,
            solution.UpdatedAt
        );

    /// <summary>
    /// 转换为 CLI 专用 Solution 详情 DTO
    /// </summary>
    public static CliSolutionDetailDto ToCliDetailDto(
        this Solution solution,
        bool isOwner,
        bool isLiked,
        bool agentConfigIsLiked = false,
        HashSet<Guid>? likedMcpConfigIds = null,
        HashSet<Guid>? likedCustomPromptIds = null,
        HashSet<Guid>? likedSkillIds = null) =>
        new(
            solution.Id,
            solution.Name,
            solution.Description,
            solution.AiTool,
            solution.AgentConfigId,
            solution.Tags,
            solution.IsPublic,
            isOwner,
            isLiked,
            solution.Downloads,
            solution.Likes,
            solution.Rating,
            solution.Compatibility,
            solution.User.ToSummaryDto(),
            solution.AgentConfig?.ToCliDto(
                isOwner: solution.AgentConfig.UserId == solution.UserId,
                isLiked: agentConfigIsLiked),
            solution.McpConfigs.Select(m => m.ToCliDto(
                isOwner: m.UserId == solution.UserId,
                isLiked: likedMcpConfigIds?.Contains(m.Id) ?? false)).ToList(),
            solution.CustomPrompts.Select(p => p.ToCliDto(
                isOwner: p.UserId == solution.UserId,
                isLiked: likedCustomPromptIds?.Contains(p.Id) ?? false)).ToList(),
            solution.Skills.Select(s => s.ToCliDto(
                isOwner: s.UserId == solution.UserId,
                isLiked: likedSkillIds?.Contains(s.Id) ?? false)).ToList(),
            solution.CreatedAt,
            solution.UpdatedAt
        );

    /// <summary>
    /// 转换为 CLI 专用 Agent 配置 DTO
    /// </summary>
    public static CliAgentConfigDto ToCliDto(this AgentConfig config, bool isOwner, bool isLiked) =>
        new(
            config.Id,
            config.Name,
            config.Description,
            config.Content,
            config.Format,
            config.Tags,
            config.IsPublic,
            isOwner,
            isLiked,
            config.Downloads,
            config.Likes,
            config.Rating,
            config.User.ToSummaryDto(),
            config.CreatedAt,
            config.UpdatedAt
        );

    /// <summary>
    /// 转换为 CLI 专用 Prompt DTO
    /// </summary>
    public static CliCustomPromptDto ToCliDto(this CustomPrompt prompt, bool isOwner, bool isLiked) =>
        new(
            prompt.Id,
            prompt.Name,
            prompt.Description,
            prompt.Content,
            prompt.Tags,
            prompt.IsPublic,
            isOwner,
            isLiked,
            prompt.Downloads,
            prompt.Likes,
            prompt.Rating,
            prompt.User.ToSummaryDto(),
            prompt.CreatedAt,
            prompt.UpdatedAt
        );

    /// <summary>
    /// 转换为 CLI 专用 MCP 配置 DTO
    /// </summary>
    public static CliMcpConfigDto ToCliDto(this McpConfig config, bool isOwner, bool isLiked) =>
        new(
            config.Id,
            config.Name,
            config.Description,
            config.ConfigJson,
            config.Tags,
            config.IsPublic,
            isOwner,
            isLiked,
            config.Downloads,
            config.Likes,
            config.Rating,
            config.User.ToSummaryDto(),
            config.CreatedAt,
            config.UpdatedAt
        );

    /// <summary>
    /// 转换为 CLI 专用 SkillResource DTO
    /// </summary>
    public static CliSkillResourceDto ToCliDto(this SkillResource resource) =>
        new(
            resource.Id,
            resource.SkillId,
            resource.RelativePath,
            resource.FileName,
            resource.FileContent,
            resource.CreatedAt,
            resource.UpdatedAt
        );

    /// <summary>
    /// 转换为 CLI 专用 Skill DTO
    /// </summary>
    public static CliSkillDto ToCliDto(this Skill skill, bool isOwner, bool isLiked) =>
        new(
            skill.Id,
            skill.Name,
            skill.SkillMarkdown,
            skill.Tags,
            skill.IsPublic,
            isOwner,
            isLiked,
            skill.Downloads,
            skill.Likes,
            skill.Rating,
            skill.User.ToSummaryDto(),
            skill.SkillResources.Select(r => r.ToCliDto()).ToList(),
            skill.CreatedAt,
            skill.UpdatedAt
        );

    #endregion
}
