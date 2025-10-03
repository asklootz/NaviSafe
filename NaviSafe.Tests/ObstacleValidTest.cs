using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using NaviSafe.Models;
using Xunit;

namespace NaviSafe.Tests;

public class ObstacleValidTest
{
    private static List<ValidationResult> Validate(ObstacleData model)
    {
        var context = new ValidationContext(model);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, context, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void Obstacle_Name_Required()
    {
        var model = new ObstacleData
        {
            ObstacleName = "",
            ObstacleHeight = 1.0,
            ObstacleDescription = "Okay"
        };
        
        var results = Validate(model);
        
        Assert.True(results.Exists(r => r.ErrorMessage == "Obstacle name is required"));
    }

    [Fact]
    public void Obstacle_Height_cant_be_below_requirement()
    {
        var model = new ObstacleData
        {
            ObstacleName = "Tree",
            ObstacleHeight = 0.0,
            ObstacleDescription = "Tall tree"
        };
        
        var results = Validate(model);
        
        Assert.True(results.Exists(r => r.ErrorMessage == "Height must be between 0.1 and 100.0 meters"));

    }

    [Fact]
    public void ObstacleHeight_more_than_max_is_invalid()
    {
        var model = new ObstacleData
        {
            ObstacleName = "Building",
            ObstacleHeight = 170.0,
            ObstacleDescription = "Tall building"

        };
        
        var results = Validate(model);

        Assert.True(results.Exists(r => r.ErrorMessage == "Height must be between 0.1 and 100.0 meters"));
    }

    [Fact]
    public void Obstacle_Description_Required()
    {
        var model = new ObstacleData
        {
            ObstacleName = "Pole",
            ObstacleHeight = 10.0,
            ObstacleDescription = ""
        };
        
        var results = Validate(model);
        
        Assert.True(results.Exists(r => r.ErrorMessage == "Obstacle description is required"));
    }

    [Fact]
    public void Model_has_no_validation_errors()
    {
        var model = new ObstacleData
        {
            ObstacleName = "Tree",
            ObstacleHeight = 5.0,
            ObstacleDescription = "Oak tree in the way"
        };
        
        var results = Validate(model);
        
        Assert.Empty(results);
    }
}