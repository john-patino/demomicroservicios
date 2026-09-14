# Capability: shared-logging

## Purpose
Garantizar la observabilidad unificada, trazabilidad distribuida y logging estructurado a través de todos los microservicios y clientes del sistema mediante el header X-Correlation-ID y Serilog integrado con Seq.

## Requirements

### Requirement: Correlation ID Middleware Ingestion
Todo servicio backend HTTP ASP.NET Core MUST registrar un middleware de correlación al inicio del pipeline HTTP para capturar o generar el identificador de trazabilidad.

#### Scenario: Existing correlation header received
- **WHEN** Una petición HTTP entrante contiene el header `X-Correlation-ID`
- **THEN** El middleware reutiliza el identificador, lo inyecta en el contexto de la petición (`HttpContext.Items`) y en los response headers

#### Scenario: Missing correlation header
- **WHEN** Una petición HTTP entrante no contiene el header `X-Correlation-ID`
- **THEN** El middleware genera un nuevo UUIDv4, lo asigna a `HttpContext.Items` y lo expone en los response headers

### Requirement: Structured Logging Context Injection
El sistema de logging MUST enriquecer cada log estructurado emitido durante la petición con la propiedad `CorrelationId`.

#### Scenario: Serilog LogContext enrichment
- **WHEN** Se ejecuta cualquier lógica dentro del ciclo de vida de la petición HTTP
- **THEN** Serilog empuja `CorrelationId` al `LogContext` permitiendo filtrar todos los eventos en Seq por dicha propiedad

### Requirement: Outgoing HTTP Tracing Propagation
Todos los clientes HTTP salientes inter-servicio MUST propagar automáticamente el identificador de correlación.

#### Scenario: Downstream HTTP call via DelegatingHandler
- **WHEN** Un microservicio realiza una llamada HTTP saliente a otro microservicio mediante `HttpClient`
- **THEN** `CorrelationIdDelegatingHandler` extrae el `X-Correlation-ID` activo del `IHttpContextAccessor` y lo añade a las cabeceras de la petición saliente
