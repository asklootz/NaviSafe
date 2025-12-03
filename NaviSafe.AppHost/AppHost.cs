using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

var builder = DistributedApplication.CreateBuilder(args);

// Initial SQL script to create the database schema and seed data based on "mariaDatabase.sql"
var testScript = System.IO.File.ReadAllText("../NaviSafe/mariaDatabase.sql");


var mariaContainer = builder.AddMySql("mariaContainer", null, 3307)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithImage("mariadb:11.8")
    .WithContainerName("mariaContainer")
    .WithDataBindMount(source: "../MariaDB/Data") //Code to create a bind mount to a local folder
    .WithPhpMyAdmin(php =>   //Creates a phpMyAdmin container linked to the database container for easy management
        { php.WithHostPort(7447);}) //Sets a custom host port for phpMyAdmin, otherwise a random exposed port is assigned
    .WithOtlpExporter(); 

var mariaDatabase = mariaContainer.AddDatabase("mariaDatabase")
    .WithCreationScript(testScript); //Path to the initial SQL script to create the database schema and mock data


//2 choices of how to run the web-server - ONLY CHOOSE ONE:

//To run on the web-server locally on your machine via AppHost - Should only be used for development with "Hot Reload"
/*
builder.AddProject<Projects.NaviSafe>("navisafe")
    .WithReference(mariaDatabase) //Creates a link between the web-server container and the database container via a connection string
    .WaitFor(mariaDatabase);*/

//To run the web-server on a Docker container

builder.AddDockerfile("naviSafe", "../", "NaviSafe/Dockerfile")
    .WithExternalHttpEndpoints()
    .WithBindMount(source: "../NaviSafe/wwwroot/images", target: "/app/wwwroot/images") //Bind mount for persistent image storage
    .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Password", "PASSWORD")
    .WithEnvironment("ASPNETCORE_Kestrel__Certificates__Default__Path", "/app/cert.pfx")
    .WithEnvironment("ASPNETCORE_HTTPS_PORTS", "8081")
    .WithReference(mariaDatabase) //Creates a link between the web-server container and the database container via a connection string
    .WaitFor(mariaDatabase)
    .WithHttpEndpoint(8080, 8080, "NaviSafeHTTP")
    .WithHttpsEndpoint(8081, 8081, "NaviSafeHTTPS")
    .WithOtlpExporter();



builder.Build().Run();