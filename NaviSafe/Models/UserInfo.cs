using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NaviSafe.Models;

public class UserInfo
{
    [Key]
    [Column("userID")]
    public int UserId { get; set; }
    
    [Column("firstName")]
    public string? FirstName { get; set; }
    
    [Column("lastName")]
    public string? LastName { get; set; }
    
    [Column("email")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
    
    [Column("phone")]
    [MaxLength(255)]
    public string Phone { get; set; } = string.Empty;
    
    [Column("orgNr")]
    public int OrgNr { get; set; }
    
    [Column("roleID")]
    [MaxLength(5)]
    public string RoleId { get; set; } = string.Empty;
    
    [Column("creationDate")]
    public DateTime CreationDate { get; set; }
}