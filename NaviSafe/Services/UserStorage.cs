namespace NaviSafe.Services;

public class UserStorage
{
    public class UserData
    {
        public string UserId { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // Split first/last to match userInfo table
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // Organization number (foreign key to `organisation.orgNr`)
        public int OrgNr { get; set; }

        // Role code matching `userRole.roleID` (e.g. "ADM", "PIL")
        public string RoleID { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public DateTime RegisteredDate { get; set; }

        // compatibility convenience
        public string FullName => string.IsNullOrWhiteSpace($"{FirstName} {LastName}".Trim()) ? string.Empty : $"{FirstName} {LastName}".Trim();
    }

    private static readonly Dictionary<string, UserData> Users = new()
    {
        {
            "admin@navisafe.com",
            new UserData
            {
                UserId = "1",
                Password = "Admin123",
                FirstName = "Yonathan",
                LastName = "Admin",
                PhoneNumber = "40000000",
                OrgNr = 1,
                RoleID = "ADM",
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

    // Updated registration method to match userInfo fields
    public string RegisterUser(string email, string password,
        string firstName, string lastName, string phoneNumber, int orgNr, string roleId)
    {
        if (UserExists(email))
            return string.Empty;

        var userId = (Users.Count + 1).ToString();

        Users[email.ToLower()] = new UserData
        {
            UserId = userId,
            Password = password,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phoneNumber,
            OrgNr = orgNr,
            RoleID = roleId,
            RegisteredDate = DateTime.UtcNow
        };

        return userId;
    }

    public UserData? GetUserInfo(string email) =>
        Users.TryGetValue(email.ToLower(), out var user) ? user : null;
}