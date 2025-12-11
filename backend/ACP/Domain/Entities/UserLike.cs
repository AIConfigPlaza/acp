namespace ACP.Domain.Entities;

/// <summary>
/// Represents a user's like on a resource (McpConfig, AgentConfig, CustomPrompt, or Solution)
/// </summary>
public class UserLike
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ResourceId { get; set; }
    public LikeResourceType ResourceType { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

/// <summary>
/// Type of resource that can be liked
/// </summary>
public enum LikeResourceType
{
    McpConfig = 0,
    AgentConfig = 1,
    CustomPrompt = 2,
    Solution = 3
}
