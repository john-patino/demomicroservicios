# Demo de Arquitectura de Microservicios (.NET 8, YARP, PostgreSQL, React 18 & Seq)

[![.NET 8](https://img.shields.io/badge/.NET-8.0-blueviolet.svg)](https://dotnet.microsoft.com/)
[![YARP](https://img.shields.io/badge/API_Gateway-YARP_v2.1-blue.svg)](https://microsoft.github.io/reverse-proxy/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18_Next.js-61dafb.svg)](https://react.dev/)
[![Seq](https://img.shields.io/badge/Observabilidad-Seq-5C2D91.svg)](https://datalust.co/seq)

Repositorio de referencia académica y profesional desarrollado para la cátedra de **Arquitectura de Software (Unicesar 2026)**. Demuestra la implementación práctica y fundamentada de un sistema distribuido basado en microservicios con **ASP.NET Core 8**, proxy inverso de borde con **YARP**, persistencia desacoplada con **PostgreSQL**, observabilidad centralizada con **Serilog + Seq** y un cliente web reactivo en **Next.js / React 18**.

---

## 🧭 Acceso a los Diagramas de Arquitectura

El proyecto cuenta con un **Portal Interactivo de Diagramas Editoriales** en modo oscuro diseñado para el análisis visual del sistema:

> 🌐 **Ver Portal de Diagramas en la Aplicación Web:**  
> Cuando el frontend esté en ejecución, puedes ingresar directamente a:  
> [**`http://localhost:3000/diagrams/index.html`**](http://localhost:3000/diagrams/index.html) o hacer clic en el botón **"Diagramas de Arquitectura"** en la barra superior o menú lateral.
>
> 📁 **Ver Archivos Locales en el Repositorio:**  
> Abre directamente en tu navegador el portal central: [**`docs/diagrams/index.html`**](docs/diagrams/index.html).

### Catálogo de Diagramas Disponibles
| # | Tipo de Diagrama | Archivo | Dimensión Arquitectónica Representada |
|---|---|---|---|
| **01** | **Architecture** | [`microservices-architecture-dark.html`](docs/diagrams/microservices-architecture-dark.html) | Topología general, enrutamiento YARP y sumidero unificado de Seq. |
| **02** | **Sequence** | [`correlation-id-sequence-dark.html`](docs/diagrams/correlation-id-sequence-dark.html) | Ciclo de vida y propagación de `X-Correlation-ID` desde React hasta Seq. |
| **03** | **Deployment** | [`docker-deployment-dark.html`](docs/diagrams/docker-deployment-dark.html) | Contenedores Docker Compose, red virtual `microservices-net` y volúmenes. |
| **04** | **State Machine** | [`order-state-machine-dark.html`](docs/diagrams/order-state-machine-dark.html) | Ciclo de vida de pedidos, transiciones de estado finitas y compensación. |
| **05** | **Database Schema** | [`database-schema-dark.html`](docs/diagrams/database-schema-dark.html) | Esquema DDL físico de PostgreSQL (*database-per-service*). |
| **06** | **Flowchart** | [`resilience-flowchart-dark.html`](docs/diagrams/resilience-flowchart-dark.html) | Lógica de decisión del Gateway, sondeos `/health`, reintentos y fallback. |

---

## 🎯 El Caso que se está Resolviendo

### El Problema
En aplicaciones monolíticas tradicionales, todos los módulos comparten el mismo proceso en memoria y la misma base de datos relacional. Aunque esto simplifica el inicio del desarrollo, genera graves problemas a escala:
1. **Acoplamiento Fuerte:** Un cambio en el modelo de datos de usuarios puede romper el módulo de facturación o pedidos.
2. **Cascada de Fallos:** Si el proceso de inventario colapsa o consume el 100% de los recursos, toda la tienda se cae (incluyendo login y pagos).
3. **Opacidad en Producción:** Cuando ocurre un error en una transacción que atraviesa múltiples capas lógicas, es casi imposible reconstruir cronológicamente qué pasó a partir de archivos de log en texto plano no estructurados.

### La Solución Implementada
Este proyecto resuelve estos problemas implementando un **caso de comercio electrónico resiliente y observable de extremo a extremo**:

* **UserService (`:5001`):** Autenticación y gestión de perfiles de usuario.
* **ProductService (`:5002`):** Catálogo de productos y control de stock en tiempo real.
* **OrderService (`:5003`):** Procesamiento de pedidos con agregados y transiciones de estado.
* **FaultyService (`:5004`):** Microservicio simulador de fallos que permite inyectar caídas controladas, retardos y excepciones para verificar la respuesta del sistema.
* **YARP API Gateway (`:5000`):** Único punto de entrada público que orquesta el tráfico, realiza sondeos activos de salud (`/health`) y aísla la red interna.
* **Seq Observability Sink (`:5341` / `:8081`):** Sumidero unificado donde convergen todas las trazas y eventos estructurados correlacionados mediante un `CorrelationId` transversal.
* **Frontend Web React (`:3000`):** Interfaz moderna que permite comprar, ver órdenes y monitorear el estado de salud de cada microservicio en tiempo real sin recargar la página.

---

## 📚 Fundamentos Teóricos de Microservicios Aplicados

### 1. Database-per-Service (Base de Datos por Servicio)
Cada microservicio es dueño exclusivo de su almacén de datos:
* `UserService` administra `UsersDb`.
* `ProductService` administra `ProductsDb`.
* `OrderService` administra `OrdersDb`.

> **Regla de Oro:** Ningún microservicio tiene permitido ejecutar sentencias SQL directas (JOINs, SELECTs o transacciones compartidas) sobre la base de datos de otro microservicio. Las relaciones entre dominios (por ejemplo, el `user_id` o `product_id` dentro de una orden) se almacenan únicamente como identificadores `Guid` lógicos. Esto garantiza que cualquier servicio pueda cambiar su motor de base de datos o su esquema sin afectar a los demás.

### 2. API Gateway Pattern (Patrón de Pasarela de Enlace)
Los clientes web y móviles nunca se comunican directamente con los microservicios internos. En su lugar, interactúan exclusivamente con **YARP (Yet Another Reverse Proxy)**:
* **Ocultamiento de Topología:** Los microservicios operan en una red privada virtual de Docker (`microservices-net`), sin puertos expuestos al exterior.
* **Enrutamiento Declarativo:** YARP mapea rutas públicas como `/api/products/{**catch-all}` al clúster correspondiente.
* **Control de Calidad de Servicio:** Punto idóneo para inyección de cabeceras, balanceo de carga, limitación de tasa (*rate limiting*) y terminación TLS.

### 3. Trazabilidad Distribuida & Correlation ID
En una arquitectura distribuida, una sola acción de usuario (ej. "Realizar Pedido") desencadena múltiples llamadas HTTP internas. Para evitar perder el rastro:
1. El cliente genera un identificador único global `X-Correlation-ID` (UUID v4).
2. El API Gateway recibe el encabezado y, si viene ausente, lo genera de forma determinista.
3. El middleware `CorrelationIdMiddleware` inserta el ID en el `LogContext` de Serilog:
   ```csharp
   using (LogContext.PushProperty("CorrelationId", correlationId))
   {
       await _next(context);
   }
   ```
4. El manejador delegatorio `CorrelationIdDelegatingHandler` propaga automáticamente la cabecera en cualquier llamada HTTP saliente a otros servicios.
5. Todos los logs generados en cualquier microservicio quedan marcados con la misma propiedad, permitiendo filtrar en Seq con una sola consulta:  
   `@Properties['CorrelationId'] == '7f8a3c...'`.

### 4. Tolerancia a Fallos & Circuit Breaker (Disyuntor)
Cuando un servicio downstream falla (por ejemplo, la base de datos de productos se desconecta):
* **Sondeos Activos:** YARP ejecuta periódicamente un sondeo a `/health` en cada nodo.
* **Circuit Breaker:** Si el servicio falla de manera recurrente, el circuito pasa a estado **Abierto**, impidiendo que nuevas peticiones saturen el nodo caído.
* **Degradación Grácil:** En lugar de esperar tiempos de espera prolongados (*timeouts*), el Gateway retorna de inmediato una respuesta estándar **HTTP 503 Service Unavailable** con formato `ProblemDetails` (RFC 7807).
* **Auto-Recuperación:** Cuando el servicio vuelve a estar saludable, el circuito pasa a **Semi-Abierto** y reanuda el tráfico automáticamente.

### 5. Registro Estructurado CLEF (Compact Log Event Format)
A diferencia de los archivos de texto `.log` donde se concatena texto plano ilegible por máquinas, este sistema emite eventos en formato JSON compacto:
```json
{"@t":"2026-09-14T20:00:00.000Z","@m":"Consultando catálogo de productos","@l":"Information","CorrelationId":"7f8a3c","Service":"ProductService"}
```
Esto permite realizar análisis métricos, conteos de excepciones por servicio y gráficos de latencia en tiempo real en Seq.

---

## 🏗️ Topología del Sistema & Mapa de Puertos

```text
[ Navegador Web / Cliente React ]  (:3000)
             │
             ▼  (HTTP / HTTPS)
    [ YARP API Gateway ]  (:5000)
             ├───► /api/users/*    ──► [ UserService ]    (:5001) ──► PostgreSQL (UsersDb)
             ├───► /api/products/* ──► [ ProductService ] (:5002) ──► PostgreSQL (ProductsDb)
             ├───► /api/orders/*   ──► [ OrderService ]   (:5003) ──► PostgreSQL (OrdersDb)
             └───► /api/faulty/*   ──► [ FaultyService ]  (:5004) ──► (Simulador de Fallas)
             │
             └───────────────────────► [ Seq Sink ]       (:5341 Ingest / :8081 Web UI)
```

| Componente | Rol en la Arquitectura | Puerto Host | Puerto Docker | Almacén Asociado |
|---|---|---|---|---|
| **`frontend-web`** | Cliente SPA en Next.js / React 18 | `3000` | `80` | — |
| **`api-gateway`** | Enrutador YARP Reverse Proxy | `5000` | `8080` | — |
| **`user-service`** | Microservicio de Usuarios y Auth | `5001` | `8080` | `UsersDb` |
| **`product-service`** | Microservicio de Catálogo y Stock | `5002` | `8080` | `ProductsDb` |
| **`order-service`** | Microservicio de Pedidos y Pagos | `5003` | `8080` | `OrdersDb` |
| **`faulty-service`** | Simulador de Fallos e Inestabilidad | `5004` | `8080` | — |
| **`postgres-db`** | Servidor de Base de Datos Multi-esquema | `5432` | `5432` | Vol: `postgres_data` |
| **`seq-telemetry`** | Sumidero Central de Trazas Serilog | `5341` (API) / `8081` (UI) | `5341` / `80` | Vol: `seq_data` |

---

## 🚀 Guía de Puesta en Marcha

### Prerrequisitos
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (opcional, solo para compilación/depuración local sin contenedor).
* [Node.js v18+](https://nodejs.org/) (opcional, solo para desarrollo frontend local).

### Ejecución con Docker Compose (Recomendada)
Para compilar y levantar toda la infraestructura (6 microservicios + PostgreSQL + Seq) con un solo comando:

```bash
docker compose up -d --build
```

Verifica que todos los contenedores estén en estado saludable:
```bash
docker compose ps
```

### URLs de Acceso Principal
* **Aplicación Web:** [http://localhost:3000](http://localhost:3000)
* **Portal de Diagramas:** [http://localhost:3000/diagrams/index.html](http://localhost:3000/diagrams/index.html)
* **Panel de Seq (Trazabilidad):** [http://localhost:5341](http://localhost:5341) (o [http://localhost:8081](http://localhost:8081))
* **Swagger API Gateway:** [http://localhost:5000/swagger](http://localhost:5000/swagger)

---

## 🧪 Laboratorio de Pruebas: Observabilidad y Resiliencia

### 1. Rastrear una Petición de Extremo a Extremo
1. Ingresa a la tienda web en [http://localhost:3000](http://localhost:3000).
2. Agrega un producto al carrito y realiza un checkout.
3. Abre la **Consola de Operaciones** en el menú de la aplicación web ([http://localhost:3000/logs](http://localhost:3000/logs)) y copia el `CorrelationId` generado.
4. Abre la consola de **Seq** en [http://localhost:5341](http://localhost:5341).
5. En la barra de búsqueda de Seq, escribe:
   ```sql
   @Properties['CorrelationId'] == 'EL_ID_COPIADO'
   ```
6. Observarás en orden cronológico:
   * Recepción en YARP Gateway.
   * Procesamiento en `OrderService`.
   * Consulta a base de datos en PostgreSQL.
   * Retorno de código 200 OK con el tiempo de respuesta.

### 2. Simular una Caída de Servicio y Observar la Recuperación
1. Desde la web, navega a la sección de pruebas de fallo o invoca el endpoint de fallo:
   ```bash
   curl -X POST http://localhost:5000/api/faulty/toggle-failure
   ```
2. Observa cómo el Gateway detecta la falla y devuelve una respuesta estructurada `503 Service Unavailable` sin tumbar los otros servicios (los usuarios aún pueden navegar por el catálogo).
3. Reactiva el servicio:
   ```bash
   curl -X POST http://localhost:5000/api/faulty/toggle-failure
   ```
4. El sondeo de salud `/health` de YARP detecta la recuperación y el tráfico se restablece de forma automática.

---

## 📐 Estructura del Repositorio

```text
Microservicios/
├── docs/
│   └── diagrams/              # Portal de diagramas HTML interactivos
│       ├── index.html         # Portal Central de Arquitectura
│       ├── microservices-architecture-dark.html
│       ├── correlation-id-sequence-dark.html
│       ├── docker-deployment-dark.html
│       ├── order-state-machine-dark.html
│       ├── database-schema-dark.html
│       └── resilience-flowchart-dark.html
├── src/
│   ├── client/web-app/        # Frontend SPA en Next.js / React 18 + PrimeReact
│   │   └── public/diagrams/   # Diagramas servidos estáticamente en la web
│   ├── gateway/ApiGateway/    # YARP Reverse Proxy & Correlation Middleware
│   ├── services/              # Microservicios de dominio (.NET 8 Web API)
│   │   ├── UserService/
│   │   ├── ProductService/
│   │   ├── OrderService/
│   │   └── FaultyService/
│   └── shared/                # Kernel compartido (SharedKernel.Logging)
├── docker-compose.yml         # Manifiesto de orquestación de contenedores
└── README.md                  # Documentación principal del sistema
```

---

**Cátedra de Arquitectura de Software · Universidad Popular del Cesar (2026)**