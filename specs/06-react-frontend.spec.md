# SPEC-006: React Client Application Specification
**Stack:** React 18, Next.js (App Router), PrimeReact / PrimeFlex, Axios, React Context API  

## 1. Core Features
- **Catálogo:** Carga productos desde el API Gateway (`GET /gateway/products`) y muestra tarjetas con disponibilidad y precio.
- **Carrito Local:** Gestión de items, sumatoria de totales y modal de compra.
- **Checkout:** Envío de orden a `POST /gateway/orders`.
- **Selector de Usuario Demo:** Selección rápida de usuario de prueba mediante `Dropdown` en la esquina superior derecha de `AppTopbar` para asociar la orden.
- **Barra de Telemetría (TelemetryBar):** Muestra en el pie de página (`AppFooter`) el último `X-Correlation-ID` procesado por el cliente, permitiendo copiarlo o abrir directamente la consola de Seq (`http://localhost:5341/#/events?filter=CorrelationId%20%3D%3D%20"..."`).

## 2. State Management Architecture
- **React Context API Nativo:**
  - `CartContext`: Manejo de items agregados, cantidades, subtotal y vaciado.
  - `TelemetryContext`: Captura y persistencia en memoria del último `X-Correlation-ID` devuelto en las respuestas HTTP.
  - `DemoUserContext`: Mantiene el usuario activo seleccionado para pruebas y la lista de perfiles disponibles.
