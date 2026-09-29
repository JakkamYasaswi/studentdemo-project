namespace StudentPortal.Models
{
    public class Student
    {
        public int Id { get; set; }

        public string StudentName { get; set; } = string.Empty;

        public string Course { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string MobileNumber { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public string Role { get; set; } = "Student";
    }
}