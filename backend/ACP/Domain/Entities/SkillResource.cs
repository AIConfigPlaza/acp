using System.ComponentModel.DataAnnotations;

namespace ACP.Domain.Entities;

public class SkillResource
{
    public Guid Id { get; set; }
    public Guid SkillId { get; set; }

    public string RelativePath { get; set; } = string.Empty;

    [MaxLength(256)]
    public string FileName { get; set; } = string.Empty;

    public string FileContent { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Skill Skill { get; set; } = null!;
}
