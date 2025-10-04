Testing

We're using Xunit and placed our tests in NaviSafe.Tests.

-HomeControllerTests

Index_Return_ViewResult - expects ViewResult.

Privacy_Return_ViewResult - expects ViewResult.


-ObstacleControllerTests

DataForm_Get_Returns_View_Result - GET should render the view form.

DataForm_Post_Returns_Overview_View_With_Same_Model - POST should return view Overview with the same model instance.


-ObstacleValidTest

Obstacle_Name_Required - message should be produced if ObstacleName is empty: "Obstacle name is required".

Obstacle_Height_cant_be_below_requirement - ObstacleHeight = 0.0 should produce: "Height must be between 0.1 and 100.0 meters".

ObstacleHeight_more_than_max_is_invalid - ObstacleHeight above 100.0 should make the same height error.

Obstacle_Description_Required - ObstacleDescription being empty, should produce: "Obstacle description is required".

Model_has_no_validation_errors - A filled valid model should not produce validation errors.


How to run

Rider - open the unit test tool and press: run all tests

