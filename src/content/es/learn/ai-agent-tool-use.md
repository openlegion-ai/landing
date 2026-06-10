---
title: "Uso de herramientas por agentes IA — Llamadas de funciones, esquemas y ejecución segura"
description: "Cómo los agentes IA usan herramientas: definición de esquemas, llamadas de funciones entre proveedores, llamadas paralelas y encadenadas, análisis de salidas, recuperación de errores y alcance de permisos para producción segura."
slug: /learn/ai-agent-tool-use
primary_keyword: uso de herramientas agentes ia
last_updated: "2026-06-08"
schema_types:
  - FAQPage
related:
  - /learn/agentic-workflows
  - /learn/model-context-protocol
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-evaluation
  - /learn/ai-agent-frameworks
---

# Uso de herramientas por agentes IA: llamadas de funciones, esquemas y ejecución segura

El uso de herramientas por agentes IA es el mecanismo por el cual un LLM solicita la ejecución de funciones externas — búsqueda web, consultas de bases de datos, llamadas API, operaciones de archivos — emitiendo JSON estructurado de llamada de herramienta que un runtime intercepta, valida contra un esquema JSON y ejecuta antes de devolver un resultado. El LLM nunca ejecuta nada; solo solicita. El runtime aplica la validación del esquema, verificaciones ACL y presupuestos de pasos antes de cualquier ejecución. tau-bench (2025) muestra que los errores de construcción de argumentos son el principal modo de fallo en el uso de herramientas.

<!-- SCHEMA: DefinitionBlock -->
El uso de herramientas por agentes IA es el mecanismo por el cual un modelo de lenguaje grande solicita la ejecución de funciones externas — búsqueda web, consultas de bases de datos, llamadas API, operaciones de archivos o lógica de negocio personalizada — emitiendo una llamada de herramienta estructurada en su salida que un runtime intercepta, valida contra una definición de esquema JSON, ejecuta y devuelve como resultado de herramienta en el siguiente turno de contexto.

## Cómo funcionan las llamadas de herramientas: el ciclo solicitud-ejecución-retorno

### El ciclo de vida de una llamada de herramienta

Cada llamada de herramienta sigue el mismo ciclo de cinco pasos independientemente del framework o proveedor:

1. **Configuración del contexto** — el agente recibe la tarea y una lista de herramientas disponibles, cada una descrita por un nombre, una descripción en lenguaje natural y una definición de esquema JSON de sus parámetros.
2. **Decisión del LLM** — el modelo emite un bloque de llamada de herramienta en su salida: un nombre de función y un objeto JSON de argumentos que coincide con el esquema declarado.
3. **Interceptación del runtime** — el framework intercepta la llamada de herramienta antes de cualquier ejecución. Los argumentos se validan contra el esquema. Se verifica la ACL del agente: ¿está autorizado a llamar a esta herramienta?
4. **Ejecución** — si las validaciones y verificaciones de permisos pasan, el runtime ejecuta la función y recoge su salida.
5. **Inyección de contexto** — el resultado de la herramienta se inyecta de vuelta en el contexto de conversación como turno de resultado de herramienta. El LLM continúa razonando desde este contexto enriquecido.

El hecho arquitectónico crítico: el LLM nunca ejecuta nada. Solo solicita. Cada acción insegura — escribir un archivo, llamar a una API, enviar un correo — está controlada por el runtime.

### Diferencias de formato entre proveedores: OpenAI vs Anthropic vs Google

Los tres principales proveedores de LLM soportan el uso de herramientas de forma nativa, pero el formato JSON difiere:

**OpenAI** (openai/openai-python, 30.941 estrellas, Apache-2.0): las definiciones de herramientas van en el parámetro `tools` como array de objetos JSON Schema. El modelo devuelve llamadas de herramientas en el campo `tool_calls`. El cliente envía resultados de herramientas como mensajes con `role: "tool"`. La API Responses (marzo 2025) añadió herramientas integradas (`web_search`, `file_search`, `computer_use`) que se ejecutan del lado del servidor.

