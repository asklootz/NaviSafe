using NaviSafe.Data;
using Microsoft.EntityFrameworkCore;

namespace NaviSafe.Services;

public class UserStorage
{
    private readonly ApplicationDbContext _db;

    public UserStorage(ApplicationDbContext db)
    {
        _db = db;
    }

    public class UserData
    {
        public string UserId { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int OrgNr { get; set; }
        public string RoleID { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime RegisteredDate { get; set; }
        public string FullName => $"{FirstName} {LastName}".Trim();
    }

    public bool UserExists(string email) =>
        _db.UserInfo.AsNoTracking().Any(u => u.Email.ToLower() == email.ToLower());

    public bool ValidateUser(string email, string password)
    {
        var info = _db.UserInfo.AsNoTracking().FirstOrDefault(u => u.Email.ToLower() == email.ToLower());
        if (info == null) return false;

        var auth = _db.UserAuth.AsNoTracking().FirstOrDefault(a => a.UserID == info.UserID);
        if (auth == null || string.IsNullOrEmpty(auth.PassHash)) return false;

        return BCrypt.Net.BCrypt.Verify(password, auth.PassHash);
    }

    // Note: synchronous to keep controller code unchanged
    public string RegisterUser(string email, string password,
        string firstName, string lastName, string phoneNumber, int orgNr, string roleId)
    {
        if (UserExists(email)) return string.Empty;

        using var tx = _db.Database.BeginTransaction();
        try
        {
            var salt = BCrypt.Net.BCrypt.GenerateSalt(12);
            var hash = BCrypt.Net.BCrypt.HashPassword(password, salt);

            var auth = new UserAuth
            {
                Username = email,
                PassHash = hash,
                PassSalt = salt
            };

            _db.UserAuth.Add(auth);
            _db.SaveChanges(); // populates auth.UserID

            var info = new UserInfo
            {
                UserID = auth.UserID,
                FirstName = firstName,
                LastName = lastName,
                Email = email,
                Phone = phoneNumber,
                OrgNr = orgNr,
                RoleID = roleId,
                CreationDate = DateTime.UtcNow
            };

            _db.UserInfo.Add(info);
            _db.SaveChanges();

            tx.Commit();
            return auth.UserID.ToString();
        }
        catch
        {
            tx.Rollback();
            return string.Empty;
        }
    }

    public UserData? GetUserInfo(string email)
    {
        var info = _db.UserInfo.AsNoTracking().FirstOrDefault(u => u.Email.ToLower() == email.ToLower());
        if (info == null) return null;

        return new UserData
        {
            UserId = info.UserID.ToString(),
            FirstName = info.FirstName ?? string.Empty,
            LastName = info.LastName ?? string.Empty,
            PhoneNumber = info.Phone,
            OrgNr = info.OrgNr,
            RoleID = info.RoleID,
            RegisteredDate = info.CreationDate
        };
    }
}