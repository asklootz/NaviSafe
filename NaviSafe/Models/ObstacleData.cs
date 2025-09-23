using System.ComponentModel.DataAnnotations;

namespace NaviSafe.Models;

public class ObstacleData
{
    [Required(ErrorMessage = "Obstacle name is required")]
     [MaxLength(100)]
    public string ObstacleName { get; set; }
    
    [Required(ErrorMessage = "Obstacle height is required")]
    [Range(0.1, 100.0, ErrorMessage = "Height must be between 0.1 and 100.0 meters")]
    public double ObstacleHeight { get; set; }
    
    [Required(ErrorMessage = "Obstacle description is required")]
    [MaxLength(1000)]
    public string ObstacleDescription { get; set; }
    
    public string? GeometryGeoJson { get; set; }
}