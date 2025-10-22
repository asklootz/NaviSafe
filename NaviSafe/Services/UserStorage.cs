namespace NaviSafe.Services;

public class UserStorage
{
    public class UserData
    {
        public string UserId { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string StreetAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public DateTime RegisteredDate { get; set; }
        
        public string FullAddress => $"{StreetAddress}, {PostalCode} {City}, {Country}";
    }

    private static readonly Dictionary<string, UserData> Users = new()
    {
        { 
            "admin@navisafe.com", 
            new UserData 
            { 
                UserId = "admin-001",
                Password = "Admin123", 
                FullName = "Administrator",
                PhoneNumber = "+47 123 45 678",
                StreetAddress = "Tollbodgata 50",
                City = "Kristiansand",
                PostalCode = "4614",
                Country = "Norway",
                RegisteredDate = DateTime.UtcNow
            } 
        }
    };

    public bool UserExists(string email) => 
        Users.ContainsKey(email.ToLower());

    public bool ValidateUser(string email, string password)
    {
        var user = GetUserInfo(email);
        return user?.Password == password;
    }

    public string RegisterUser(string email, string password, string fullName, 
        string phoneNumber, string streetAddress, string city, string postalCode, string country)
    {
        if (UserExists(email))
            return string.Empty;

        var userId = Guid.NewGuid().ToString();
        
        Users[email.ToLower()] = new UserData
        {
            UserId = userId,
            Password = password,
            FullName = fullName,
            PhoneNumber = phoneNumber,
            StreetAddress = streetAddress,
            City = city,
            PostalCode = postalCode,
            Country = country,
            RegisteredDate = DateTime.UtcNow
        };

        return userId;
    }

    public UserData? GetUserInfo(string email) => 
        Users.TryGetValue(email.ToLower(), out var user) ? user : null;
}