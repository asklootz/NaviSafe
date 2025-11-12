using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NaviSafe.Models;

public class Organisation
{
    [Key]
    [Column("orgNr")]
    public int OrgNr { get; set; }
    
    [Column("orgName")]
    [MaxLength(255)]
    public string OrgName { get; set; } = string.Empty;
}