namespace ACP.Domain.Entities;

public class CliToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Token { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
    public User User { get; set; } = null!;
}