namespace OrderService.Clients;

public interface IUserServiceClient
{
    Task<UserClientResponse?> GetUserByIdAsync(Guid userId, CancellationToken ct = default);
}
