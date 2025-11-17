using Aspire.Hosting;
using Aspire.Hosting.ApplicationModel;

var builder = DistributedApplication.CreateBuilder(args);

var mariaContainer = builder.AddMySql("mariaContainer", null, 3307)
    .WithLifetime(ContainerLifetime.Persistent)
    .WithImage("mariadb:11.8")
    .WithContainerName("mariaContainer")
    .WithDataBindMount(source: "../MariaDB/Data") //Code to create a bind mount to a local folder
    .WithPhpMyAdmin()
    .WithOtlpExporter(); //Creates a phpMyAdmin container linked to the database container for easy management

var mariaDatabase = mariaContainer.AddDatabase("mariaDatabase");

//2 choices of how to run the web-server - ONLY CHOOSE ONE:

//To run on the web-server locally on your machine via AppHost - Should only be used for development with "Hot Reload"
/*
builder.AddProject<Projects.NaviSafe>("navisafe")
    .WithReference(mariaDatabase)
    .WaitFor(mariaDatabase);*/

//To run the web-server on a Docker container

builder.AddDockerfile("naviSafe", "../", "NaviSafe/Dockerfile")
    .WithExternalHttpEndpoints()
    .WithReference(mariaDatabase)
    .WaitFor(mariaDatabase)
    .WithHttpEndpoint(8080, 8080, "NaviSafeHTTP")
    .WithHttpsEndpoint(8081, 8081, "NaviSafeHTTPS")
    .WithOtlpExporter();

builder.Build().Run();