**Anthropic** (anthropic-sdk-python, 3.595 estrellas, MIT): las definiciones de herramientas van en el parámetro `tools` de nivel superior. El modelo devuelve bloques de contenido `tool_use` dentro del turno del asistente. El cliente debe analizar estos bloques y devolver bloques `tool_result` en el siguiente turno humano.

**Google Gemini**: las definiciones de herramientas usan `functionDeclarations` dentro del parámetro `tools`. El modelo devuelve partes `functionCall`; el cliente envía partes `functionResponse`. Gemini soporta `tool_config` con modo `ANY` y modo `AUTO`.

Los formatos son semánticamente equivalentes pero sintácticamente diferentes. Los frameworks que abstraen las diferencias de proveedor son más fáciles de mantener a través de cambios de modelos.

### Quién ejecuta realmente la herramienta (y por qué importa para la seguridad)

El LLM no puede ejecutar herramientas. Solo puede solicitarlas. Cuando un runtime aplica una puerta ACL antes de cada ejecución, ninguna salida del LLM puede eludir la verificación de permisos. El modelo puede solicitar `delete_all_records()` con cualquier argumento; si la matriz de permisos del agente no incluye esa herramienta, el runtime rechaza la solicitud antes de cualquier ejecución.

## Definir esquemas de herramientas que los LLMs usen correctamente

tau-bench (ServiceNow Research, 2025) midió GPT-4o al 44% pass@1 en tareas de uso de herramientas retail. La mayor categoría de fallo fue la construcción de argumentos: el modelo llamó a la función correcta con argumentos incorrectos. La calidad del esquema es el principal palanca de fiabilidad.

### Anatomía del esquema JSON para definiciones de herramientas

Un esquema de herramienta mínimo válido requiere cuatro campos:

```json
{
  "name": "search_web",
  "description": "Busca en la web pública información actual. Usar cuando la tarea requiere hechos posteriores a la fecha de corte de entrenamiento, datos en tiempo real, o fuentes no presentes en los datos de entrenamiento.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "La consulta de búsqueda. Usar términos específicos y dirigidos, no una oración completa."
      },
      "max_results": {
        "type": "integer",
        "description": "Número máximo de resultados a devolver. Por defecto 5, máximo 20.",
        "default": 5
      }
    },
    "required": ["query"]
  }
}
```

El array `required` importa: los parámetros no en `required` son opcionales. Los parámetros requeridos que se omiten frecuentemente indican un problema de descripción del esquema.

### Escribir descripciones que reduzcan errores de argumentos

Tres reglas para descripciones de herramientas que mejoran la precisión de construcción de argumentos:

1. **Nombrar con un par verbo-nombre**: `search_web`, `create_ticket`, `read_file`. Evita ambigüedad entre herramientas similares.
2. **Disambiguar en la descripción**: si dos herramientas son similares, indicar explícitamente cuándo usar cada una.
3. **Describir parámetros con ejemplos**: `"La consulta de búsqueda. Ejemplo: 'LangGraph v0.2 llamadas de herramientas paralelas'"` supera `"La cadena de consulta"` en precisión.

### Errores comunes de esquema y cómo corregirlos

| **Error** | **Efecto** | **Corrección** |
|---|---|---|
| `"type": "string"` sin restricciones para valores categóricos | El modelo inventa valores inválidos | Usar `"enum": ["option_a", "option_b"]` |
| `description` faltante en parámetros | El modelo adivina la semántica de los argumentos | Escribir descripciones explícitas con ejemplos |
| Todos los parámetros en `required` | El modelo se niega a llamar cuando los campos opcionales son desconocidos | Listar solo los parámetros realmente requeridos |
| Nombre de herramienta vago (`process`, `handle`) | El modelo no puede distinguir herramientas similares | Usar verbo-nombre: `submit_form`, `parse_date` |
| Sin array `required` | JSON Schema inválido | Siempre incluir `required`, incluso si está vacío (`[]`) |

