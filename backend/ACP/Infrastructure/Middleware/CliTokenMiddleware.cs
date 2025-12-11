using System.Security.Claims;
using ACP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ACP.Infrastructure.Middleware;

public class CliTokenMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            var token = context.Request.Headers["X-CLI-TOKEN"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(token))
            {
                var cliToken = await dbContext.CliTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Token == token);

                if (cliToken?.User != null)
                {
                    cliToken.LastUsedAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync();

                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.NameIdentifier, cliToken.User.Id.ToString()),
                        new Claim(ClaimTypes.Name, cliToken.User.Username),
                        new Claim(ClaimTypes.Email, cliToken.User.Email)
                    };

                    var identity = new ClaimsIdentity(claims, authenticationType: "cli-token");
                    context.User = new ClaimsPrincipal(identity);
                }
            }
        }

        await next(context);
    }
}

public static class CliTokenMiddlewareExtensions
{
    public static IApplicationBuilder UseCliTokenAuthentication(this IApplicationBuilder app)
        => app.UseMiddleware<CliTokenMiddleware>();
}