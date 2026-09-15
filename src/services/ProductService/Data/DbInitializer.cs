using Microsoft.EntityFrameworkCore;
using ProductService.Models;

namespace ProductService.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(ProductDbContext context, ILogger logger)
    {
        try
        {
            await context.Database.EnsureCreatedAsync();

            if (await context.Products.AnyAsync())
            {
                return;
            }

            logger.LogInformation("Seeding demo product catalog into products_db...");

            var demoProducts = new List<Product>
            {
                new()
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                    Name = "MacBook Pro 16\" M3 Max",
                    Description = "Apple M3 Max 16-core CPU, 40-core GPU, 36GB Unified Memory, 1TB SSD Storage.",
                    Price = 3499.00m,
                    Stock = 10,
                    Sku = "TECH-MBP-16",
                    ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60"
                },
                new()
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
                    Name = "Dell XPS 15 OLED",
                    Description = "Intel Core i9-13900H, 32GB RAM, 1TB NVMe, NVIDIA RTX 4070 8GB, 3.5K OLED Touch.",
                    Price = 1999.00m,
                    Stock = 15,
                    Sku = "TECH-XPS-15",
                    ImageUrl = "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop&q=60"
                },
                new()
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000003"),
                    Name = "Sony WH-1000XM5 Wireless Headphones",
                    Description = "Industry-leading noise canceling with Auto NC Optimizer, crystal clear hands-free calling.",
                    Price = 399.00m,
                    Stock = 25,
                    Sku = "AUDIO-SONY-XM5",
                    ImageUrl = "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=60"
                },
                new()
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000004"),
                    Name = "Keychron Q1 Pro Mechanical Keyboard",
                    Description = "Full metal custom keyboard with wireless Bluetooth 5.1 and QMK/VIA programmable knobs.",
                    Price = 199.00m,
                    Stock = 20,
                    Sku = "PERIPH-KEY-Q1",
                    ImageUrl = "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60"
                },
                new()
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000005"),
                    Name = "Logitech MX Master 3S",
                    Description = "Performance wireless mouse with 8K DPI any-surface tracking and quiet clicks.",
                    Price = 99.00m,
                    Stock = 30,
                    Sku = "PERIPH-LOGI-MX3S",
                    ImageUrl = "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60"
                },
                new()
                {
                    Id = Guid.Parse("10000000-0000-0000-0000-000000000006"),
                    Name = "Samsung Odyssey G9 49\" Dual QHD",
                    Description = "1000R curved gaming monitor with 240Hz refresh rate and 1ms response time.",
                    Price = 1299.00m,
                    Stock = 8,
                    Sku = "DISPLAY-SAM-G9",
                    ImageUrl = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60"
                }
            };

            await context.Products.AddRangeAsync(demoProducts);
            await context.SaveChangesAsync();
            logger.LogInformation("Successfully seeded {Count} demo products", demoProducts.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while initializing or seeding products_db");
        }
    }
}
