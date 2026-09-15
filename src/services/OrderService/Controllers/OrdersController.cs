using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderService.Clients;
using OrderService.Data;
using OrderService.DTOs;
using OrderService.Models;

namespace OrderService.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController : ControllerBase
{
    private readonly OrderDbContext _context;
    private readonly IUserServiceClient _userClient;
    private readonly IProductServiceClient _productClient;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(
        OrderDbContext context,
        IUserServiceClient userClient,
        IProductServiceClient productClient,
        ILogger<OrdersController> logger)
    {
        _context = context;
        _userClient = userClient;
        _productClient = productClient;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<OrderResponse>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        _logger.LogInformation("Starting checkout orchestration for user {UserId} with {ItemCount} items",
            request.UserId, request.Items.Count);

        // 1. Validate User existence
        var user = await _userClient.GetUserByIdAsync(request.UserId);
        if (user == null)
        {
            _logger.LogWarning("Checkout rejected: User {UserId} does not exist", request.UserId);
            return BadRequest(new ProblemDetails
            {
                Title = "Invalid User",
                Detail = $"User with ID '{request.UserId}' does not exist.",
                Status = StatusCodes.Status400BadRequest
            });
        }

        // Tracking deducted items for compensating rollback if failure occurs
        var deductedItems = new List<(Guid ProductId, int Quantity)>();
        var orderItems = new List<OrderItem>();
        decimal totalAmount = 0;

        // 2. Synchronous item deduction with compensation support
        foreach (var item in request.Items)
        {
            var product = await _productClient.GetProductByIdAsync(item.ProductId);
            if (product == null)
            {
                _logger.LogWarning("Checkout failed: Product {ProductId} not found. Triggering compensating rollback", item.ProductId);
                await ExecuteCompensatingRollbackAsync(deductedItems);
                return BadRequest(new ProblemDetails
                {
                    Title = "Product Not Found",
                    Detail = $"Product with ID '{item.ProductId}' does not exist in catalog.",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var deductionResult = await _productClient.DeductStockAsync(item.ProductId, item.Quantity);
            if (!deductionResult.Success)
            {
                _logger.LogWarning("Checkout aborted: Stock deduction failed for product {ProductId}. Triggering compensating rollback",
                    item.ProductId);

                await ExecuteCompensatingRollbackAsync(deductedItems);

                if (deductionResult.IsInsufficientStock)
                {
                    return Conflict(new ProblemDetails
                    {
                        Title = "Insufficient stock for requested operation",
                        Detail = $"Insufficient stock for product '{product.Name}' ({product.Sku}).",
                        Status = StatusCodes.Status409Conflict
                    });
                }

                return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
                {
                    Title = "Inventory Error",
                    Detail = deductionResult.ErrorMessage ?? "Error processing inventory deduction.",
                    Status = StatusCodes.Status500InternalServerError
                });
            }

            // Track successfully deducted stock
            deductedItems.Add((item.ProductId, item.Quantity));
            totalAmount += product.Price * item.Quantity;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = item.Quantity
            });
        }

        // 3. Persist Order in orders_db
        try
        {
            var order = new Order
            {
                UserId = request.UserId,
                TotalAmount = totalAmount,
                Status = OrderStatus.Confirmed,
                CreatedAt = DateTime.UtcNow,
                Items = orderItems
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} successfully confirmed for user {UserId}. Total: {TotalAmount:C}",
                order.Id, order.UserId, order.TotalAmount);

            var response = MapToResponse(order);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist order to database. Triggering compensating rollback on {Count} deducted items",
                deductedItems.Count);

            await ExecuteCompensatingRollbackAsync(deductedItems);

            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Order Persistence Failed",
                Detail = "Could not save order. All inventory allocations have been compensated and restored.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderResponse>>> GetAll([FromQuery] Guid? userId)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .AsNoTracking();

        if (userId.HasValue)
        {
            query = query.Where(o => o.UserId == userId.Value);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(MapToResponse));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderResponse>> GetById(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found", id);
            return NotFound(new ProblemDetails
            {
                Title = "Order Not Found",
                Detail = $"Order with ID '{id}' was not found.",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(MapToResponse(order));
    }

    private async Task ExecuteCompensatingRollbackAsync(List<(Guid ProductId, int Quantity)> itemsToRestore)
    {
        if (itemsToRestore.Count == 0) return;

        _logger.LogWarning("Executing compensating rollback for {Count} previously deducted items", itemsToRestore.Count);

        foreach (var (productId, quantity) in itemsToRestore)
        {
            var success = await _productClient.RestoreStockAsync(productId, quantity);
            if (!success)
            {
                _logger.LogCritical("CRITICAL: Failed to compensate stock for product {ProductId}, quantity {Quantity}! Manual intervention required",
                    productId, quantity);
            }
        }
    }

    private static OrderResponse MapToResponse(Order order)
    {
        return new OrderResponse(
            order.Id,
            order.UserId,
            order.TotalAmount,
            order.Status.ToString(),
            order.CreatedAt,
            order.Items.Select(i => new OrderItemResponse(
                i.Id,
                i.ProductId,
                i.ProductName,
                i.UnitPrice,
                i.Quantity,
                i.TotalPrice
            )).ToList()
        );
    }
}
