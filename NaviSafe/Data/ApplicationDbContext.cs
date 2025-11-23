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
    // public DbSet<ObstacleData> Obstacles { get; set; }
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
    }
}