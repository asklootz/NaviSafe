using System.ComponentModel.DataAnnotations;

namespace NaviSafe.Models;

public class ObstacleDataForm
{
    [Required(ErrorMessage = "Obstacle name is required")]
    [MaxLength(100)]
    public string shortDesc { get; set; } = string.Empty;
    
    //[Required(ErrorMessage = "Obstacle description is required")]
    [MaxLength(1000)]
    public string longDesc { get; set; } = string.Empty;

    public float? lat { get; set; } = null;

    public float? lon { get; set; } = null;
    
    public string? geoJSON { get; set; } = null;
    
    //[Required(ErrorMessage = "Obstacle height is required")]
    [Range(0.1, 100.0, ErrorMessage = "Height must be between 0.1 and 100.0 meters")]
    public float? altitude { get; set; } = null;
    
    public string state { get; set; } = "Pending";
    
    public bool isSent { get; set; } = false;
    
}