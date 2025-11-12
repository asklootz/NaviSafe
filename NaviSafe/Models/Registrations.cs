using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NaviSafe.Models;

public class Registration
{
    [Key]
    [Column("regID")]
    public int RegId { get; set; }
    
    [Column("lat")]
    public float Lat { get; set; }
    
    [Column("lon")]
    public float Lon { get; set; }
    
    [Column("altitude")]
    public float? Altitude { get; set; }
    
    [Column("accuracy")]
    public int? Accuracy { get; set; }
    
    [Column("shortDesc")]
    [MaxLength(50)]
    public string? ShortDesc { get; set; }
    
    [Column("longDesc")]
    [MaxLength(255)]
    public string? LongDesc { get; set; }
    
    [Column("img")]
    public byte[]? Img { get; set; }
    
    [Column("isSent")]
    public bool IsSent { get; set; }
    
    [Column("state")]
    public string State { get; set; } = string.Empty;
    
    [Column("rejectComment")]
    public string? RejectComment { get; set; }
    
    [Column("userID")]
    public int UserId { get; set; }
    
    [Column("creationDate")]
    public DateTime CreationDate { get; set; }
}