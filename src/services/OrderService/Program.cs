using Microsoft.EntityFrameworkCore;
using OrderService.Clients;
using OrderService.Data;
using SharedKernel.Logging;

var builder = WebApplication.CreateBuilder(args);

// Centralized Serilog configuration
builder.ConfigureCentralizedLogging("OrderService");

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5434;Database=orders_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<OrderDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
    });
});

// HttpContext accessor & DelegatingHandler for distributed tracing
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<CorrelationIdDelegatingHandler>();

// Typed HTTP clients with Polly resilience & Correlation propagation
var userServiceUrl = builder.Configuration["Services:UserService"] ?? "http://localhost:5001";
builder.Services.AddHttpClient<IUserServiceClient, UserServiceClient>(client =>
{
    client.BaseAddress = new Uri(userServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
})
.AddHttpMessageHandler<CorrelationIdDelegatingHandler>()
.AddStandardResilienceHandler();

var productServiceUrl = builder.Configuration["Services:ProductService"] ?? "http://localhost:5002";
builder.Services.AddHttpClient<IProductServiceClient, ProductServiceClient>(client =>
{
    client.BaseAddress = new Uri(productServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
})
.AddHttpMessageHandler<CorrelationIdDelegatingHandler>()
.AddStandardResilienceHandler();

builder.Services.AddControllers();
builder.Services.AddHealthChecks();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Correlation ID & LogContext middleware
app.UseCorrelationLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapHealthChecks("/health");
app.MapControllers();

// Ensure database exists
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await dbContext.Database.EnsureCreatedAsync();
        logger.LogInformation("Database orders_db initialization checked successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to verify or initialize orders_db");
    }
}

app.Run();
