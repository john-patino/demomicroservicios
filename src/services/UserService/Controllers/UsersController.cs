using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;
using UserService.Services;

namespace UserService.Controllers;

[ApiController]
[Route("api/v1/users")]
public class UsersController : ControllerBase
{
    private readonly UserDbContext _context;
    private readonly IPasswordHasher _hasher;
    private readonly ILogger<UsersController> _logger;

    public UsersController(UserDbContext context, IPasswordHasher hasher, ILogger<UsersController> logger)
    {
        _context = context;
        _hasher = hasher;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<UserResponse>> Register([FromBody] RegisterUserRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower()))
        {
            _logger.LogWarning("Registration failed: Email {Email} already registered", request.Email);
            return Problem(
                title: "Email already registered",
                detail: $"A user with email '{request.Email}' already exists.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = _hasher.HashPassword(request.Password)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Registered new user {UserId} with email {Email}", user.Id, user.Email);

        var response = new UserResponse(user.Id, user.FullName, user.Email, user.CreatedAt);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (user == null || !_hasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Invalid login attempt for email {Email}", request.Email);
            return Unauthorized(new ProblemDetails
            {
                Title = "Invalid credentials",
                Detail = "The email or password provided is incorrect.",
                Status = StatusCodes.Status401Unauthorized
            });
        }

        _logger.LogInformation("User {UserId} ({Email}) logged in successfully", user.Id, user.Email);
        return Ok(new UserResponse(user.Id, user.FullName, user.Email, user.CreatedAt));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserResponse>> GetById(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            _logger.LogWarning("User with ID {UserId} was not found", id);
            return NotFound(new ProblemDetails
            {
                Title = "User Not Found",
                Detail = $"No user found with identifier '{id}'.",
                Status = StatusCodes.Status404NotFound
            });
        }

        return Ok(new UserResponse(user.Id, user.FullName, user.Email, user.CreatedAt));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        var users = await _context.Users
            .OrderBy(u => u.FullName)
            .Select(u => new UserResponse(u.Id, u.FullName, u.Email, u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }
}
