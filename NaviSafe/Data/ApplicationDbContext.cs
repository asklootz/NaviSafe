using Microsoft.EntityFrameworkCore;
using NaviSafe.Models;

namespace NaviSafe.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Add your DbSets here for future use
    public DbSet<UserAuth> UserAuth { get; set; }
    public DbSet<UserInfo> UserInfo { get; set; }
    public DbSet<UserRole> UserRole { get; set; }

    // New: reporting table
    public DbSet<Reporting> Reporting { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        // Map tables (names must match existing MariaDB)
        builder.Entity<UserAuth>().ToTable("userAuth").HasKey(x => x.UserId);
        builder.Entity<UserAuth>().Property(x => x.UserId).HasColumnName("userID");
        builder.Entity<UserAuth>().Property(x => x.Username).HasColumnName("username");
        builder.Entity<UserAuth>().Property(x => x.PassHash).HasColumnName("passHash");
        builder.Entity<UserAuth>().Property(x => x.PassSalt).HasColumnName("passSalt");

        builder.Entity<UserInfo>().ToTable("userInfo").HasKey(x => x.UserId);
        builder.Entity<UserInfo>().Property(x => x.UserId).HasColumnName("userID");
        builder.Entity<UserInfo>().Property(x => x.FirstName).HasColumnName("firstName");
        builder.Entity<UserInfo>().Property(x => x.LastName).HasColumnName("lastName");
        builder.Entity<UserInfo>().Property(x => x.Email).HasColumnName("email");
        builder.Entity<UserInfo>().Property(x => x.Phone).HasColumnName("phone");
        builder.Entity<UserInfo>().Property(x => x.OrgNr).HasColumnName("orgNr");
        builder.Entity<UserInfo>().Property(x => x.RoleId).HasColumnName("roleID");

        builder.Entity<UserRole>().ToTable("userRole").HasKey(x => x.RoleId);
        builder.Entity<UserRole>().Property(x => x.RoleId).HasColumnName("roleID");
        builder.Entity<UserRole>().Property(x => x.RolePermissions).HasColumnName("rolePermissions");

        builder.Entity<UserInfo>()
               .HasOne<UserAuth>()
               .WithMany()
               .HasForeignKey(x => x.UserId);

        builder.Entity<UserInfo>()
               .HasOne<UserRole>()
               .WithMany()
               .HasForeignKey(x => x.RoleId);

        // Reporting mapping
        builder.Entity<Reporting>().ToTable("reporting").HasKey(r => r.RegID);
        builder.Entity<Reporting>().Property(r => r.RegID).HasColumnName("regID");
        builder.Entity<Reporting>().Property(r => r.Lat).HasColumnName("lat");
        builder.Entity<Reporting>().Property(r => r.Lon).HasColumnName("lon");
        builder.Entity<Reporting>().Property(r => r.Altitude).HasColumnName("altitude");
        builder.Entity<Reporting>().Property(r => r.Accuracy).HasColumnName("accuracy");
        builder.Entity<Reporting>().Property(r => r.ShortDesc).HasColumnName("shortDesc").HasMaxLength(50);
        builder.Entity<Reporting>().Property(r => r.LongDesc).HasColumnName("longDesc").HasMaxLength(255);
        builder.Entity<Reporting>().Property(r => r.Img).HasColumnName("img");
        builder.Entity<Reporting>().Property(r => r.IsSent).HasColumnName("isSent");
        builder.Entity<Reporting>().Property(r => r.State).HasColumnName("state").HasMaxLength(20);
        builder.Entity<Reporting>().Property(r => r.RejectComment).HasColumnName("rejectComment").HasMaxLength(255);
        builder.Entity<Reporting>().Property(r => r.UserID).HasColumnName("userID");
        builder.Entity<Reporting>().Property(r => r.CreationDate).HasColumnName("creationDate");
    }
}