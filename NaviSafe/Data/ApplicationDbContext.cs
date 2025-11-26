using Microsoft.EntityFrameworkCore;
using NaviSafe.Models;

namespace NaviSafe.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<UserAuth> UserAuth { get; set; } = null!;
    public DbSet<UserInfo> UserInfo { get; set; } = null!;
    public DbSet<Organisation> Organisation { get; set; } = null!;
    public DbSet<UserRole> UserRole { get; set; } = null!;
   //public DbSet<Reporting> Reporting { get; set; } = null!;
    public DbSet<ObstacleData> Obstacles { get; set; } = null!;
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        builder.Entity<ObstacleData>(entity =>
        {
            entity.ToTable("reporting");
            entity.HasKey(e => e.regID);
            entity.Property(e => e.regID).HasColumnName("regID");
            entity.Property(e => e.ShortDesc).HasColumnName("shortDesc").HasMaxLength(100).IsRequired();
            entity.Property(e => e.LongDesc).HasColumnName("longDesc").HasMaxLength(1000);
            entity.Property(e => e.Lat).HasColumnName("lat").IsRequired();
            entity.Property(e => e.Lon).HasColumnName("lon").IsRequired();
            entity.Property(e => e.Altitude).HasColumnName("altitude");
            entity.Property(e => e.IsSent).HasColumnName("isSent").IsRequired();
            entity.Property(e => e.State).HasColumnName("state").HasMaxLength(10).IsRequired();
            entity.Property(e => e.UserID).HasColumnName("userID").IsRequired();
            entity.Property(e => e.Accuracy).HasColumnName("accuracy");
            entity.Property(e => e.Img).HasColumnName("img");
            // creationDate is handled by DB default current_timestamp(), do not set here
            entity.Property(e => e.GeoJSON).HasColumnName("geoJSON");
        });

        builder.Entity<UserAuth>(entity =>
        {
            entity.ToTable("userAuth");
            entity.HasKey(e => e.UserID);
            entity.Property(e => e.UserID).HasColumnName("userID");
            entity.Property(e => e.Username).HasColumnName("username").HasMaxLength(70).IsRequired();
            entity.Property(e => e.PassHash).HasColumnName("passHash").HasMaxLength(255);
            entity.Property(e => e.PassSalt).HasColumnName("passSalt").HasMaxLength(255);
        });

        builder.Entity<UserInfo>(entity =>
        {
            entity.ToTable("userInfo");
            entity.HasKey(e => e.UserID);
            entity.Property(e => e.UserID).HasColumnName("userID");
            entity.Property(e => e.FirstName).HasColumnName("firstName").HasMaxLength(255);
            entity.Property(e => e.LastName).HasColumnName("lastName").HasMaxLength(255);
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Phone).HasColumnName("phone").HasMaxLength(255).IsRequired();
            entity.Property(e => e.OrgNr).HasColumnName("orgNr").IsRequired();
            entity.Property(e => e.RoleID).HasColumnName("roleID").HasMaxLength(5).IsRequired();
            entity.Property(e => e.CreationDate).HasColumnName("creationDate").HasDefaultValueSql("current_timestamp()");
        });

        builder.Entity<Organisation>(entity =>
        {
            entity.ToTable("organisation");
            entity.HasKey(e => e.OrgNr);
            entity.Property(e => e.OrgNr).HasColumnName("orgNr");
            entity.Property(e => e.OrgName).HasColumnName("orgName").HasMaxLength(255).IsRequired();
        });

        builder.Entity<UserRole>(entity =>
        {
            entity.ToTable("userRole");
            entity.HasKey(e => e.RoleID);
            entity.Property(e => e.RoleID).HasColumnName("roleID").HasMaxLength(3);
            entity.Property(e => e.RolePermissions).HasColumnName("rolePermissions").HasMaxLength(10);
            entity.Property(e => e.PermissionsDescription).HasColumnName("permissionsDescription").HasMaxLength(255);
        });
    }
}

public class UserAuth
{
    public int UserID { get; set; }
    public string Username { get; set; } = null!;
    public string? PassHash { get; set; }
    public string? PassSalt { get; set; }
}

public class UserInfo
{
    public int UserID { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string Email { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public int OrgNr { get; set; }
    public string RoleID { get; set; } = null!;
    public DateTime CreationDate { get; set; }
}

public class Organisation
{
    public int OrgNr { get; set; }
    public string OrgName { get; set; } = null!;
}

public class UserRole
{
    public string RoleID { get; set; } = null!;
    public string RolePermissions { get; set; } = null!;
    public string? PermissionsDescription { get; set; }
}

public class Reporting
{
    public int? regID { get; set; }
    public string ShortDesc { get; set; } = null!;
    public string? LongDesc { get; set; }
    public float Lat { get; set; }
    public float Lon { get; set; }
    public float Altitude { get; set; }
    
}

public class ObstacleData
{
    public int? regID { get; set; }
    public string ShortDesc { get; set; } = null!;
    public string? LongDesc { get; set; }
    public float Lat { get; set; }
    public float Lon { get; set; }
    public float? Altitude { get; set; }
    public bool IsSent { get; set; } = false; // e.g. draft / not sent
    public string State { get; set; } = "PENDING"; // default state
    public int UserID { get; set; } // foreign key to userInfo.userID
    public int? Accuracy { get; set; }
    public byte[]? Img { get; set; }
    public string? GeoJSON { get; set; }
    public DateTime CreationDate { get;  }
}