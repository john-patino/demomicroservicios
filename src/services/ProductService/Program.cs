using Microsoft.EntityFrameworkCore;
using ProductService.Data;
using SharedKernel.Logging;

var builder = WebApplication.CreateBuilder(args);

// Centralized Serilog configuration
builder.ConfigureCentralizedLogging("ProductService");

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5433;Database=products_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ProductDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
    });
});

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

// Auto-migrate & seed demo product catalog
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var dbContext = services.GetRequiredService<ProductDbContext>();

    await DbInitializer.InitializeAsync(dbContext, logger);
}

app.Run();
