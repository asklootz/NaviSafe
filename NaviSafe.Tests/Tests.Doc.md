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

CannotRegisterTheSameEmailTwice – Registering the same email twice should succeed the first time and then return an empty string on the second call, which means duplicate emails are not allowed.

ValidateUserReturnsTrueOnlyIfPasswordIsCorrect – ValidateUser should return true only when the correct password is provided for a registered email, and false when the password is wrong.

AccountControllerTests

These tests cover the main login and register flows in AccountController.

LoginPostReturnsViewIfModelStateIsNotValid – If ModelState is invalid when posting the login form, the action should return the login view again with the same LoginViewModel instance.

LoginPostAddsModelErrorWhenCredentialsAreInvalid – If the email or password is wrong, the login action should add a model error with the message “Invalid email or password.” and return the login view with the same model.

RegisterPostAddsModelErrorWhenEmailAlreadyExists – If the user tries to register with an email that already exists (for example admin@navisafe.com), the action should add a model error with the message “An account with this email already exists.” and return the register view with the same model.

How to run the tests

In Rider, open the Unit Tests tool window and choose Run All Tests for the NaviSafe.Tests project.
All tests should run and show their result there.

ObstacleValidTest
these test verify the validation rules for the ObstacleDataForm model. The goal is to ensure that submitted obsticals follow the requirements for name and height before they are further proceed in the system. 

Obstacle_Name_Reuquired 
Checks that shortdec is (obstical name) is requried. If this is empty the model should return a validation error message.

Obstacle_Height_cant_be_Below_Requirements
test that the altitude cannot be lower than the minimum limit of 0.1 meters, if the value is below the validation should return a error message. 

Obstacleheight_more_than_max_is_invalid
Tests that the altiude cannot exceed the maximum limit of 1000 meters.

Model_has_no_validation_error
confirms that a valid model - with the correct name and a height within the legal range - should not give any validatoin errors. This ensures that normal, correct submissions are approved without any problems.

DummyTest_shouldPass
This is used to confirm that the test environment is running as expected. 

AccountControllerTest 
These test verify basic login and registration behavior in AccountController using an In-memory database. the tests checks that:
Login POST: 
returns the same view and model if ModelState is invalid. It adds a general ModelState error message when username/password does not match a user in the database. 
Register POST:
Prevents new user registration if the email already exists. In this case, the view is returned with the same model, and the ModelState gets an error message. 

HomecontrollerTest 
These tests verify that Homecontroller works as expected by ensuring that: 
Index() returns a Viewresult 
Privacy() returns a ViewResult
since homecontroller only returns static views without any login or data processing, these test act as a simple smoke test. 
They confirm that the controlles is configured correctly and that the action methods respond as the MVC frameork expected.

ObstacleControllerTest
These tests checks that ObstacleController handles both GEt and POSt requests correctly. These tests verify the follwing:
GET:dataform(). returns a ViewResult as expected. 
POST:Dataform(model, SubmitAction) (disable test) A valid model should take user to the "overview" view
an invalid model (error in ModelState) should return the same view with the model rolled back so that the user can correct the error.
To perform these tests, a fake web environemnt and an empty EF core database are used, so that controller can run without external dependencies. 
These tests serve as both validation and structrual tests, ensuring that the obstacle data system responds correctly to user input 

UserStorageTest
the tests follows case-insensitive email lookup, UserExist should return true regardless of whether the email is entered in uppercase or lowercase letters.
RegisterUser should return a valid UserID
set registeredDate to a valid date
the same email cannot be registered twice
first call to RegisterUser succeeds, second call with the same email returns empty string as userID
password validation
validateUser returns- true when email and password match, false when the this is incorrect
this provides confidence that user handling works robustly before it is used in controllers or UI.  
