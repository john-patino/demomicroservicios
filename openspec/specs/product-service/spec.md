# Capability: product-service

## Purpose
Administrar el catálogo de productos disponibles, precios y control de inventario con deducción atómica de stock y acciones compensatorias de restauración en su base de datos aislada PostgreSQL (`products_db`).

## Requirements

### Requirement: Product Catalog Query Contract
El servicio MUST listar el catálogo completo y permitir consultar el detalle de un producto específico.

#### Scenario: List all active products
- **WHEN** Recibe `GET /api/v1/products`
- **THEN** Retorna código HTTP 200 OK con el listado de productos incluyendo id, name, price, stock y sku

#### Scenario: Get product by ID
- **WHEN** Recibe `GET /api/v1/products/{id}` para un producto existente
- **THEN** Retorna código HTTP 200 OK con el detalle del producto

### Requirement: Atomic Stock Deduction Contract
El servicio MUST proveer una operación atómica para descontar unidades del stock disponible garantizando que no se generen inventarios negativos.

#### Scenario: Sufficient stock deduction
- **WHEN** Recibe `PATCH /api/v1/products/{id}/deduct-stock` con `{ "quantity": N }` y `stock >= N`
- **THEN** Descuenta N unidades de la base de datos de manera atómica, persiste el cambio y retorna 200 OK con el stock restante

#### Scenario: Insufficient stock conflict
- **WHEN** Recibe `PATCH /api/v1/products/{id}/deduct-stock` con una cantidad mayor al stock disponible
- **THEN** Rechaza la operación con código HTTP 409 Conflict y Problem Details RFC 7807 indicando "Insufficient stock for requested operation"

### Requirement: Atomic Stock Restoration (Compensation)
El servicio MUST proveer un endpoint atómico para reponer unidades de stock previamente descontadas ante fallos o cancelaciones en la orquestación de órdenes.

#### Scenario: Successful stock restoration
- **WHEN** Recibe `PATCH /api/v1/products/{id}/restore-stock` con `{ "quantity": N }`
- **THEN** Incrementa N unidades en la base de datos de manera atómica y retorna código HTTP 200 OK con el stock actualizado
