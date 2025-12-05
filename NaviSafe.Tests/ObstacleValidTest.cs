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
    public void Obstacle_Name_Required() // tester at navnet på hinder (shortdec) er påkrevd 
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "", // tomt navn skal gi valideringsfeil 
            altitude = 1.0f,
            longDesc = "Okay"
        };
        
        var results = Validate(model);
        // sjekker om riktig feilmelding returneres 
        Assert.True(results.Exists(r => r.ErrorMessage == "Obstacle name is required"));
    }
    

    [Fact]
    public void Model_has_no_validation_errors() //sjekker at en gyldig ObstacleDataForm ikek gir noen feil 
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "Tree",
            altitude = 5.0f,
            longDesc = "Oak tree in the way"
        };
        
        var results = Validate(model);
        //verdier ligger innenfor grensa så results skal være tom 
        Assert.Empty(results);
    }
    [Fact]
    public void DummyTest_ShouldPass() //enkel test for å se at testmijlø fungerer
    {
        Assert.True(true);
    }
    [Fact]
    public void Obstacle_Height_cant_be_below_requirement() //sjekker at høyden ikke kan være lavere enn minimumsverdi 
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "Too low",
            altitude = 0.0f,          // under minimum høyde
            longDesc = "Height below allowed range"
        };

        var results = Validate(model);

        // sjekker om det blir høyde feil
        Assert.True(results.Exists(r =>
            r.ErrorMessage == "Height must be between 0.1 and 1000.0 meters"));
    }

    [Fact]
    public void ObstacleHeight_more_than_max_is_invalid() //sjekker at høyden ikke kan være høyere enn maksverdi 
    {
        var model = new ObstacleDataForm
        {
            shortDesc = "Too high building",
            altitude = 1500.0f,       // over maximum høyde
            longDesc = "Height above allowed range"
        };

        var results = Validate(model);

        Assert.True(results.Exists(r =>
            r.ErrorMessage == "Height must be between 0.1 and 1000.0 meters"));
    }

}