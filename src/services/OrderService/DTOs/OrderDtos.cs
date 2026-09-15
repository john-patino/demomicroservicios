using System.ComponentModel.DataAnnotations;

namespace OrderService.DTOs;

public record CreateOrderItemRequest(
    [Required] Guid ProductId,
    [Range(1, 1000, ErrorMessage = "Quantity must be at least 1")] int Quantity
);

public record CreateOrderRequest(
    [Required] Guid UserId,
    [Required, MinLength(1, ErrorMessage = "Order must contain at least one item")] List<CreateOrderItemRequest> Items
);

public record OrderItemResponse(
    Guid Id,
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal TotalPrice
);

public record OrderResponse(
    Guid Id,
    Guid UserId,
    decimal TotalAmount,
    string Status,
    DateTime CreatedAt,
    List<OrderItemResponse> Items
);
