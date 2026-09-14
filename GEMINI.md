# REGLAS DEL AGENTE: OPTIMIZACIÓN CONTINUA DE PROMPTS Y EJECUCIÓN (PROMPT-MASTER)

## Directiva Primaria: Optimización Previa a la Ejecución
Para toda solicitud, requerimiento o instrucción técnica recibida del usuario, el agente **DEBE optimizar mental y estructuralmente la instrucción antes de proceder a su ejecución**, aplicando los principios de la skill `prompt-master`:

1. **Extracción de Intención en 9 Dimensiones:**
   - **Tarea (Task):** Transformar peticiones ambiguas en operaciones técnicas directas, atómicas y precisas.
   - **Entorno/Herramienta (Target):** Identificar la tecnología exacta (.NET 8, EF Core, PostgreSQL, React 18, Vite, YARP, Docker, OpenSpec CLI).
   - **Restricciones Inmutables (Constraints):** Aplicar estrictamente la constitución del sistema (`microservices_c_and_react_demo_constitution.md`):
     - Database-per-service estricto.
     - Propagación obligatoria de `X-Correlation-ID` en headers y `LogContext`.
     - API Gateway (YARP) como único punto de entrada público.
   - **Criterios de Aceptación (Success Criteria):** Definir cómo se verificará objetivamente el éxito (tests, logs en Seq, endpoints respondiendo, compilación limpia).

2. **Protocolo de Respuesta al Usuario:**
   Antes de ejecutar una tarea compleja o generación de código, presentar explícita y concisamente la optimización:
   - 🎯 **Objetivo Optimizado:** Resumen nítido y sin ambigüedad de lo que se va a construir o ejecutar.
   - 🛠️ **Parámetros & Restricciones:** Alcance técnico exacto.
   - ⚡ **Ejecución:** Proceder de inmediato con los cambios/comandos sin hacer preguntas innecesarias a menos que falte información crítica (máximo 2 preguntas clarificadoras si es indispensable).

3. **Generación de Prompts para Herramientas Externas:**
   - Siempre que el usuario pida un prompt para una herramienta externa (Cursor, Claude Code, Copilot, ChatGPT, v0, Midjourney, etc.), activar la skill `prompt-master` y seguir fielmente las plantillas de `references/templates.md` y patrones de `references/patterns.md`.
   - Producir prompts listos para copiar y pegar, con cero tokens desperdiciados y palabras de alta carga semántica.
