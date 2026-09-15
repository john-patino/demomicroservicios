FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["src/shared/SharedKernel.Logging/SharedKernel.Logging.csproj", "src/shared/SharedKernel.Logging/"]
COPY ["src/services/OrderService/OrderService.csproj", "src/services/OrderService/"]
RUN dotnet restore "src/services/OrderService/OrderService.csproj"

# Copy source code and build
COPY ["src/shared/SharedKernel.Logging/", "src/shared/SharedKernel.Logging/"]
COPY ["src/services/OrderService/", "src/services/OrderService/"]
WORKDIR "/src/src/services/OrderService"
RUN dotnet build "OrderService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "OrderService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "OrderService.dll"]
