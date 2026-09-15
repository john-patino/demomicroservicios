using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductService.Data;
using ProductService.DTOs;

namespace ProductService.Controllers;

[ApiController]
[Route("api/v1/products")]
public class ProductsController : ControllerBase
{
    private readonly ProductDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(ProductDbContext context, ILogger<ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductResponse>>> GetAll()
    {
        var products = await _context.Products
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(p => new ProductResponse(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.Stock,
                p.Sku,
                p.ImageUrl))
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductResponse>> GetById(Guid id)
    {
        var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
        {
            _logger.LogWarning("Product with ID {ProductId} not found", id);
            return NotFound(new ProblemDetails
            {
                Title = "Product Not Found",
                Detail = $"Product with ID '{id}' does not exist in catalog.",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(new ProductResponse(
            product.Id,
            product.Name,
            product.Description,
            product.Price,
            product.Stock,
            product.Sku,
            product.ImageUrl));
    }

    [HttpPatch("{id:guid}/deduct-stock")]
    public async Task<ActionResult<StockOperationResponse>> DeductStock(Guid id, [FromBody] UpdateStockRequest request)
    {
        _logger.LogInformation("Attempting to atomically deduct {Quantity} units for product {ProductId}", request.Quantity, id);

        // Atomic decrement in PostgreSQL: UPDATE WHERE Id = id AND Stock >= quantity
        var rowsAffected = await _context.Products
            .Where(p => p.Id == id && p.Stock >= request.Quantity)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock - request.Quantity));

        if (rowsAffected == 0)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == id);
            if (!productExists)
            {
                _logger.LogWarning("Deduct stock failed: Product {ProductId} not found", id);
                return NotFound(new ProblemDetails
                {
                    Title = "Product Not Found",
                    Detail = $"Product with ID '{id}' does not exist.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            _logger.LogWarning("Deduct stock conflict: Insufficient stock for product {ProductId}", id);
            return Conflict(new ProblemDetails
            {
                Title = "Insufficient stock for requested operation",
                Detail = $"Requested quantity '{request.Quantity}' exceeds available inventory for product '{id}'.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var remainingStock = await _context.Products
            .Where(p => p.Id == id)
            .Select(p => p.Stock)
            .FirstAsync();

        _logger.LogInformation("Successfully deducted {Quantity} units for product {ProductId}. Remaining stock: {RemainingStock}",
            request.Quantity, id, remainingStock);

        return Ok(new StockOperationResponse(id, remainingStock, "Stock deducted successfully"));
    }

    [HttpPatch("{id:guid}/restore-stock")]
    public async Task<ActionResult<StockOperationResponse>> RestoreStock(Guid id, [FromBody] UpdateStockRequest request)
    {
        _logger.LogInformation("Executing compensating action: restoring {Quantity} units for product {ProductId}", request.Quantity, id);

        var rowsAffected = await _context.Products
            .Where(p => p.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Stock, p => p.Stock + request.Quantity));

        if (rowsAffected == 0)
        {
            _logger.LogError("Compensating action failed: Product {ProductId} not found to restore stock", id);
            return NotFound(new ProblemDetails
            {
                Title = "Product Not Found",
                Detail = $"Product with ID '{id}' does not exist to restore inventory.",
                Status = StatusCodes.Status404NotFound
            });
        }

        var updatedStock = await _context.Products
            .Where(p => p.Id == id)
            .Select(p => p.Stock)
            .FirstAsync();

        _logger.LogInformation("Compensating action succeeded: restored {Quantity} units for product {ProductId}. New stock: {UpdatedStock}",
            request.Quantity, id, updatedStock);

        return Ok(new StockOperationResponse(id, updatedStock, "Stock restored successfully (compensating action)"));
    }
}
