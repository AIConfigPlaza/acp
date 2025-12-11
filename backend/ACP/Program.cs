using ACP.Application.Auth;
using ACP.Infrastructure.Auth;
using ACP.Infrastructure.Data;
using ACP.Infrastructure.Middleware;
using ACP.Presentation.Endpoints;
using ACP.Presentation.Responses;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// Auth
builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = JwtOptionsFactory.Create(builder.Configuration);
        // 允许 OPTIONS 请求绕过认证（CORS 预检请求）
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // 如果是 OPTIONS 请求，跳过 JWT 认证
                if (context.Request.Method == "OPTIONS")
                {
                    context.Token = null; // 不尝试验证 token
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                // 如果是 OPTIONS 请求，不进行挑战（不返回 401）
                if (context.Request.Method == "OPTIONS")
                {
                    context.HandleResponse();
                    return Task.CompletedTask;
                }
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddHealthChecks();

// Services
builder.Services.AddHttpClient<IGitHubAuthService, GitHubAuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// Minimal API helpers
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Configure JSON serialization to use camelCase and support string enums
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
});

// Configure model validation to return detailed error messages
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .SelectMany(x => x.Value!.Errors.Select(e => new
            {
                Field = x.Key,
                Message = e.ErrorMessage
            }))
            .ToList();

        var errorMessage = string.Join("; ", errors.Select(e => $"{e.Field}: {e.Message}"));
        
        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(ApiResponse.Fail("VALIDATION_ERROR", errorMessage));
    };
});

var app = builder.Build();

// Configure exception handler
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var exceptionHandlerPathFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        
        logger.LogError(exception, "Unhandled exception: {Path}", context.Request.Path);

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        // 使用 ApiResponse 格式返回错误，包含堆栈跟踪
        var errorResponse = ApiResponse.Fail("INTERNAL_ERROR", 
            exception?.Message ?? "An error occurred while processing your request.", 
            exception);

        await context.Response.WriteAsJsonAsync(errorResponse);
    });
});

app.UseStatusCodePages();

app.UseCors();
app.UseAuthentication();
app.UseCliTokenAuthentication();
app.UseAuthorization();

app.MapOpenApi();
app.MapScalarApiReference();

app.MapHealthChecks("/health");
app.MapAuthEndpoints();
app.MapApiEndpoints();

app.Run();