### Modo estricto: aplicar adhesión exacta al esquema

El modo estricto de salidas estructuradas de OpenAI (`"strict": true`) garantiza que el JSON de salida del modelo coincida exactamente con el esquema declarado, eliminando toda la categoría de errores de construcción de argumentos.

## Llamadas de herramientas paralelas y secuenciales

### Cuándo usar llamadas de herramientas paralelas

La API Responses de OpenAI (marzo 2025) hizo las llamadas de herramientas paralelas el comportamiento predeterminado. En un solo turno de LLM, el modelo puede solicitar múltiples ejecuciones de herramientas simultáneamente. Para herramientas independientes, el despacho paralelo reduce las idas y vueltas de N turnos secuenciales a un lote concurrente.

Ejemplo: un agente de investigación necesita el precio actual de las acciones, noticias recientes y un documento SEC de una empresa. Los tres son independientes. Secuencial: 3 turnos de LLM x 10s = 30s. Paralelo: 1 turno de LLM + max(latencias de herramientas) aprox. 10s.

La condición previa: las herramientas deben ser genuinamente independientes. Si la herramienta B necesita la salida de la herramienta A como argumento, deben ser secuenciales.

### Llamadas de herramientas secuenciales para operaciones dependientes

El encadenamiento de herramientas requiere ejecución secuencial. El patrón: `search_web(consulta)` → `fetch_page(URL del resultado de búsqueda)` → `extract_data(contenido de la página)` → `summarize(datos extraídos)`.

### Riesgos de concurrencia con recursos con estado

Las llamadas de herramientas paralelas contra recursos con estado necesitan garantías de ordenamiento. La regla: el despacho paralelo es seguro cuando las herramientas son de solo lectura o escriben en recursos independientes.

## Análisis de salidas de herramientas y recuperación de errores

Las llamadas de herramientas fallan. La API externa devuelve 503. La consulta de base de datos expira. Una implementación bien diseñada maneja los fallos sin intervención humana para errores recuperables.

### Validar salidas de herramientas

Una herramienta que devuelve HTTP 200 no es lo mismo que una herramienta que devuelve un resultado correcto y útil. Validar la salida contra un esquema esperado antes de inyectarla en el contexto del agente.

### Estrategias de reintento: cuándo y cómo reinvocar

Tres patrones de reintento para diferentes modos de fallo:

- **Reintento por fallo transitorio** (timeout de red, límite de tasa): reinvocar la misma herramienta con los mismos argumentos después de un breve backoff.
- **Reintento con aclaración de argumento**: devolver un error estructurado al LLM explicando por qué el argumento fue rechazado.
- **Herramienta de respaldo**: si la herramienta A falla después de N reintentos, enrutar a la herramienta B con capacidad equivalente.

### Reportar fallos de herramientas al orquestador

Los errores irrecuperables deben reportarse al orquestador. Para pipelines multi-agente, el orquestador necesita una señal de fallo estructurada. Para los [patrones de orquestación de agentes IA](/learn/ai-agent-orchestration), este es el camino de escalación.

## Alcance de permisos de herramientas y seguridad

### Asignación de herramientas con mínimo privilegio

Cada agente debería tener solo las herramientas que su tarea específica requiere. El radio de explosión de un agente con inyección de prompt exitosa está acotado por su conjunto de herramientas permitidas. OWASP LLM Top 10 v1.1 (2025) lista la inyección de prompt (LLM01) como el principal riesgo para aplicaciones LLM.

### Validación de entradas antes de la ejecución

Validar los argumentos de llamadas de herramientas en dos niveles: validación de esquema y validación semántica. Una herramienta `fetch_page` debería rechazar argumentos con URLs `file://` o `localhost` para prevenir SSRF.

Ver el [modelo de amenaza de seguridad de agentes IA](/learn/ai-agent-security) para la taxonomía completa de vectores de ataque a nivel de herramientas.

