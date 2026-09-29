using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentPortal.Data;
using StudentPortal.Models;
using System.Security.Claims;

namespace StudentPortal.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly StudentDbContext _context;

        public StudentsController(StudentDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // POST - Register a new student
        // Student registration does not require login
        // =========================================================

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> AddStudent(Student student)
        {
            student.Role = "Student";

            _context.Students.Add(student);

            await _context.SaveChangesAsync();

            return Ok(student);
        }


        // =========================================================
        // GET - Get logged-in student's own details
        // Only Student can view their own details
        // =========================================================

        [HttpGet("my-details")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyDetails()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized("Student email not found");
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(s => s.Email == email);

            if (student == null)
            {
                return NotFound("Student details not found");
            }

            return Ok(student);
        }


        // =========================================================
        // GET - Get all students
        // Only Teacher and Admin can view all students
        // =========================================================

        [HttpGet]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetStudents()
        {
            var students = await _context.Students.ToListAsync();

            return Ok(students);
        }


        // =========================================================
        // GET - Get individual student
        // Only Teacher and Admin can view individual students
        // =========================================================

        [HttpGet("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> GetStudent(int id)
        {
            var student = await _context.Students.FindAsync(id);

            if (student == null)
            {
                return NotFound();
            }

            return Ok(student);
        }


        // =========================================================
        // PUT - Update an existing student
        // Teacher and Admin can update students
        // =========================================================

        [HttpPut("{id}")]
        [Authorize(Roles = "Teacher,Admin")]
        public async Task<IActionResult> UpdateStudent(
            int id,
            Student student)
        {
            var existingStudent =
                await _context.Students.FindAsync(id);

            if (existingStudent == null)
            {
                return NotFound();
            }

            existingStudent.StudentName =
                student.StudentName;

            existingStudent.Course =
                student.Course;

            existingStudent.Location =
                student.Location;

            existingStudent.Email =
                student.Email;

            existingStudent.MobileNumber =
                student.MobileNumber;

            existingStudent.Password =
                student.Password;

            await _context.SaveChangesAsync();

            return Ok(existingStudent);
        }


        // =========================================================
        // DELETE - Delete an existing student
        // Only Admin can delete students
        // =========================================================

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var student =
                await _context.Students.FindAsync(id);

            if (student == null)
            {
                return NotFound();
            }

            _context.Students.Remove(student);

            await _context.SaveChangesAsync();

            return Ok(student);
        }
    }
}