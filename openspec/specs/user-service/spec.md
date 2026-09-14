# Capability: user-service

## Purpose
Proveer la gestión de identidades y perfiles de usuarios para el ecosistema de microservicios, operando con su propia base de datos aislada en PostgreSQL (`users_db`).

## Requirements

### Requirement: User Registration Contract
El servicio MUST exponer un endpoint para el registro de nuevos usuarios garantizando la unicidad del correo electrónico y el hash seguro de contraseñas.

#### Scenario: Successful registration
- **WHEN** Recibe `POST /api/v1/users/register` con `fullName`, `email` y `password` válidos
- **THEN** Persiste el usuario en `users_db`, responde código HTTP 201 Created con el ID asignado y sin revelar el password hash

#### Scenario: Duplicate email conflict
- **WHEN** Recibe un correo electrónico que ya existe en la base de datos
- **THEN** Rechaza la solicitud con código HTTP 409 Conflict o 400 Bad Request según RFC 7807

### Requirement: User Query Contract
El servicio MUST permitir la consulta y validación de usuarios por su identificador único.

#### Scenario: Query existing user by ID
- **WHEN** Recibe `GET /api/v1/users/{id}` para un usuario existente
- **THEN** Retorna código HTTP 200 OK con los datos del perfil (Id, FullName, Email)

#### Scenario: Query non-existing user
- **WHEN** Recibe `GET /api/v1/users/{id}` con un identificador inexistente
- **THEN** Retorna código HTTP 404 Not Found
