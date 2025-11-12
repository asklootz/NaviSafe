using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NaviSafe.Models;

public class UserRole
{
    [Key]
    [Column("roleID")]
    [MaxLength(3)]
    public string RoleId { get; set; } = string.Empty;
    
    [Column("rolePermissions")]
    public string RolePermissions { get; set; } = string.Empty;
    
    [Column("permissionsDescription")]
    public string? PermissionsDescription { get; set; }
}