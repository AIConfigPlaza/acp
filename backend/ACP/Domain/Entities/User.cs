using System.ComponentModel.DataAnnotations;

namespace ACP.Domain.Entities;

public class User
{
    public Guid Id { get; set; }

    [MaxLength(128)]
    public string GitHubId { get; set; } = string.Empty;

    [MaxLength(64)]
    public string Username { get; set; } = string.Empty;

    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(512)]
    public string AvatarUrl { get; set; } = string.Empty;

    [MaxLength(1024)]
    public string Bio { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.User;

    [MaxLength(256)]
    public string ApiToken { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpiresAt { get; set; }

    public UserSettings Settings { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<McpConfig> McpConfigs { get; set; } = new List<McpConfig>();
    public virtual ICollection<AgentConfig> AgentConfigs { get; set; } = new List<AgentConfig>();
    public virtual ICollection<CustomPrompt> CustomPrompts { get; set; } = new List<CustomPrompt>();
    public virtual ICollection<Solution> Solutions { get; set; } = new List<Solution>();
    public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();
    public virtual ICollection<CliToken> CliTokens { get; set; } = new List<CliToken>();
    public virtual ICollection<UserLike> UserLikes { get; set; } = new List<UserLike>();
}