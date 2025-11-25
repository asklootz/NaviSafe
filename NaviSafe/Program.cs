using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using NaviSafe.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using NaviSafe.Data;
using System.Linq;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// --- Register DbContext using connection string provided by AppHost ---
// AppHost usually injects a connection string; try common names or inspect configuration at runtime.
var connectionString =
    builder.Configuration.GetConnectionString("mariaDatabase")
    ?? builder.Configuration.GetConnectionString("MariaContainer")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration.GetConnectionString("navisafe")
    ?? throw new InvalidOperationException("Connection string not found. Verify AppHost configured the DB reference.");

builder.AddMySqlDataSource("mariaDatabase");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
});

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
builder.Services.AddControllersWithViews();

// Register UserStorage as scoped (required because it depends on DbContext)
builder.Services.AddScoped<UserStorage>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(24);
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("IsPilot", p => p.RequireRole("PIL"));
    options.AddPolicy("IsAdmin", p => p.RequireRole("ADM"));
});

// Add simple session support for login
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var app = builder.Build();

app.MapDefaultEndpoints();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseSession();

app.UseAuthentication();

// Redirect unauthenticated users to the Login page for protected URLs
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    var isAuthenticated = context.User?.Identity?.IsAuthenticated ?? false;

    // Public/allowed prefixes and exact paths (static assets, health checks, login/register, API endpoints)
    var allowedPrefixes = new[]
    {
        "/Account/Login",
        "/Account/Register",
        "/Account/AccessDenied",
        "/css/",
        "/js/",
        "/lib/",
        "/favicon.ico",
        "/_framework/",
        "/health",
        "/alive",
        "/static",
        "/images/",
        "/NaviSafeIcon.png",
        "/NaviSafeIcon.svg",
        "/api/"
    };

    var isAllowed = allowedPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase) || string.Equals(path, p, StringComparison.OrdinalIgnoreCase));

    if (!isAuthenticated && !isAllowed)
    {
        // preserve returnUrl
        var returnUrl = context.Request.Path + context.Request.QueryString;
        var loginUrl = "/Account/Login?returnUrl=" + System.Net.WebUtility.UrlEncode(returnUrl);
        context.Response.Redirect(loginUrl);
        return;
    }

    await next();
});

app.UseAuthorization();

app.MapStaticAssets();

// Redirect root to role-specific start page or login
app.MapGet("/", (HttpContext context) =>
{
    if (!context.User?.Identity?.IsAuthenticated ?? true)
        return Results.Redirect("/Account/Login");

    if (context.User.IsInRole("PIL"))
        return Results.Redirect("/Obstacle/DataForm");

    if (context.User.IsInRole("ADM"))
        return Results.Redirect("/Home/AdminDashboard");

    return Results.Redirect("/Home/Index");
});

// Map controllers
app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();