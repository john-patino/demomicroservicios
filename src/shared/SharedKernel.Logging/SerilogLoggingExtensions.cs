using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;

namespace SharedKernel.Logging
{
    public static class SerilogLoggingExtensions
    {
        public static void ConfigureCentralizedLogging(this WebApplicationBuilder builder, string serviceName)
        {
            var seqUrl = builder.Configuration["SeqServerUrl"]
                         ?? builder.Configuration["SEQ_URL"]
                         ?? Environment.GetEnvironmentVariable("SeqServerUrl")
                         ?? Environment.GetEnvironmentVariable("SEQ_URL")
                         ?? "http://localhost:5341";

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
                .MinimumLevel.Override("Yarp", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("ServiceName", serviceName)
                .Enrich.WithProperty("ApplicationName", serviceName)
                .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
                .Enrich.WithProperty("MachineName", Environment.MachineName)
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{ServiceName}] (CorrId:{CorrelationId}) {Message:lj}{NewLine}{Exception}")
                .WriteTo.Seq(seqUrl)
                .CreateLogger();

            builder.Host.UseSerilog();
        }

        public static IApplicationBuilder UseCorrelationLogging(this IApplicationBuilder app)
        {
            app.UseMiddleware<CorrelationIdMiddleware>();
            app.UseMiddleware<GlobalExceptionHandlingMiddleware>();
            return app;
        }
    }
}
