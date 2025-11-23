using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NaviSafe.Data;
using NaviSafe.Services;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Pomelo.EntityFrameworkCore.MySql;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .ConfigureResource(res => res.AddService("NaviSafe"))
    .WithMetrics(m =>
    {
        m.AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation();
    })
    .WithTracing(t =>
    {
        t.AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation();
    });

builder.Logging.AddOpenTelemetry(options =>
{
    options.AddConsoleExporter()
        .SetResourceBuilder(ResourceBuilder.CreateDefault().AddService("NaviSafe"));
});

// Add services
builder.Services.AddControllers();
builder.Services.AddControllersWithViews();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Prefer a named connection string for the MariaDB datasource.
// Read the connection first, register the named data source with the actual connection string.
var conn = builder.Configuration.GetConnectionString("mariaDatabase")
           ?? builder.Configuration.GetConnectionString("DefaultConnection")
           ?? throw new InvalidOperationException("No connection string configured for mariaDatabase or DefaultConnection.");

// Register a named MySQL DataSource with the connection string
builder.AddMySqlDataSource("mariaDatabase");

// Single DbContext registration using the chosen connection
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(conn, ServerVersion.AutoDetect(conn)));

// Register UserStorage
builder.Services.AddSingleton<UserStorage>();

// Add simple session support for login
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// Configure JWT Bearer authentication to enable User claims from tokens (if provided)
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    // fallback - recommend setting a proper secret in configuration
    jwtKey = "th15_15_The_5uPEr_5EcREt_KeY_T0_thE_4M421n9Ly_5eCURe_4PPL1c4T10N";
}

var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});

builder.Services.AddScoped<JwtTokenService>();

var app = builder.Build();

app.MapDefaultEndpoints();

if (!
    app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseSession();

// IMPORTANT: enable authentication middleware so the ReportsController can read User claims
app.UseAuthentication();

app.UseAuthorization();

app.MapStaticAssets();

// Redirect to login ONLY if not authenticated
/*
app.MapGet("/", (HttpContext context) =>
{
    var isAuthenticated = context.Session.GetString("IsAuthenticated");
    if (string.IsNullOrEmpty(isAuthenticated) || isAuthenticated != "true")
    {
        //return Results.Redirect("/Account/Login");
        return Results.Redirect("/Account/Login");
    }
    return Results.Redirect("/Home/Index");
});*/

// Map controllers
app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();