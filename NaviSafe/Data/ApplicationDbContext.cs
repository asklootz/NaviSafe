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
    public DbSet<UserAuth> UserAuths { get; set; }
    public DbSet<UserInfo> UserInfos { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<Organisation> Organisations { get; set; }
    public DbSet<Registration> Registrations { get; set; }
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Configure table names to match your database
        builder.Entity<UserAuth>().ToTable("userAuth");
        builder.Entity<UserInfo>().ToTable("userInfo");
        builder.Entity<UserRole>().ToTable("userRole");
        builder.Entity<Organisation>().ToTable("organisation");
        builder.Entity<Registration>().ToTable("registrations");
        
        builder.Entity<UserInfo>()
            .HasOne<UserAuth>()
            .WithOne()
            .HasForeignKey<UserInfo>(u => u.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}