### Acciones irreversibles: puertas human-in-the-loop

Las llamadas de herramientas con efectos secundarios irreversibles — enviar correos, eliminar registros, transferir fondos, publicar contenido — requieren puertas de confirmación humana explícitas o verificaciones de idempotencia antes de la ejecución.

## La perspectiva de OpenLegion: el registro de herramientas y la puerta ACL

Cada proveedor principal de LLM tiene una API de llamada de herramientas diferente. La abstracción correcta: definir una herramienta una vez y dejar que el framework la traduzca a la convención correcta del proveedor en el momento de la llamada.

El registro de herramientas de OpenLegion implementa esta abstracción. Definir `search_web` una vez. El mesh traduce la definición a OpenAI `tools`, Anthropic `tools` o Gemini `functionDeclarations` según el modelo configurado. La puerta ACL no es opcional. Cada llamada de herramienta — integrada, MCP o personalizada — pasa por la matriz de permisos por agente antes de la ejecución.

| **Dimensión** | **OpenLegion** | **LangChain / LangGraph** | **OpenAI Agents SDK** | **CrewAI** | **Anthropic directo** |
|---|---|---|---|---|---|
| **Formato de definición de herramienta** | Esquema único traducido por proveedor | Wrappers específicos de proveedor requeridos | Solo formato OpenAI | Decorador de herramienta CrewAI | Solo formato Anthropic tool_use |
| **Abstracción de proveedor** | Sí — GPT-4o, Claude, Gemini unificados | Parcial — vía integraciones LangChain | No — solo modelos OpenAI | Parcial | No — solo Anthropic |
| **Aplicación ACL** | Matriz de permisos por agente, estructural | No integrada | No integrada | No integrada | No integrada |
| **Llamadas de herramientas paralelas** | Soportado | Soportado (dependiente del proveedor) | Sí — predeterminado en Responses API | Soportado | Sí — Claude soporta |
| **Herramientas integradas** | Navegador, archivo, HTTP, shell, gen. imágenes | Vía herramientas de la comunidad LangChain | web_search, file_search, computer_use | No integrado | No integrado |
| **Integración MCP** | Nativa — mismo pipeline ACL/presupuesto | Vía adaptadores LangChain MCP | Experimental | No nativa | No nativa |

Para la especificación MCP, arquitectura de servidores y requisitos de permisos por servidor, ver la [guía del protocolo Model Context](/learn/model-context-protocol).

## Herramientas integradas vs herramientas MCP vs herramientas personalizadas

### Herramientas integradas del runtime

Las herramientas integradas vienen reforzadas por el runtime: automatización del navegador, operaciones de archivos, solicitudes HTTP, comandos de shell, generación de imágenes. Usar primero las herramientas integradas.

### Servidores de herramientas MCP

Las herramientas MCP son servidas por servidores Model Context Protocol que exponen herramientas vía JSON-RPC sobre stdio o HTTP. Las herramientas MCP requieren sandboxing explícito y alcance de permisos por servidor.

### Registro de herramientas personalizadas

Las herramientas personalizadas son funciones Python o TypeScript que se escriben y registran en el registro de herramientas del agente. Ofrecen flexibilidad total; la contrapartida es que se es responsable de la validación, el manejo de errores, la idempotencia y los controles de seguridad.

<!-- SCHEMA: FAQPage -->
## Preguntas frecuentes

### ¿Qué es el uso de herramientas por agentes IA?

El uso de herramientas por agentes IA es el mecanismo por el cual un modelo de lenguaje grande solicita la ejecución de funciones externas — búsqueda web, llamadas API, consultas de bases de datos, operaciones de archivos — emitiendo JSON estructurado de llamada de herramienta que un runtime intercepta, valida e invoca. El LLM nunca ejecuta directamente; solo describe qué quiere llamar y con qué argumentos.

### ¿Cómo funcionan las llamadas de funciones en los agentes IA?

