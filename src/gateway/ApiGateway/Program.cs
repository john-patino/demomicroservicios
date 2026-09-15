using SharedKernel.Logging;

var builder = WebApplication.CreateBuilder(args);

// Centralized Serilog configuration
builder.ConfigureCentralizedLogging("ApiGateway");

// CORS configuration for Frontend clients
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("X-Correlation-ID");
    });
});

// YARP Reverse Proxy configuration from appsettings.json
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

// Enable CORS
app.UseCors("AllowFrontend");

// Distributed tracing middleware
app.UseCorrelationLogging();

// Gateway Health Check endpoint
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "ApiGateway",
    timestamp = DateTime.UtcNow
}));

// Map YARP reverse proxy endpoints
app.MapReverseProxy();

app.Run();
