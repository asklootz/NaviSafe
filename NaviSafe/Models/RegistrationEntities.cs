namespace NaviSafe.Models;

public class Reporting
{
    public int RegID { get; set; } // maps to regID (PK)
    public float Lat { get; set; }
    public float Lon { get; set; }
    public float? Altitude { get; set; }
    public int? Accuracy { get; set; }
    public string? ShortDesc { get; set; }
    public string? LongDesc { get; set; }
    public byte[]? Img { get; set; } // mediumblob
    public bool IsSent { get; set; }
    public string State { get; set; } = "PENDING"; // 'SENT','PENDING','REJECTED'
    public string? RejectComment { get; set; }
    public int UserID { get; set; }
    public DateTime CreationDate { get; set; } = DateTime.UtcNow;
}