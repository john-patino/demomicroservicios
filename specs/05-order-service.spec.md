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

## 2. Process Orchestration (Synchronous Pattern with Basic Rollback)
1. Recibir `POST /api/v1/orders` `{ "userId": "uuid", "items": [ { "productId": "uuid", "quantity": 1 } ] }`.
2. Validar usuario contra `UserService` (`GET /api/v1/users/{userId}`). Si falla: 400 Bad Request.
3. Para cada item, consultar `ProductService` (`GET /api/v1/products/{productId}`). Verificar stock.
4. Invocar `PATCH /api/v1/products/{productId}/deduct-stock`. Si falla: abortar orden con 409 Conflict.
5. **Acción Compensatoria (Rollback):** Si la deducción de algún ítem falla o la persistencia de la orden en `orders_db` falla, ejecutar llamadas de reversión `PATCH /api/v1/products/{id}/restore-stock` para todos los ítems que ya habían sido descontados.
6. Persistir `Order` con estado `Confirmed` y registrar evento en Serilog con CorrelationId.
7. Retornar 201 Created con el detalle de la orden.
