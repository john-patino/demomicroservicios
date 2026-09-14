# Capability: order-service

## Purpose
Orquestar el ciclo de vida de las órdenes de compra de los usuarios de manera resiliente, coordinando síncronamente la validación de usuarios con UserService, la deducción de inventario con ProductService y la ejecución de compensaciones (rollback) en caso de fallos, almacenando las órdenes en PostgreSQL (`orders_db`).

## Requirements

### Requirement: Order Creation and Synchronous Orchestration
El servicio de órdenes MUST orquestar el flujo de checkout coordinando validaciones entre los microservicios pertinentes.

#### Scenario: Successful order creation
- **WHEN** Recibe `POST /api/v1/orders` con `userId` e `items`, el usuario es válido en `UserService` y hay stock suficiente en `ProductService`
- **THEN** Deduce el stock en `ProductService`, persiste la orden con estado `Confirmed`, emite logs estructurados con `CorrelationId` y retorna código HTTP 201 Created

#### Scenario: Invalid or missing user
- **WHEN** Recibe `POST /api/v1/orders` y la validación contra `UserService` retorna 404 Not Found
- **THEN** Aborta la creación de la orden y retorna código HTTP 400 Bad Request indicando que el usuario no existe

#### Scenario: Stock failure during checkout
- **WHEN** `ProductService` responde 409 Conflict al intentar deducir el stock de algún item
- **THEN** Cancela la transacción de la orden, retorna código HTTP 409 Conflict al cliente y no persiste la orden como confirmada

### Requirement: Compensating Stock Rollback Orchestration
El servicio de órdenes MUST ejecutar acciones compensatorias de restauración de stock contra `ProductService` si la creación de la orden falla después de haber descontado inventario previamente.

#### Scenario: Trigger compensating rollback on persistence or downstream failure
- **WHEN** El stock de uno o más ítems fue descontado exitosamente pero la persistencia de la orden en `orders_db` falla o un ítem subsecuente es rechazado
- **THEN** Envía llamadas HTTP `PATCH /api/v1/products/{id}/restore-stock` para reponer las unidades descontadas de cada ítem previo, registra un evento Warning en Serilog con `CorrelationId` y responde con el error correspondiente

### Requirement: Resilience and Retry Policies
Las llamadas HTTP salientes hacia `UserService` y `ProductService` MUST implementar políticas de reintento transitorio y timeout.

#### Scenario: Transient network hiccup on product query
- **WHEN** Una llamada saliente a `ProductService` falla por un error 5xx transitorio o socket timeout
- **THEN** La política de resiliencia (Polly / Microsoft.Extensions.Http.Resilience) reintenta la petición hasta 3 veces antes de fallar definitivamente
