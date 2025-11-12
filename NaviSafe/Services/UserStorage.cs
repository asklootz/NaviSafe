using NaviSafe.Data;
using NaviSafe.Models;
using Microsoft.EntityFrameworkCore;

namespace NaviSafe.Services;

public class UserStorage
{
    private readonly ApplicationDbContext _context;

    public UserStorage(ApplicationDbContext context)
    {
        _context = context;
    }

    public bool UserExists(string email)
    {
        return _context.UserInfos.Any(u => u.Email.ToLower() == email.ToLower());
    }

    public async Task<bool> ValidateUser(string email, string password)
    {
        var userInfo = await _context.UserInfos
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        
        if (userInfo == null) return false;
        
        var userAuth = await _context.UserAuths
            .FirstOrDefaultAsync(u => u.UserId == userInfo.UserId);
        
        // For demo purposes - in production, use proper password hashing
        return userAuth?.PassHash == password;
    }

    public async Task<string> RegisterUser(string email, string password, string fullName, 
        string phoneNumber, string streetAddress, string city, string postalCode, string country)
    {
        if (UserExists(email)) return string.Empty;

        var names = fullName.Split(' ', 2);
        var firstName = names.Length > 0 ? names[0] : fullName;
        var lastName = names.Length > 1 ? names[1] : string.Empty;

        // Create UserAuth entry
        var userAuth = new UserAuth
        {
            Username = email,
            PassHash = password, // In production, hash this properly
            PassSalt = null
        };
        
        _context.UserAuths.Add(userAuth);
        await _context.SaveChangesAsync();

        // Create UserInfo entry
        var userInfo = new UserInfo
        {
            UserId = userAuth.UserId,
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Phone = phoneNumber,
            OrgNr = 1, // Default to Kartverket
            RoleId = "PIL", // Default role
            CreationDate = DateTime.UtcNow
        };
        
        _context.UserInfos.Add(userInfo);
        await _context.SaveChangesAsync();

        return userAuth.UserId.ToString();
    }

    public async Task<UserData?> GetUserInfo(string email)
    {
        var userInfo = await _context.UserInfos
            .Include(u => u.UserId)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        
        if (userInfo == null) return null;

        return new UserData
        {
            UserId = userInfo.UserId.ToString(),
            FullName = $"{userInfo.FirstName} {userInfo.LastName}",
            PhoneNumber = userInfo.Phone,
            RegisteredDate = userInfo.CreationDate
        };
    }

    public class UserData
    {
        public string UserId { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime RegisteredDate { get; set; }
    }
}