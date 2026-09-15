FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["src/shared/SharedKernel.Logging/SharedKernel.Logging.csproj", "src/shared/SharedKernel.Logging/"]
COPY ["src/gateway/ApiGateway/ApiGateway.csproj", "src/gateway/ApiGateway/"]
RUN dotnet restore "src/gateway/ApiGateway/ApiGateway.csproj"

# Copy source code and build
COPY ["src/shared/SharedKernel.Logging/", "src/shared/SharedKernel.Logging/"]
COPY ["src/gateway/ApiGateway/", "src/gateway/ApiGateway/"]
WORKDIR "/src/src/gateway/ApiGateway"
RUN dotnet build "ApiGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ApiGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ApiGateway.dll"]
