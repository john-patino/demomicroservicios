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
