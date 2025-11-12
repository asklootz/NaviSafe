using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NaviSafe.Models;

public class UserAuth
{
    [Key]
    [Column("userID")]
    public int UserId { get; set; }
    
    [Column("username")]
    [MaxLength(70)]
    public string Username { get; set; } = string.Empty;
    
    [Column("passHash")]
    [MaxLength(255)]
    public string? PassHash { get; set; }
    
    [Column("passSalt")]
    [MaxLength(255)]
    public string? PassSalt { get; set; }
}