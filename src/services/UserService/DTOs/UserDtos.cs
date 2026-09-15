using System.ComponentModel.DataAnnotations;

namespace UserService.DTOs;

public record RegisterUserRequest(
    [Required] string FullName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record UserResponse(
    Guid Id,
    string FullName,
    string Email,
    DateTime CreatedAt
);
