# SPEC-000: System Architecture & Governance Specification
**Owner:** Core Architecture Team  
**Status:** Canonical  

## 1. Context & Topology
Arquitectura de microservicios distribuida con .NET 8, PostgreSQL, YARP, Serilog, Seq y frontend SPA.

## 2. Immutable Rules
1. **Database-per-Service Estricto:** Cada microservicio es dueño absoluto de su base de datos (`users_db`, `products_db`, `orders_db`).
2. **Punto de Entrada Centralizado:** Las aplicaciones cliente interactúan exclusivamente a través de YARP API Gateway (:5000).
3. **Trazabilidad Distribuida Mandatoria:** Toda petición HTTP propaga `X-Correlation-ID` en headers y `LogContext` de Serilog.
4. **Desarrollo Guiado por Especificaciones (SDD):** El código se deriva y valida contra estas especificaciones formales.
5. **Orquestación Local Unificada:** Todo el stack levanta con `docker compose up --build`.

## 3. Network Ports
- **API Gateway (YARP):** `http://localhost:5000`
- **Seq Centralized Logs:** `http://localhost:5341`
- **Frontend SPA:** `http://localhost:5173` / `http://localhost:3000`
- **PostgreSQL Users:** `localhost:5432` -> contenedor `postgres-users`
- **PostgreSQL Products:** `localhost:5433` -> contenedor `postgres-products`
- **PostgreSQL Orders:** `localhost:5434` -> contenedor `postgres-orders`
