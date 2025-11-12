using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using NaviSafe.Services;

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
builder.Services.AddControllersWithViews();

// Register UserStorage
builder.Services.AddSingleton<UserStorage>();

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
app.UseAuthorization();

app.MapStaticAssets();

// Redirect to login ONLY if not authenticated
app.MapGet("/", (HttpContext context) =>
{
    var isAuthenticated = context.Session.GetString("IsAuthenticated");
    if (string.IsNullOrEmpty(isAuthenticated) || isAuthenticated != "true")
    {
        return Results.Redirect("/Account/Login");
    }
    return Results.Redirect("/Home/Index");
});

// Map controllers
app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();