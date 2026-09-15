namespace OrderService.Clients;

public record UserClientResponse(Guid Id, string FullName, string Email);

public record ProductClientResponse(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    int Stock,
    string Sku,
    string ImageUrl
);

public record UpdateStockClientRequest(int Quantity);

public record StockDeductionResult(
    bool Success,
    bool IsInsufficientStock,
    bool IsNotFound,
    string? ErrorMessage
);
