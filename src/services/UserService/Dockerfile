FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["src/shared/SharedKernel.Logging/SharedKernel.Logging.csproj", "src/shared/SharedKernel.Logging/"]
COPY ["src/services/UserService/UserService.csproj", "src/services/UserService/"]
RUN dotnet restore "src/services/UserService/UserService.csproj"

# Copy source code and build
COPY ["src/shared/SharedKernel.Logging/", "src/shared/SharedKernel.Logging/"]
COPY ["src/services/UserService/", "src/services/UserService/"]
WORKDIR "/src/src/services/UserService"
RUN dotnet build "UserService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "UserService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "UserService.dll"]
