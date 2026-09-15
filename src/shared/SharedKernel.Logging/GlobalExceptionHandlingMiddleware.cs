using System;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Serilog.Context;

namespace SharedKernel.Logging
{
    public class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

        public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var correlationId = context.Items.TryGetValue(CorrelationIdMiddleware.CorrelationIdHeader, out var corrId)
                ? corrId?.ToString() ?? "Unknown"
                : "Unknown";

            string faultyService = "Internal";
            string targetEndpoint = "Local";
            int statusCode = (int)HttpStatusCode.InternalServerError;
            string errorTitle = "Internal Server Error";

            if (exception is HttpRequestException httpEx)
            {
                statusCode = (int)HttpStatusCode.ServiceUnavailable;
                errorTitle = "Downstream Service Unavailable";
                faultyService = DetectDownstreamService(httpEx.Message);
                targetEndpoint = httpEx.HttpRequestError.ToString();
            }
            else if (exception is TaskCanceledException or TimeoutException)
            {
                statusCode = (int)HttpStatusCode.GatewayTimeout;
                errorTitle = "Downstream Service Timeout";
                faultyService = "Downstream";
                targetEndpoint = "Timeout";
            }

            using (LogContext.PushProperty("FaultyService", faultyService))
            using (LogContext.PushProperty("TargetEndpoint", targetEndpoint))
            using (LogContext.PushProperty("CorrelationId", correlationId))
            {
                _logger.LogError(exception,
                    "Error executing request {Method} {Path}. FaultyService: {FaultyService}, Target: {TargetEndpoint}, CorrelationId: {CorrelationId}",
                    context.Request.Method,
                    context.Request.Path,
                    faultyService,
                    targetEndpoint,
                    correlationId);
            }

            if (!context.Response.HasStarted)
            {
                context.Response.ContentType = "application/problem+json";
                context.Response.StatusCode = statusCode;

                var problemDetails = new
                {
                    type = "https://tools.ietf.org/html/rfc7807",
                    title = errorTitle,
                    status = statusCode,
                    detail = exception.Message,
                    instance = context.Request.Path.Value,
                    correlationId = correlationId,
                    faultyService = faultyService
                };

                var json = JsonSerializer.Serialize(problemDetails);
                await context.Response.WriteAsync(json);
            }
        }

        private static string DetectDownstreamService(string message)
        {
            if (string.IsNullOrEmpty(message)) return "DownstreamService";
            if (message.Contains("productservice", StringComparison.OrdinalIgnoreCase) || message.Contains("5002")) return "ProductService";
            if (message.Contains("userservice", StringComparison.OrdinalIgnoreCase) || message.Contains("5001")) return "UserService";
            if (message.Contains("orderservice", StringComparison.OrdinalIgnoreCase) || message.Contains("5003")) return "OrderService";
            return "DownstreamService";
        }
    }
}
