using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentPortal.Data;
using StudentPortal.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace StudentPortal.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly StudentDbContext _context;
        private readonly IConfiguration _configuration;

        public UsersController(
            StudentDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // =========================================================
        // GET: api/Users
        // Only Admin can view users
        // =========================================================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users.ToListAsync();

            return Ok(users);
        }


        // =========================================================
        // POST: api/Users/register
        // Student Registration
        // No login required
        // =========================================================

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(
            [FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is required");
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Password is required");
            }

            // Check whether email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest("Email already exists");
            }

            // Create Student account
            var user = new User
            {
                Email = request.Email,
                Password = request.Password,
                Role = "Student"
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Student registered successfully",
                userId = user.Id,
                email = user.Email,
                role = user.Role
            });
        }


        // =========================================================
        // POST: api/Users/create-teacher
        // Only Admin can create Teacher accounts
        // =========================================================

        [HttpPost("create-teacher")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateTeacher(
            [FromBody] TeacherCreateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName))
            {
                return BadRequest("Full name is required");
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is required");
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Password is required");
            }

            // Check whether email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest("Email already exists");
            }

            // Create Teacher account
            var teacher = new User
            {
                Email = request.Email,
                Password = request.Password,
                Role = "Teacher"
            };

            _context.Users.Add(teacher);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Teacher account created successfully",
                userId = teacher.Id,
                fullName = request.FullName,
                email = teacher.Email,
                role = teacher.Role
            });
        }


        // =========================================================
        // POST: api/Users/login
        // Student / Teacher / Admin Login
        // =========================================================

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest("Email is required");
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Password is required");
            }

            // Find user by email and password
            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Email == request.Email &&
                    u.Password == request.Password);

            if (user == null)
            {
                return Unauthorized("Invalid email or password");
            }


            // =====================================================
            // Create JWT Claims
            // =====================================================

            var claims = new[]
            {
                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()
                ),

                new Claim(
                    ClaimTypes.Email,
                    user.Email
                ),

                new Claim(
                    ClaimTypes.Role,
                    user.Role
                )
            };


            // =====================================================
            // Get JWT configuration
            // =====================================================

            var jwtKey = _configuration["Jwt:Key"];

            if (string.IsNullOrEmpty(jwtKey))
            {
                return StatusCode(
                    500,
                    "JWT key is not configured"
                );
            }


            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            if (string.IsNullOrEmpty(issuer))
            {
                return StatusCode(
                    500,
                    "JWT issuer is not configured"
                );
            }

            if (string.IsNullOrEmpty(audience))
            {
                return StatusCode(
                    500,
                    "JWT audience is not configured"
                );
            }


            // =====================================================
            // Create signing key
            // =====================================================

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );


            // =====================================================
            // Create JWT Token
            // =====================================================

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: credentials
            );


            var jwtToken =
                new JwtSecurityTokenHandler().WriteToken(token);


            // =====================================================
            // Login Response
            // =====================================================

            return Ok(new
            {
                token = jwtToken,
                userId = user.Id,
                email = user.Email,
                role = user.Role
            });
        }
    }
}