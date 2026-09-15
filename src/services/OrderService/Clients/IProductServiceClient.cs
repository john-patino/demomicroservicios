namespace OrderService.Clients;

public interface IProductServiceClient
{
    Task<ProductClientResponse?> GetProductByIdAsync(Guid productId, CancellationToken ct = default);
    Task<StockDeductionResult> DeductStockAsync(Guid productId, int quantity, CancellationToken ct = default);
    Task<bool> RestoreStockAsync(Guid productId, int quantity, CancellationToken ct = default);
}
