namespace ACP.Domain.Entities;

public class UserSettings
{
    public Theme Theme { get; set; } = Theme.System;
    public bool NotificationsEnabled { get; set; } = true;
}