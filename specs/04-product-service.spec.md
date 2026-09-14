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
- `PATCH /api/v1/products/{id}/restore-stock`
  - Body: `{ "quantity": integer }`
  - Response 200: `{ "id": "uuid", "currentStock": integer }`
  - Response 400: Bad Request
