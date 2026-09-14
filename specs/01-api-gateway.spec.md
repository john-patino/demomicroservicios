# SPEC-005: API Gateway Specification
**Engine:** YARP (Yet Another Reverse Proxy) en ASP.NET Core  
**Port:** 5000  

## 1. Routing Rules
- `/gateway/users/{**catch-all}`    --> `http://user-service:8080/api/v1/users/{**catch-all}`
- `/gateway/products/{**catch-all}` --> `http://product-service:8080/api/v1/products/{**catch-all}`
- `/gateway/orders/{**catch-all}`   --> `http://order-service:8080/api/v1/orders/{**catch-all}`

## 2. Cross-Cutting Concerns
- Manejo de CORS para `http://localhost:5173` y `http://localhost:3000` con Headers expuestos (`X-Correlation-ID`).
- Middleware de correlación para garantizar inyección de cabecera antes del reenvío por proxy.
- Integración con Serilog enviando eventos estructurados a Seq (`http://seq:5341`).
