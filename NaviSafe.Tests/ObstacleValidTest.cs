using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using NaviSafe.Models;
using Xunit;

namespace NaviSafe.Tests;

public class ObstacleValidTest
{
    private static List<ValidationResult> Validate(ObstacleDataForm model)
    {
        var context = new ValidationContext(model);
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, context, results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void Obstacle_Name_Required()
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "",
            altitude = 1.0f,
            longDesc = "Okay"
        };
        
        var results = Validate(model);
        
        Assert.True(results.Exists(r => r.ErrorMessage == "Obstacle name is required"));
    }

    [Fact]
    public void Obstacle_Height_cant_be_below_requirement()
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "Tree",
            altitude = 0.0f,
            longDesc = "Tall tree"
        };
        
        var results = Validate(model);
        
        Assert.True(results.Exists(r => r.ErrorMessage == "Height must be between 0.1 and 100.0 meters"));

    }

    [Fact]
    public void ObstacleHeight_more_than_max_is_invalid()
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "Building",
            altitude = 170.0f,
            longDesc = "Tall building"

        };
        
        var results = Validate(model);

        Assert.True(results.Exists(r => r.ErrorMessage == "Height must be between 0.1 and 100.0 meters"));
    }

    [Fact]
    public void Model_has_no_validation_errors()
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "Tree",
            altitude = 5.0f,
            longDesc = "Oak tree in the way"
        };
        
        var results = Validate(model);
        
        Assert.Empty(results);
    }
}