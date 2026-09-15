using System.ComponentModel.DataAnnotations;

namespace ProductService.DTOs;

public record ProductResponse(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int Stock,
    string Sku,
    string ImageUrl
);

public record UpdateStockRequest(
    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    int Quantity
);

public record StockOperationResponse(
    Guid ProductId,
    int RemainingStock,
    string Message
);
