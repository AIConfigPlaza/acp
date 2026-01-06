using ACP.Presentation.Endpoints;

namespace ACP.Presentation.Endpoints;

public static class ApiEndpoints
{
    public static IEndpointRouteBuilder MapApiEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapExploreEndpoints(); // 匿名访问的探索页面 API
        app.MapUserEndpoints();
        app.MapMcpEndpoints();
        app.MapAgentEndpoints();
        app.MapPromptEndpoints();
        app.MapSkillEndpoints();
        app.MapSolutionEndpoints();
        app.MapCliTokenEndpoints();
        app.MapCliEndpoints(); // CLI 专用接口
        return app;
    }
}