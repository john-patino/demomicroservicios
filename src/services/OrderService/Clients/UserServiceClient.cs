using System.Net;
using System.Net.Http.Json;

namespace OrderService.Clients;

public class UserServiceClient : IUserServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<UserServiceClient> _logger;

    public UserServiceClient(HttpClient httpClient, ILogger<UserServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<UserClientResponse?> GetUserByIdAsync(Guid userId, CancellationToken ct = default)
    {
        _logger.LogInformation("Calling UserService to validate user {UserId}", userId);

        try
        {
            var response = await _httpClient.GetAsync($"/api/v1/users/{userId}", ct);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning("UserService returned 404 Not Found for user {UserId}", userId);
                return null;
            }

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<UserClientResponse>(cancellationToken: ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TimeoutException or OperationCanceledException)
        {
            using (Serilog.Context.LogContext.PushProperty("FaultyService", "UserService"))
            using (Serilog.Context.LogContext.PushProperty("TargetEndpoint", $"/api/v1/users/{userId}"))
            {
                _logger.LogError(ex, "Downstream failure calling UserService for user {UserId}. Reason: {ErrorMessage}", userId, ex.Message);
            }
            throw;
        }
    }
}
