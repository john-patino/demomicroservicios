# CONSTITUCIÓN TÉCNICA Y ESPECIFICACIÓN MAESTRA: DEMO MICROSERVICIOS C# & REACT
**Metodología:** Spec-Driven Development (SDD) con Spec Kit / OpenSpec  
**Stack Principal:** .NET 8/9 Web API (C#), React 18+ (TypeScript + Vite + Tailwind CSS), YARP API Gateway, Serilog + Seq (Structured Telemetry), PostgreSQL, Docker Compose  
**Dominio de Demostración:** Gestión de Usuarios, Catálogo de Productos y Procesamiento de Órdenes  

---

## 1. CONSTITUCIÓN DEL SISTEMA Y PRINCIPIOS DE GOBIERNO

### 1.1 Reglas Inmutables de Arquitectura
1. **Patrón Database-per-Service Estricto:** Cada microservicio es dueño absoluto de su base de datos. Ningún servicio puede consultar tablas ni tener cadenas de conexión a esquemas ajenos.
2. **Punto de Entrada Centralizado (Reverse Proxy / API Gateway):** Las aplicaciones cliente (React Web App) jamás consumen los microservicios de dominio directamente en producción ni en desarrollo orquestado. Toda interacción transita por el API Gateway (YARP).
3. **Trazabilidad Distribuida Mandatoria (`X-Correlation-ID`):** Toda petición HTTP iniciada desde la interfaz de usuario o recibida en el Gateway debe poseer un identificador de correlación estándar (`X-Correlation-ID`). Este identificador se propaga en todas las llamadas intra-servicio (HTTP headers) y se inyecta en el contexto de logging estructurado (Serilog `LogContext`).
4. **Desarrollo Guiado por Especificaciones (Spec-Driven Development):**
   - La verdad arquitectónica reside en los archivos de especificación (`specs/*.spec.md`).
   - El código se genera, valida y refactoriza a partir de las especificaciones y contratos formales.
   - Ninguna regla de negocio se codifica sin estar explicitada en la especificación de dominio correspondiente.
5. **Aislamiento de Infraestructura Local:** Todo el stack (bases de datos PostgreSQL aisladas, motor de logs Seq, Gateway, Microservicios y Frontend SPA) debe ser desplegable y operativo en local con un comando estándar: `docker compose up --build`.

---

### 1.2 Diagrama de Flujo y Topología de Red

```
[ Navegador Web: React 18 + Vite SPA ]
                  |
                  | HTTP/REST + X-Correlation-ID
                  v
[ API Gateway (YARP en C# / ASP.NET Core) ] :5000
    |                     |                     |
    | /gateway/users/*     | /gateway/products/* | /gateway/orders/*
    v                     v                     v
[ UserService ]       [ ProductService ]    [ OrderService ]
  (:8080)               (:8080)               (:8080)
    |                     |                     | (Http Client + Retry)
    |                     |                     +--------------------> [ ProductService: Deduct ]
    |                     |                     +--------------------> [ UserService: Validate ]
    |                     |                     |
    v                     v                     v
[ Postgres: users_db] [ Postgres: prods_db ] [ Postgres: orders_db ]
    |                     |                     |
    +---------------------+---------------------+
                          |
                          | Serilog Events (JSON + CorrelationId)
                          v
               [ Seq Centralized Logs ] :5341
```

---

## 2. ESTRUCTURA COMPLETA DEL REPOSITORIO (MONOREPO)

```
microservices-csharp-react-demo/
├── .speckit/
│   ├── config.json
│   └── templates/
│       └── service-spec-template.md
├── specs/
│   ├── 00-system-architecture.spec.md
│   ├── 01-api-gateway.spec.md
│   ├── 02-shared-logging.spec.md
│   ├── 03-user-service.spec.md
│   ├── 04-product-service.spec.md
│   ├── 05-order-service.spec.md
│   └── 06-react-frontend.spec.md
├── src/
│   ├── shared/
│   │   └── SharedKernel.Logging/
│   │       ├── SharedKernel.Logging.csproj
│   │       ├── CorrelationIdMiddleware.cs
│   │       ├── CorrelationIdDelegatingHandler.cs
│   │       └── SerilogLoggingExtensions.cs
│   ├── services/
│   │   ├── UserService/
│   │   │   ├── UserService.Domain/
│   │   │   ├── UserService.Application/
│   │   │   ├── UserService.Infrastructure/
│   │   │   ├── UserService.Api/
│   │   │   │   ├── Program.cs
│   │   │   │   └── appsettings.json
│   │   │   └── Dockerfile
│   │   ├── ProductService/
│   │   │   ├── ProductService.Domain/
│   │   │   ├── ProductService.Application/
│   │   │   ├── ProductService.Infrastructure/
│   │   │   ├── ProductService.Api/
│   │   │   │   ├── Program.cs
│   │   │   │   └── appsettings.json
│   │   │   └── Dockerfile
│   │   └── OrderService/
│   │       ├── OrderService.Domain/
│   │       ├── OrderService.Application/
│   │       ├── OrderService.Infrastructure/
│   │       ├── OrderService.Api/
│   │       │   ├── Program.cs
│   │       │   └── appsettings.json
│   │       └── Dockerfile
│   ├── gateway/
│   │   └── ApiGateway/
│   │       ├── ApiGateway.csproj
│   │       ├── Program.cs
│   │       ├── appsettings.json
│   │       └── Dockerfile
│   └── client/
│       └── web-app/
│           ├── package.json
│           ├── vite.config.ts
│           ├── tailwind.config.js
│           ├── src/
│           │   ├── api/
│           │   │   └── client.ts
│           │   ├── components/
│           │   │   ├── Navbar.tsx
│           │   │   ├── ProductCard.tsx
│           │   │   ├── CartModal.tsx
│           │   │   └── TelemetryBar.tsx
│           │   ├── store/
│           │   │   └── useAppStore.ts
│           │   ├── App.tsx
│           │   └── main.tsx
│           └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 3. ESPECIFICACIONES FORMALES (SPEC KIT / OPENSPEC)

### Spec 01: Observabilidad y Trazabilidad Centralizada (`specs/02-shared-logging.spec.md`)
```markdown
# SPEC-001: Centralized Logging and Distributed Tracing Specification
**Owner:** Core Architecture Team  
**Status:** Canonical  

## 1. Context & Purpose
Garantizar la visibilidad unificada de peticiones a través de múltiples límites de red mediante logging estructurado y preservación de correlación.

## 2. Requirements
- Todo componente ASP.NET Core debe registrar `CorrelationIdMiddleware` al inicio del pipeline.
- Si el header HTTP `X-Correlation-ID` existe, se utiliza; en caso contrario, se genera un nuevo UUIDv4.
- El valor se inyecta en el `LogContext` de Serilog y en los Response Headers.
- Los clientes HTTP salientes deben utilizar `CorrelationIdDelegatingHandler` para reenviar el header.
- El sink principal de desarrollo es Seq (`http://seq:5341`), enviando logs en formato JSON estructurado con enriquecedores: `ApplicationName`, `Environment`, `CorrelationId`, `MachineName`.
```

---

### Spec 02: User Service (`specs/03-user-service.spec.md`)
```markdown
# SPEC-002: User Service Specification
**Bounded Context:** Identity & Users  
**Data Storage:** PostgreSQL (`users_db`)  

## 1. Domain Entities
- **User:**
  - `Id`: UUID (PK)
  - `FullName`: Varchar(100), Not Null
  - `Email`: Varchar(150), Unique, Not Null
  - `PasswordHash`: Varchar(255), Not Null
  - `CreatedAtUtc`: Timestamp with time zone, UTC

## 2. Contract Endpoints
- `POST /api/v1/users/register`
  - Body: `{ "fullName": "string", "email": "valid_email", "password": "min_8_chars" }`
  - Response 201: `{ "id": "uuid", "fullName": "string", "email": "string" }`
  - Response 400: RFC 7807 Validation Errors
- `POST /api/v1/users/login`
  - Body: `{ "email": "string", "password": "string" }`
  - Response 200: `{ "token": "jwt_string", "userId": "uuid", "fullName": "string" }`
  - Response 401: Unauthorized
- `GET /api/v1/users/{id}`
  - Response 200: `{ "id": "uuid", "fullName": "string", "email": "string" }`
  - Response 404: Not Found
```

---

### Spec 03: Product Service (`specs/04-product-service.spec.md`)
```markdown
# SPEC-003: Product Service Specification
**Bounded Context:** Product Catalog & Inventory  
**Data Storage:** PostgreSQL (`products_db`)  

## 1. Domain Entities
- **Product:**
  - `Id`: UUID (PK)
  - `Name`: Varchar(150), Not Null
  - `Description`: Text, Nullable
  - `Price`: Decimal(18,2), Not Null, Value > 0
  - `Stock`: Integer, Not Null, Value >= 0
  - `Sku`: Varchar(50), Unique, Not Null

## 2. Contract Endpoints
- `GET /api/v1/products`
  - Response 200: `[ { "id": "uuid", "name": "string", "price": 0.0, "stock": 0, "sku": "string" } ]`
- `GET /api/v1/products/{id}`
  - Response 200: Product DTO
  - Response 404: Not Found
- `POST /api/v1/products`
  - Response 201: Created Product DTO
- `PATCH /api/v1/products/{id}/deduct-stock`
  - Body: `{ "quantity": integer }`
  - Response 200: `{ "id": "uuid", "remainingStock": integer }`
  - Response 409: Conflict ("Insufficient stock for requested operation")
```

---

### Spec 04: Order Service (`specs/05-order-service.spec.md`)
```markdown
# SPEC-004: Order Service Specification
**Bounded Context:** Sales & Order Processing  
**Data Storage:** PostgreSQL (`orders_db`)  

## 1. Domain Entities
- **Order:**
  - `Id`: UUID (PK)
  - `UserId`: UUID (Logical foreign key)
  - `CreatedAtUtc`: Timestamp with time zone
  - `TotalAmount`: Decimal(18,2)
  - `Status`: Varchar(30) ["Pending", "Confirmed", "Failed"]
  - `Items`: Collection of OrderItem
- **OrderItem:**
  - `Id`: UUID (PK)
  - `OrderId`: UUID (FK)
  - `ProductId`: UUID
  - `ProductName`: Varchar(150)
  - `UnitPrice`: Decimal(18,2)
  - `Quantity`: Integer

## 2. Process Orchestration (Synchronous Pattern)
1. Recibir `POST /api/v1/orders` `{ "userId": "uuid", "items": [ { "productId": "uuid", "quantity": 1 } ] }`.
2. Validar usuario contra `UserService` (`GET /api/v1/users/{userId}`). Si falla: 400 Bad Request.
3. Para cada item, consultar `ProductService` (`GET /api/v1/products/{productId}`). Verificar stock.
4. Invocar `PATCH /api/v1/products/{productId}/deduct-stock`. Si falla: abortar orden con 409 Conflict.
5. Persistir `Order` con estado `Confirmed` y registrar evento en Serilog con CorrelationId.
6. Retornar 201 Created con el detalle de la orden.
```

---

### Spec 05: API Gateway (`specs/01-api-gateway.spec.md`)
```markdown
# SPEC-005: API Gateway Specification
**Engine:** YARP (Yet Another Reverse Proxy) en ASP.NET Core  
**Port:** 5000  

## 1. Routing Rules
- `/gateway/users/{**catch-all}`    --> `http://user-service:8080/api/v1/users/{**catch-all}`
- `/gateway/products/{**catch-all}` --> `http://product-service:8080/api/v1/products/{**catch-all}`
- `/gateway/orders/{**catch-all}`   --> `http://order-service:8080/api/v1/orders/{**catch-all}`

## 2. Cross-Cutting Concerns
- Manejo de CORS para `http://localhost:5173` con Headers expuestos (`X-Correlation-ID`).
- Middleware de correlación para garantizar inyección de cabecera antes del reenvío por proxy.
```

---

### Spec 06: React Client Application (`specs/06-react-frontend.spec.md`)
```markdown
# SPEC-006: React Client Application Specification
**Stack:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Axios  

## 1. Core Features
- **Catálogo:** Carga productos desde `/gateway/products`.
- **Carrito Local:** Gestión de items, sumatoria de totales y botón de compra.
- **Checkout:** Envío de orden a `/gateway/orders`.
- **Barra de Telemetría (TelemetryBar):** Muestra al pie de página el último `X-Correlation-ID` procesado por el cliente, permitiendo copiarlo o abrir directamente la consola de Seq (`http://localhost:5341/#/events?filter=CorrelationId%20%3D%3D%20%22...%22`).
```

---

## 4. PLAYBOOK DE PROMPTS PARA GENERACIÓN ASISTIDA (SPEC-DRIVEN PROMPTS)

Usa estos prompts de manera secuencial en tu asistente (Cursor, GitHub Copilot, Claude Code):

### Prompt 1: Núcleo de Logging Compartido
```text
PROMPT 1: Creación del SharedKernel.Logging
Actúa como Arquitecto de Software .NET Senior.
Basado en la especificación 'specs/02-shared-logging.spec.md', crea la librería 'SharedKernel.Logging':
1. Crea 'CorrelationIdMiddleware.cs' que intercepte 'X-Correlation-ID', genere uno si no existe, lo exponga en Response Headers y lo empuje a Serilog.Context.LogContext.
2. Crea 'CorrelationIdDelegatingHandler.cs' para que los HttpClients salientes propaguen automáticamente dicho header.
3. Crea 'SerilogLoggingExtensions.cs' para configurar Serilog en WebApplicationBuilder con Sinks a Consola y Seq ('http://seq:5341' o variable SEQ_URL).
Proporciona el código C# completo, limpio y compatible con .NET 8.
```

### Prompt 2: Microservicio UserService
```text
PROMPT 2: Implementación de UserService
Basado en 'specs/03-user-service.spec.md' y usando 'SharedKernel.Logging':
1. Implementa UserService en .NET 8 con Clean Architecture mínima (Domain, Application, Infrastructure, Api en un proyecto unificado o proyectos desacoplados).
2. Entidad User con PostgreSQL y EF Core.
3. Endpoints: POST /register, POST /login, GET /{id}.
4. Configura Program.cs con SerilogLoggingExtensions y CorrelationIdMiddleware.
5. Incluye Dockerfile multietapa optimizado para Linux Alpine/Debian slim.
```

### Prompt 3: Microservicio ProductService
```text
PROMPT 3: Implementación de ProductService
Basado en 'specs/04-product-service.spec.md':
1. Implementa ProductService en .NET 8 con EF Core y PostgreSQL.
2. Entidad Product con métodos de dominio: DeductStock(int quantity).
3. Endpoints: GET /api/v1/products, GET /api/v1/products/{id}, POST /api/v1/products, PATCH /api/v1/products/{id}/deduct-stock.
4. Si el stock es menor que la cantidad requerida en el PATCH, retorna Conflict (409) con RFC 7807 Problem Details.
5. Agrega Data Seeding automático al arrancar con 4 productos de prueba.
6. Configura Program.cs con Serilog y CorrelationIdMiddleware. Dockerfile incluido.
```

### Prompt 4: Microservicio OrderService
```text
PROMPT 4: Implementación de OrderService y Orquestación Resiliente
Basado en 'specs/05-order-service.spec.md':
1. Implementa OrderService en .NET 8.
2. Configura Typed HttpClients ('ProductServiceClient' y 'UserServiceClient') usando IHttpClientFactory con CorrelationIdDelegatingHandler.
3. Configura políticas de reintento con Microsoft.Extensions.Http.Resilience o Polly.
4. Implementa el caso de uso 'CreateOrderCommand': valida usuario, valida stock de productos, llama al endpoint de deducción de stock en ProductService y guarda la orden localmente.
5. Endpoints REST, Dockerfile y configuración completa de logging.
```

### Prompt 5: API Gateway con YARP
```text
PROMPT 5: Implementación de API Gateway con YARP
Basado en 'specs/01-api-gateway.spec.md':
1. Crea el proyecto ApiGateway en .NET 8 usando 'Yarp.ReverseProxy'.
2. Configura appsettings.json con rutas y clusters hacia user-service, product-service y order-service en sus puertos internos de Docker.
3. Configura CORS para permitir 'http://localhost:5173' con credenciales y headers expuestos ('X-Correlation-ID').
4. Añade CorrelationIdMiddleware y configuración de Serilog apuntando a Seq.
5. Proporciona Dockerfile.
```

### Prompt 6: Frontend React + TypeScript
```text
PROMPT 6: Implementación del Frontend SPA React
Basado en 'specs/06-react-frontend.spec.md':
1. Implementa una SPA con React, TypeScript y Tailwind CSS.
2. Crea el cliente Axios configurado con interceptores que generen/capturen 'X-Correlation-ID'.
3. Vistas y Componentes:
   - Barra superior con selector de usuario demo y contador de carrito.
   - Listado de productos con botón para agregar al carrito.
   - Modal de compra que envíe la orden a '/gateway/orders'.
   - Componente 'TelemetryBar' inferior flotante que muestre el último Correlation ID y enlace a Seq ('http://localhost:5341').
4. Dockerfile multietapa con Nginx para servir la aplicación estática.
```

### Prompt 7: Orquestación Docker Compose
```text
PROMPT 7: Docker Compose Completo
Genera un archivo 'docker-compose.yml' listo para producción local que orqueste:
- Seq (puerto 5341).
- 3 contenedores de PostgreSQL independientes ('postgres-users', 'postgres-products', 'postgres-orders').
- 3 microservicios .NET ('user-service', 'product-service', 'order-service').
- 1 API Gateway YARP ('api-gateway' en puerto 5000).
- 1 Frontend React SPA ('frontend' en puerto 5173).
- Todas las redes y variables de entorno correctamente configuradas.
```

---

## 5. CÓDIGO FUENTE FUNDACIONAL COMPLETO

### 5.1 `SharedKernel.Logging/CorrelationIdMiddleware.cs`
```csharp
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Serilog.Context;

namespace SharedKernel.Logging
{
    public class CorrelationIdMiddleware
    {
        public const string CorrelationIdHeader = "X-Correlation-ID";
        private readonly RequestDelegate _next;

        public CorrelationIdMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var correlationId = context.Request.Headers[CorrelationIdHeader].ToString();

            if (string.IsNullOrWhiteSpace(correlationId))
            {
                correlationId = Guid.NewGuid().ToString("D");
            }

            context.Items[CorrelationIdHeader] = correlationId;
            context.Response.Headers[CorrelationIdHeader] = correlationId;

            using (LogContext.PushProperty("CorrelationId", correlationId))
            {
                await _next(context);
            }
        }
    }
}
```

---

### 5.2 `SharedKernel.Logging/CorrelationIdDelegatingHandler.cs`
```csharp
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace SharedKernel.Logging
{
    public class CorrelationIdDelegatingHandler : DelegatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CorrelationIdDelegatingHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var context = _httpContextAccessor.HttpContext;
            if (context != null && context.Items.TryGetValue(CorrelationIdMiddleware.CorrelationIdHeader, out var correlationIdObj))
            {
                var correlationId = correlationIdObj?.ToString();
                if (!string.IsNullOrEmpty(correlationId) && !request.Headers.Contains(CorrelationIdMiddleware.CorrelationIdHeader))
                {
                    request.Headers.Add(CorrelationIdMiddleware.CorrelationIdHeader, correlationId);
                }
            }

            return await base.SendAsync(request, cancellationToken);
        }
    }
}
```

---

### 5.3 `SharedKernel.Logging/SerilogLoggingExtensions.cs`
```csharp
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
            var seqUrl = Environment.GetEnvironmentVariable("SEQ_URL") ?? "http://localhost:5341";

            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("ApplicationName", serviceName)
                .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{ApplicationName}] (CorrId:{CorrelationId}) {Message:lj}{NewLine}{Exception}")
                .WriteTo.Seq(seqUrl)
                .CreateLogger();

            builder.Host.UseSerilog();
        }

        public static IApplicationBuilder UseCorrelationLogging(this IApplicationBuilder app)
        {
            return app.UseMiddleware<CorrelationIdMiddleware>();
        }
    }
}
```

---

### 5.4 Configuración de YARP API Gateway (`src/gateway/ApiGateway/appsettings.json`)
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ReverseProxy": {
    "Routes": {
      "user-service-route": {
        "ClusterId": "user-cluster",
        "Match": {
          "Path": "/gateway/users/{**catch-all}"
        },
        "Transforms": [
          { "PathPattern": "/api/v1/users/{**catch-all}" }
        ]
      },
      "product-service-route": {
        "ClusterId": "product-cluster",
        "Match": {
          "Path": "/gateway/products/{**catch-all}"
        },
        "Transforms": [
          { "PathPattern": "/api/v1/products/{**catch-all}" }
        ]
      },
      "order-service-route": {
        "ClusterId": "order-cluster",
        "Match": {
          "Path": "/gateway/orders/{**catch-all}"
        },
        "Transforms": [
          { "PathPattern": "/api/v1/orders/{**catch-all}" }
        ]
      }
    },
    "Clusters": {
      "user-cluster": {
        "Destinations": {
          "destination-user": { "Address": "http://user-service:8080" }
        }
      },
      "product-cluster": {
        "Destinations": {
          "destination-product": { "Address": "http://product-service:8080" }
        }
      },
      "order-cluster": {
        "Destinations": {
          "destination-order": { "Address": "http://order-service:8080" }
        }
      }
    }
  }
}
```

