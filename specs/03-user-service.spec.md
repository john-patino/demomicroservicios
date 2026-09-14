# SPEC-002: User Service Specification
**Bounded Context:** Identity & Users  
**Data Storage:** PostgreSQL (`users_db`)  

## 1. Domain Entities
- **User:**
  - `Id`: UUID (PK)
  - `FullName`: Varchar(100), Not Null
  - `Email`: Varchar(150), Unique, Not Null
  - `PasswordHash`: Varchar(255), Not Null
  - `CreatedAtUtc`: Timestamp with time zone, UTC

## 2. Contract Endpoints
- `POST /api/v1/users/register`
  - Body: `{ "fullName": "string", "email": "valid_email", "password": "min_8_chars" }`
  - Response 201: `{ "id": "uuid", "fullName": "string", "email": "string" }`
  - Response 400: RFC 7807 Validation Errors
- `POST /api/v1/users/login`
  - Body: `{ "email": "string", "password": "string" }`
  - Response 200: `{ "token": "jwt_string", "userId": "uuid", "fullName": "string" }`
  - Response 401: Unauthorized
- `GET /api/v1/users/{id}`
  - Response 200: `{ "id": "uuid", "fullName": "string", "email": "string" }`
  - Response 404: Not Found
