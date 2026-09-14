# Capability: system-architecture

## Purpose
Establecer las directrices de topología de red, contención en Docker Compose y aislamiento estricto de bases de datos por servicio (Database-per-Service) para la solución completa de microservicios.

## Requirements

### Requirement: Database per Service Isolation
Cada microservicio de dominio MUST ser el propietario exclusivo de su propia base de datos PostgreSQL independiente sin acceso cruzado.

#### Scenario: Isolated PostgreSQL instances in Docker
- **WHEN** Se inicializa el entorno de ejecución
- **THEN** Se ejecutan tres instancias o bases de datos aisladas: `postgres-users` (`users_db`), `postgres-products` (`products_db`) y `postgres-orders` (`orders_db`), sin que ningún servicio tenga credenciales de una base de datos ajena

### Requirement: Unified Local Orchestration
El sistema completo MUST ser desplegable y operativo en local mediante una sola instrucción de orquestación.

#### Scenario: Orchestrated stack startup
- **WHEN** El desarrollador ejecuta `docker compose up --build`
- **THEN** Se levantan en red interna el motor de logs Seq (:5341), las 3 bases de datos PostgreSQL, los 3 microservicios .NET, el API Gateway YARP (:5000) y la aplicación frontend
