using System.ComponentModel.DataAnnotations;

namespace NaviSafe.Models;

public class RegisterViewModel
{
    [Required]
    [Display(Name = "First Name")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [Display(Name = "Last Name")]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [Phone]
    [Display(Name = "Phone Number")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [Display(Name = "Organization")]
    public int OrgNr { get; set; } = 1; // matches `organisation.orgNr` in the SQL dump

    [Required]
    [Display(Name = "Role")]
    [RegularExpression("^(ADM|PIL)$", ErrorMessage = "Invalid role selected")]
    public string RoleId { get; set; } = "PIL"; // 'ADM' or 'PIL' per `userRole.roleID`

    [Required]
    [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
    [DataType(DataType.Password)]
    [Display(Name = "Password")]
    public string Password { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    [Display(Name = "Confirm password")]
    [Compare("Password", ErrorMessage = "The password and confirmation password do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}