---

### 5.5 `ApiGateway/Program.cs`
```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using SharedKernel.Logging;

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureCentralizedLogging("ApiGateway");

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("X-Correlation-ID");
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseCors("CorsPolicy");
app.UseCorrelationLogging();
app.MapReverseProxy();

app.Run();
```

---

### 5.6 Cliente Frontend: Módulo de API con Axios (`src/client/web-app/src/api/client.ts`)
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000/gateway',
  headers: {
    'Content-Type': 'application/json',
  },
});

export let activeCorrelationId: string = '';
const listeners = new Set<(id: string) => void>();

export const subscribeToCorrelationId = (listener: (id: string) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyCorrelationChange = (id: string) => {
  activeCorrelationId = id;
  listeners.forEach(fn => fn(id));
};

apiClient.interceptors.request.use((config) => {
  const correlationId = crypto.randomUUID();
  config.headers['X-Correlation-ID'] = correlationId;
  notifyCorrelationChange(correlationId);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const received = response.headers['x-correlation-id'];
    if (received) {
      notifyCorrelationChange(received);
    }
    return response;
  },
  (error) => {
    const received = error.response?.headers?.['x-correlation-id'];
    if (received) {
      notifyCorrelationChange(received);
    }
    return Promise.reject(error);
  }
);
```

---

### 5.7 Componente React: TelemetryBar (`src/client/web-app/src/components/TelemetryBar.tsx`)
```tsx
import React, { useEffect, useState } from 'react';
import { activeCorrelationId, subscribeToCorrelationId } from '../api/client';
import { Activity, ExternalLink, Copy, Check } from 'lucide-react';

export const TelemetryBar: React.FC = () => {
  const [currentId, setCurrentId] = useState<string>(activeCorrelationId || 'Sin peticiones recientes');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCorrelationId((newId) => {
      setCurrentId(newId);
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = () => {
    if (!currentId || currentId.includes('Sin')) return;
    navigator.clipboard.writeText(currentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seqQueryUrl = `http://localhost:5341/#/events?filter=CorrelationId%20%3D%3D%20%22${encodeURIComponent(currentId)}%22`;

  return (
    <aside aria-label="Consola de telemetría de desarrollo" className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-300 px-4 py-2 text-xs flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="font-semibold text-slate-400">Correlation ID:</span>
        <code className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono">
          {currentId}
        </code>
        <button
          onClick={copyToClipboard}
          className="p-1 hover:bg-slate-800 rounded transition"
          title="Copiar ID"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <a
          href={seqQueryUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
        >
          <span>Abrir Traza en Seq</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};
```

---

## 6. ORQUESTACIÓN CON DOCKER COMPOSE (`docker-compose.yml`)

```yaml
services:
  seq:
    image: datalust/seq:latest
    container_name: seq-telemetry
    environment:
      - ACCEPT_EULA=Y
    ports:
      - "5341:80"
    networks:
      - app-network

  postgres-users:
    image: postgres:16-alpine
    container_name: postgres-users
    environment:
      POSTGRES_USER: user_admin
      POSTGRES_PASSWORD: user_secret
      POSTGRES_DB: users_db
    ports:
      - "5432:5432"
    volumes:
      - users_data:/var/lib/postgresql/data
    networks:
      - app-network

  postgres-products:
    image: postgres:16-alpine
    container_name: postgres-products
    environment:
      POSTGRES_USER: prod_admin
      POSTGRES_PASSWORD: prod_secret
      POSTGRES_DB: products_db
    ports:
      - "5433:5432"
    volumes:
      - products_data:/var/lib/postgresql/data
    networks:
      - app-network

  postgres-orders:
    image: postgres:16-alpine
    container_name: postgres-orders
    environment:
      POSTGRES_USER: order_admin
      POSTGRES_PASSWORD: order_secret
      POSTGRES_DB: orders_db
    ports:
      - "5434:5432"
    volumes:
      - orders_data:/var/lib/postgresql/data
    networks:
      - app-network

  user-service:
    build:
      context: .
      dockerfile: src/services/UserService/Dockerfile
    container_name: user-service
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - SEQ_URL=http://seq:80
      - ConnectionStrings__DefaultConnection=Host=postgres-users;Port=5432;Database=users_db;Username=user_admin;Password=user_secret
    depends_on:
      - seq
      - postgres-users
    networks:
      - app-network

  product-service:
    build:
      context: .
      dockerfile: src/services/ProductService/Dockerfile
    container_name: product-service
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - SEQ_URL=http://seq:80
      - ConnectionStrings__DefaultConnection=Host=postgres-products;Port=5432;Database=products_db;Username=prod_admin;Password=prod_secret
    depends_on:
      - seq
      - postgres-products
    networks:
      - app-network

  order-service:
    build:
      context: .
      dockerfile: src/services/OrderService/Dockerfile
    container_name: order-service
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - SEQ_URL=http://seq:80
      - ConnectionStrings__DefaultConnection=Host=postgres-orders;Port=5432;Database=orders_db;Username=order_admin;Password=order_secret
      - Services__UserServiceUrl=http://user-service:8080
      - Services__ProductServiceUrl=http://product-service:8080
    depends_on:
      - seq
      - postgres-orders
      - user-service
      - product-service
    networks:
      - app-network

  api-gateway:
    build:
      context: .
      dockerfile: src/gateway/ApiGateway/Dockerfile
    container_name: api-gateway
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - SEQ_URL=http://seq:80
    depends_on:
      - user-service
      - product-service
      - order-service
    networks:
      - app-network

  frontend:
    build:
      context: ./src/client/web-app
      dockerfile: Dockerfile
    container_name: frontend-react
    ports:
      - "5173:80"
    depends_on:
      - api-gateway
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  users_data:
  products_data:
  orders_data:
```

---

## 7. PASOS DE DESPLIEGUE Y VALIDACIÓN DE LA DEMO

1. **Generación del Código:**
   Aplica cada uno de los 7 prompts de la Sección 4 de forma secuencial en tu entorno de desarrollo.
2. **Levantar la Infraestructura:**
   ```bash
   docker compose up --build -d
   ```
3. **Verificar Servicios:**
   - **Frontend React:** Accede a `http://localhost:5173`.
   - **API Gateway:** Respondiendo en `http://localhost:5000`.
   - **Consola Seq:** Ingresa a `http://localhost:5341` para observar los logs en tiempo real.
4. **Prueba de Trazabilidad:**
   - Realiza una compra desde el frontend React.
   - Observa el `Correlation ID` generado en la barra inferior `TelemetryBar`.
   - Haz clic en **"Abrir Traza en Seq"** para verificar la secuencia completa del log: Gateway $\rightarrow$ OrderService $\rightarrow$ UserService $\rightarrow$ ProductService.