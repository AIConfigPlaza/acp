using System.ComponentModel.DataAnnotations.Schema;

namespace ACP.Domain.Entities;

public class Solution
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public AiTool AiTool { get; set; }

    public Guid AgentConfigId { get; set; }

    [NotMapped]
    public List<Guid> McpConfigIds { get; set; } = new();

    [NotMapped]
    public List<Guid> CustomPromptIds { get; set; } = new();

    public List<string> Tags { get; set; } = new();

    public bool IsPublic { get; set; } = true;
    public int Downloads { get; set; } = 0;
    public int Likes { get; set; } = 0;
    public decimal Rating { get; set; } = 0;
    public Compatibility Compatibility { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public AgentConfig AgentConfig { get; set; } = null!;
    public ICollection<McpConfig> McpConfigs { get; set; } = new List<McpConfig>();
    public ICollection<CustomPrompt> CustomPrompts { get; set; } = new List<CustomPrompt>();
    public ICollection<Skill> Skills { get; set; } = new List<Skill>();
}