namespace ACP.Application.Auth;

/// <summary>
/// Represents the current authenticated user context
/// </summary>
public interface ICurrentUser
{
    /// <summary>
    /// Gets whether the current request is authenticated
    /// </summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Gets the current user's ID, or null if not authenticated
    /// </summary>
    Guid? UserId { get; }

    /// <summary>
    /// Gets the current user's username, or null if not authenticated
    /// </summary>
    string? Username { get; }

    /// <summary>
    /// Gets the current user's email, or null if not authenticated
    /// </summary>
    string? Email { get; }
}
