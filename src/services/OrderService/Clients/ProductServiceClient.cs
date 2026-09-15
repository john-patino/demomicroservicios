using System.Net;
using System.Net.Http.Json;

namespace OrderService.Clients;

public class ProductServiceClient : IProductServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ProductServiceClient> _logger;

    public ProductServiceClient(HttpClient httpClient, ILogger<ProductServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ProductClientResponse?> GetProductByIdAsync(Guid productId, CancellationToken ct = default)
    {
        _logger.LogInformation("Calling ProductService for product details {ProductId}", productId);

        try
        {
            var response = await _httpClient.GetAsync($"/api/v1/products/{productId}", ct);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ProductClientResponse>(cancellationToken: ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TimeoutException or OperationCanceledException)
        {
            using (Serilog.Context.LogContext.PushProperty("FaultyService", "ProductService"))
            using (Serilog.Context.LogContext.PushProperty("TargetEndpoint", $"/api/v1/products/{productId}"))
            {
                _logger.LogError(ex, "Downstream failure calling ProductService for product {ProductId}. Reason: {ErrorMessage}", productId, ex.Message);
            }
            throw;
        }
    }

    public async Task<StockDeductionResult> DeductStockAsync(Guid productId, int quantity, CancellationToken ct = default)
    {
        _logger.LogInformation("Requesting stock deduction in ProductService for product {ProductId}, quantity {Quantity}", productId, quantity);

        try
        {
            var requestBody = new UpdateStockClientRequest(quantity);
            var response = await _httpClient.PatchAsJsonAsync($"/api/v1/products/{productId}/deduct-stock", requestBody, ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Stock deduction successful for product {ProductId}", productId);
                return new StockDeductionResult(true, false, false, null);
            }

            if (response.StatusCode == HttpStatusCode.Conflict)
            {
                _logger.LogWarning("ProductService reported 409 Conflict (Insufficient Stock) for product {ProductId}", productId);
                return new StockDeductionResult(false, true, false, "Insufficient stock for requested operation");
            }

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning("ProductService reported 404 Not Found for product {ProductId}", productId);
                return new StockDeductionResult(false, false, true, $"Product with ID '{productId}' not found");
            }

            var errorDetail = await response.Content.ReadAsStringAsync(ct);
            using (Serilog.Context.LogContext.PushProperty("FaultyService", "ProductService"))
            using (Serilog.Context.LogContext.PushProperty("TargetEndpoint", $"/api/v1/products/{productId}/deduct-stock"))
            {
                _logger.LogError("Unexpected error deducting stock for product {ProductId}. Status: {StatusCode}, Body: {Body}",
                    productId, response.StatusCode, errorDetail);
            }

            return new StockDeductionResult(false, false, false, $"Failed to deduct stock: {response.StatusCode}");
        }
        catch (Exception ex) when (ex is HttpRequestException or TimeoutException or OperationCanceledException)
        {
            using (Serilog.Context.LogContext.PushProperty("FaultyService", "ProductService"))
            using (Serilog.Context.LogContext.PushProperty("TargetEndpoint", $"/api/v1/products/{productId}/deduct-stock"))
            {
                _logger.LogError(ex, "Downstream failure calling ProductService deduct-stock for product {ProductId}. Reason: {ErrorMessage}", productId, ex.Message);
            }
            throw;
        }
    }

    public async Task<bool> RestoreStockAsync(Guid productId, int quantity, CancellationToken ct = default)
    {
        _logger.LogWarning("Calling ProductService COMPENSATING ACTION (restore-stock) for product {ProductId}, quantity {Quantity}",
            productId, quantity);

        try
        {
            var requestBody = new UpdateStockClientRequest(quantity);
            var response = await _httpClient.PatchAsJsonAsync($"/api/v1/products/{productId}/restore-stock", requestBody, ct);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully executed compensating stock rollback for product {ProductId}", productId);
                return true;
            }

            _logger.LogError("Compensating action failed for product {ProductId}. Status: {StatusCode}", productId, response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while executing compensating rollback for product {ProductId}", productId);
            return false;
        }
    }
}
