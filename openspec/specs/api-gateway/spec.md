# Capability: api-gateway

## Purpose
Garantizar un punto de entrada centralizado y seguro (Reverse Proxy) utilizando YARP en ASP.NET Core para todas las peticiones desde el cliente hacia los microservicios de dominio, preservando CORS y trazabilidad distribuida mediante X-Correlation-ID.

## Requirements

### Requirement: Centralized Reverse Proxy Routing
El API Gateway MUST actuar como el único punto de entrada público HTTP para los clientes frontend y redirigir las peticiones a los microservicios internos correspondientes.

#### Scenario: Route incoming request to UserService
- **WHEN** Recibe una petición HTTP a `/gateway/users/{path}`
- **THEN** Reenvía la petición internamente a `http://user-service:8080/api/v1/users/{path}`

#### Scenario: Route incoming request to ProductService
- **WHEN** Recibe una petición HTTP a `/gateway/products/{path}`
- **THEN** Reenvía la petición internamente a `http://product-service:8080/api/v1/products/{path}`

#### Scenario: Route incoming request to OrderService
- **WHEN** Recibe una petición HTTP a `/gateway/orders/{path}`
- **THEN** Reenvía la petición internamente a `http://order-service:8080/api/v1/orders/{path}`

### Requirement: Cross-Cutting Headers and CORS
El Gateway MUST gestionar CORS permitiendo los orígenes del frontend (`http://localhost:5173` y `http://localhost:3000`) exponiendo la cabecera `X-Correlation-ID`.

#### Scenario: Correlation ID injection and forwarding
- **WHEN** Una petición entrante no posee la cabecera `X-Correlation-ID`
- **THEN** Genera un nuevo GUIDv4, lo inyecta en la petición hacia el microservicio y lo retorna en la respuesta al cliente
