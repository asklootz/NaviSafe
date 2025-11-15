Testing

We use xUnit for unit testing, and all tests are collected in the project NaviSafe.Tests.
The main goal has been to test the parts of the system where we actually have logic and decisions, not just simple view rendering.

HomeControllerTests

These tests check that the HomeController returns the expected views.

Index_Return_ViewResult – Verifies that the Index action returns a ViewResult.

Privacy_Return_ViewResult – Verifies that the Privacy action returns a ViewResult.

ObstacleControllerTests

These tests cover the basic behavior of the obstacle form.

DataForm_Get_Returns_View_Result – A GET request to DataForm should render the form view.

DataForm_Post_Returns_Overview_View_With_Same_Model – A POST to DataForm with a valid model should return the Overview view and keep the same model instance.

ObstacleValidTest

These tests focus on validation rules for the obstacle model.

Obstacle_Name_Required – If ObstacleName is empty, a validation error with the message “Obstacle name is required” should be produced.

Obstacle_Height_cant_be_below_requirement – If ObstacleHeight is 0.0, the model should produce the error “Height must be between 0.1 and 100.0 meters”.

ObstacleHeight_more_than_max_is_invalid – If ObstacleHeight is above 100.0, the same height error should be produced.

Obstacle_Description_Required – If ObstacleDescription is empty, a validation error with the message “Obstacle description is required” should be produced.

Model_has_no_validation_errors – A fully filled and valid model should not produce any validation errors.

UserStorageTests

These tests verify the logic for registering and validating users in UserStorage.

FindsUserIgnoreCase – Checks that email lookups are case-insensitive, so the same user can be found regardless of upper or lower case in the email.

RegisterUserStoresData – After calling RegisterUser, the method should return a non-empty GUID string and all user fields should be stored correctly, including FullAddress and RegisteredDate.

CannotRegisterSameEmailTwice – Registering the same email twice should succeed the first time and then return an empty string on the second call, which means duplicate emails are not allowed.

ValidateUserReturnsTrueOnlyForCorrectPassword – ValidateUser should return true only when the correct password is provided for a registered email, and false when the password is wrong.

AccountControllerTests

These tests cover the main login and register flows in AccountController.

LoginPostReturnsViewIfModelStateIsNotValid – If ModelState is invalid when posting the login form, the action should return the login view again with the same LoginViewModel instance.

LoginPostAddsModelErrorWhenCredentialsAreInvalid – If the email or password is wrong, the login action should add a model error with the message “Invalid email or password.” and return the login view with the same model.

RegisterPostAddsModelErrorWhenEmailAlreadyExists – If the user tries to register with an email that already exists (for example admin@navisafe.com), the action should add a model error with the message “An account with this email already exists.” and return the register view with the same model.

How to run the tests

In Rider, open the Unit Tests tool window and choose Run All Tests for the NaviSafe.Tests project.
All tests should run and show their result there.
