# Capability: react-frontend

## Purpose
Proveer la interfaz gráfica web (Sakai React / PrimeReact con Next.js) para la interacción del usuario final con el catálogo, carrito de compras, checkout de órdenes y visualización en tiempo real de la telemetría distribuida.

## Requirements

### Requirement: Centralized Gateway Communication
La aplicación cliente MUST consumir exclusivamente los endpoints expuestos a través del API Gateway (`http://localhost:5000/gateway/...`) sin invocar directamente los microservicios internos.

#### Scenario: Consume products through gateway
- **WHEN** El usuario accede a la vista de catálogo
- **THEN** El frontend realiza una petición HTTP `GET /gateway/products` contra el API Gateway

### Requirement: Correlation ID Telemetry Tracking
El cliente HTTP frontend MUST generar o propagar el header `X-Correlation-ID` en cada solicitud y capturar el identificador retornado por el Gateway.

#### Scenario: Request interception and header injection
- **WHEN** El cliente envía cualquier solicitud HTTP al Gateway
- **THEN** El interceptor inyecta un `X-Correlation-ID` (UUIDv4) y lo almacena en el estado de telemetría de la aplicación

### Requirement: Telemetry Bar Visualization
La interfaz de usuario MUST renderizar de forma visible un componente de telemetría (`TelemetryBar`) en el pie de página con el último ID de correlación procesado.

#### Scenario: Copy and inspect correlation ID in Seq
- **WHEN** Una petición HTTP finaliza (éxito o error)
- **THEN** La barra de telemetría actualiza el `X-Correlation-ID`, permite copiarlo al portapapeles y provee un enlace directo al filtro de eventos en Seq (`http://localhost:5341`)

### Requirement: Global State Architecture via React Context API
La aplicación MUST gestionar el estado transversal del cliente utilizando React Context API nativo sin dependencias externas pesadas de manejo de estado.

#### Scenario: Provisioning core application contexts
- **WHEN** La aplicación se inicializa en el navegador
- **THEN** Envuelve el layout con `CartContext` (items y total), `TelemetryContext` (trazabilidad y Seq link) y `DemoUserContext` (usuario activo)

### Requirement: Topbar Demo User Selector
La barra superior de navegación MUST renderizar en su extremo superior derecho un selector desplegable de usuario demo para asociar el usuario activo a los pedidos.

#### Scenario: User selection in topbar
- **WHEN** El usuario selecciona un perfil en el dropdown del `AppTopbar`
- **THEN** El contexto `DemoUserContext` se actualiza y todas las solicitudes de checkout envían el `userId` seleccionado
