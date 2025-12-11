using System.ComponentModel.DataAnnotations;

namespace ACP.Domain.Entities;

public class CustomPrompt
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1024)]
    public string Description { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = new();

    public bool IsPublic { get; set; } = true;
    public int Downloads { get; set; } = 0;
    public int Likes { get; set; } = 0;
    public decimal Rating { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<Solution> Solutions { get; set; } = new List<Solution>();
}