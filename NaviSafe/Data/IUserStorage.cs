namespace NaviSafe.Data
{
    public interface IUserStorage
    {
        bool ValidateUser(string email, string password);
        bool UserExists(string email);
        string RegisterUser(string email, string password, string fullName, string phoneNumber,
            string streetAddress, string city, string postalCode, string country);
        UserInfo? GetUserInfo(string email);
    }

    public class UserInfo
    {
        public string UserId { get; set; } = Guid.NewGuid().ToString();
        public string Email { get; set; } = string.Empty;
    }
}