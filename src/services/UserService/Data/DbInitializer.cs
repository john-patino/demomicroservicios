using Microsoft.EntityFrameworkCore;
using UserService.Models;
using UserService.Services;

namespace UserService.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(UserDbContext context, IPasswordHasher hasher, ILogger logger)
    {
        try
        {
            await context.Database.EnsureCreatedAsync();

            if (await context.Users.AnyAsync())
            {
                return;
            }

            logger.LogInformation("Seeding demo users into users_db...");

            var demoUsers = new List<User>
            {
                new()
                {
                    Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    FullName = "Alice Smith (Demo User)",
                    Email = "alice@example.com",
                    PasswordHash = hasher.HashPassword("Password123!"),
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    FullName = "Bob Jones (Demo User)",
                    Email = "bob@example.com",
                    PasswordHash = hasher.HashPassword("Password123!"),
                    CreatedAt = DateTime.UtcNow
                },
                new()
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    FullName = "Carol White (Demo User)",
                    Email = "carol@example.com",
                    PasswordHash = hasher.HashPassword("Password123!"),
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Users.AddRangeAsync(demoUsers);
            await context.SaveChangesAsync();
            logger.LogInformation("Successfully seeded {Count} demo users", demoUsers.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing or seeding users_db");
        }
    }
}
