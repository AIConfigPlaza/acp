using System.Collections.Generic;
using System.Linq;
using ACP.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace ACP.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected AppDbContext()
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<McpConfig> McpConfigs => Set<McpConfig>();
    public DbSet<AgentConfig> AgentConfigs => Set<AgentConfig>();
    public DbSet<CustomPrompt> CustomPrompts => Set<CustomPrompt>();
    public DbSet<Solution> Solutions => Set<Solution>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<SkillResource> SkillResources => Set<SkillResource>();
    public DbSet<CliToken> CliTokens => Set<CliToken>();
    public DbSet<UserLike> UserLikes => Set<UserLike>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
      var stringListConverter = new ValueConverter<List<string>, string>(
        v => string.Join(',', v ?? new()),
        v => (v ?? string.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries).ToList());

      // User
      modelBuilder.Entity<User>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.GitHubId);
        entity.HasIndex(e => e.ApiToken).IsUnique();
        entity.OwnsOne(e => e.Settings);
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
      });

      // McpConfig
      modelBuilder.Entity<McpConfig>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Tags)
            .HasConversion(stringListConverter)
            .HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.HasOne(e => e.User)
            .WithMany(u => u.McpConfigs)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
      });

      // AgentConfig
      modelBuilder.Entity<AgentConfig>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.Format);
        entity.Property(e => e.Tags)
            .HasConversion(stringListConverter)
            .HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.HasOne(e => e.User)
            .WithMany(u => u.AgentConfigs)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
      });

      // CustomPrompt
      modelBuilder.Entity<CustomPrompt>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Tags)
            .HasConversion(stringListConverter)
            .HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.HasOne(e => e.User)
            .WithMany(u => u.CustomPrompts)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
      });

      // Solution
      modelBuilder.Entity<Solution>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.AgentConfigId);
        entity.Property(e => e.Tags)
            .HasConversion(stringListConverter)
            .HasColumnType("text");
        entity.OwnsOne(e => e.Compatibility);
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

        entity.HasOne(e => e.User)
            .WithMany(u => u.Solutions)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.AgentConfig)
            .WithMany(a => a.Solutions)
            .HasForeignKey(e => e.AgentConfigId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasMany(e => e.McpConfigs)
            .WithMany(m => m.Solutions)
            .UsingEntity(j => j.ToTable("SolutionMcpConfigs"));

        entity.HasMany(e => e.CustomPrompts)
            .WithMany(p => p.Solutions)
            .UsingEntity(j => j.ToTable("SolutionCustomPrompts"));

        entity.HasMany(e => e.Skills)
            .WithMany(s => s.Solutions)
            .UsingEntity(j => j.ToTable("SolutionSkills"));
      });

      // Skill
      modelBuilder.Entity<Skill>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Tags)
            .HasConversion(stringListConverter)
            .HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.HasOne(e => e.User)
            .WithMany(u => u.Skills)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
      });

      // SkillResource
      modelBuilder.Entity<SkillResource>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.HasOne(e => e.Skill)
            .WithMany(s => s.SkillResources)
            .HasForeignKey(e => e.SkillId)
            .OnDelete(DeleteBehavior.Cascade);
      });

      // CliToken
      modelBuilder.Entity<CliToken>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => e.Token).IsUnique();
        entity.HasIndex(e => e.UserId).IsUnique();
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.HasOne(e => e.User)
            .WithMany(u => u.CliTokens)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
      });

      // UserLike
      modelBuilder.Entity<UserLike>(entity =>
      {
        entity.HasKey(e => e.Id);
        entity.HasIndex(e => new { e.UserId, e.ResourceId, e.ResourceType }).IsUnique();
        entity.HasIndex(e => new { e.ResourceId, e.ResourceType });
        entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
        entity.HasOne(e => e.User)
            .WithMany(u => u.UserLikes)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
      });
    }
}