Las llamadas de funciones funcionan en un ciclo solicitud-ejecución-retorno: el agente recibe una tarea y una lista de herramientas disponibles; el LLM emite una llamada de herramienta nombrando la función y proporcionando argumentos; el runtime valida esos argumentos, ejecuta la función e inyecta el resultado como resultado de herramienta en el contexto.

### ¿Qué hace un buen esquema de herramienta para agentes IA?

Un buen esquema de herramienta usa un nombre verbo-nombre (`search_web`, `create_ticket`), una descripción que indique sin ambigüedad cuándo usarla, parámetros con tipos fuertes con enumeraciones y un array `required`. tau-bench (2025) muestra que la construcción incorrecta de argumentos es el modo de fallo más común.

### ¿Qué son las llamadas de herramientas paralelas y cuándo usarlas?

Las llamadas de herramientas paralelas permiten a un agente solicitar múltiples ejecuciones de herramientas en un solo turno de LLM, despachadas de forma concurrente. Usar llamadas paralelas cuando las herramientas son independientes — sus salidas no dependen unas de otras y no escriben en recursos compartidos con estado.

### ¿Cómo prevengo los bucles de llamadas de herramientas en agentes IA?

Los bucles de llamadas de herramientas ocurren cuando un agente sigue invocando herramientas sin converger en una respuesta final. La única prevención fiable es un presupuesto de pasos aplicado a nivel de infraestructura: un máximo estricto de llamadas de herramientas por ejecución de agente, aplicado por el orquestador.

### ¿Cuál es el riesgo de seguridad del uso de herramientas por agentes IA?

El riesgo principal es la inyección de resultado de herramienta: cuando un agente llama a una herramienta que devuelve contenido controlado por un atacante que puede redirigir el comportamiento del agente. OWASP LLM Top 10 v1.1 (2025) lista la inyección de prompt como el principal riesgo. Las mitigaciones incluyen la sanitización de salidas, la asignación de herramientas con mínimo privilegio y las puertas human-in-the-loop para acciones irreversibles.

### ¿Cuál es la diferencia entre herramientas integradas, herramientas MCP y herramientas personalizadas?

Las herramientas integradas son proporcionadas por el runtime del agente con aplicación ACL ya implementada. Las herramientas MCP son servidas por servidores Model Context Protocol que exponen capacidades externas vía JSON-RPC; requieren sandboxing y alcance de permisos por servidor. Las herramientas personalizadas son funciones que se escriben y registran, con flexibilidad total pero responsabilidad propia de validación y seguridad.

### ¿Cómo implementan el uso de herramientas los diferentes proveedores de LLM?

OpenAI implementa el uso de herramientas vía el parámetro `tools`, `tool_calls` en la respuesta del asistente, mensajes de resultado `role: "tool"`. Anthropic usa bloques de contenido `tool_use` con bloques `tool_result` en el siguiente turno humano. Google Gemini usa `functionDeclarations` con partes `functionCall` en respuestas y partes `functionResponse` en turnos siguientes. Los tres formatos son semánticamente equivalentes pero sintácticamente diferentes.

## Definir tus herramientas una vez, ejecutarlas de forma segura en todas partes

tau-bench (2025) sitúa a GPT-4o en 44% pass@1 en tareas de uso de herramientas, con la construcción de argumentos como categoría de fallo dominante. Esquemas precisos con nombres verbo-nombre, enumeraciones con tipos y ejemplos de parámetros cierran la mayor parte de esa brecha.

Para los [patrones de flujo de trabajo agéntico](/learn/agentic-workflows) que cubren presupuestos de pasos y prevención de bucles, y para los [benchmarks de evaluación de agentes IA](/learn/ai-agent-evaluation) que miden la fiabilidad del uso de herramientas, esas guías extienden los fundamentos cubiertos en esta página.

[Construir agentes que usan herramientas con aplicación ACL por agente en OpenLegion →](https://openlegion.ai)
