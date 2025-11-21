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
    }
}