namespace ACP.Presentation.Responses;

/// <summary>
/// Standard API response wrapper
/// </summary>
public record ApiResponse
{
    public bool Success { get; init; }

    public static ApiResponse Ok() => new() { Success = true };
    public static ApiResponse<T> Ok<T>(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Ok<T>(T data, PaginationMeta meta) => new() { Success = true, Data = data, Meta = meta };
    public static ApiResponse Fail(string code, string message) => new ApiErrorResponse { Success = false, Error = new ApiError(code, message) };
    public static ApiResponse Fail(string code, string message, Exception? exception) => new ApiErrorResponse 
    { 
        Success = false, 
        Error = new ApiError(code, message, exception?.StackTrace, exception?.GetType().Name) 
    };
}

/// <summary>
/// Standard API response with data
/// </summary>
public record ApiResponse<T> : ApiResponse
{
    public T? Data { get; init; }
    public PaginationMeta? Meta { get; init; }
}

/// <summary>
/// API error response
/// </summary>
public record ApiErrorResponse : ApiResponse
{
    public ApiError? Error { get; init; }
}

/// <summary>
/// API error details
/// </summary>
public record ApiError(string Code, string Message, string? StackTrace = null, string? ExceptionType = null);

/// <summary>
/// Pagination metadata
/// </summary>
public record PaginationMeta(int Page, int Limit, int Total);
