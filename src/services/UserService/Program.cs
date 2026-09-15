using Microsoft.EntityFrameworkCore;
using SharedKernel.Logging;
using UserService.Data;
using UserService.Services;

var builder = WebApplication.CreateBuilder(args);

// Centralized Serilog configuration
builder.ConfigureCentralizedLogging("UserService");

// Database configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=users_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<UserDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
    {
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null);
    });
});

// Domain services
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

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

// Auto-migrate & seed demo users
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var dbContext = services.GetRequiredService<UserDbContext>();
    var hasher = services.GetRequiredService<IPasswordHasher>();

    await DbInitializer.InitializeAsync(dbContext, hasher, logger);
}

app.Run();
