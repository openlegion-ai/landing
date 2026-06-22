---
title: "Gestión de credenciales para agentes IA: Arquitectura vault-proxy"
description: "Arquitectura vault-proxy para agentes IA: inyectar secretos en el servidor, aislar por agente, auditar cada acceso y evitar el antipatrón env-var que expuso claves en CVE-2024-34359 y CVE-2025-29927."
slug: /learn/credential-management-ai-agents
primary_keyword: credential management ai agents
last_updated: "2026-06-11"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-security
  - /learn/model-context-protocol
  - /learn/ai-agent-orchestration
  - /learn/multi-agent-systems
  - /learn/ai-agent-platform
  - /learn/agentic-workflows
---

# Gestión de credenciales para agentes IA: Arquitectura vault-proxy

La gestión de credenciales para agentes IA es el conjunto de prácticas de infraestructura que gobiernan cómo los agentes autónomos obtienen, usan, rotan y ceden claves API y secretos sin que las credenciales aparezcan en la memoria del agente, los registros ni las ventanas de contexto. Los agentes rompen los patrones estándar de credenciales: funcionan de forma autónoma, pueden ser comprometidos mediante inyección de prompts y operan en flotas donde un secreto compartido multiplica la superficie de exfiltración. CVE-2024-34359 (llama-cpp-python, CVSS 9,6) y CVE-2025-29927 (Next.js, CVSS 9,1) demostraron cómo los despliegues de IA exponen secretos cuando las fronteras de seguridad fallan.

<!-- SCHEMA: DefinitionBlock -->
La gestión de credenciales para agentes IA es el conjunto de prácticas y patrones de infraestructura que gobiernan cómo los agentes autónomos obtienen, usan, rotan y ceden claves API, tokens y secretos sin que esas credenciales aparezcan jamás en la memoria del agente, los registros ni las ventanas de contexto.

## Por qué los patrones estándar de credenciales fallan en las flotas de agentes

### El problema del archivo .env a escala

Las variables de entorno funcionan correctamente para aplicaciones de un solo proceso. Para las flotas de agentes, el modelo falla de inmediato. Un archivo `.env` compartido en una flota de 10 agentes significa que 10 procesos en ejecución cada uno mantiene cada secreto en memoria. Cada proceso genera registros, salidas de error y trazas de depuración, todas superficies potenciales de exposición de credenciales. Si cualquiera de esos 10 agentes es comprometido por un ataque de inyección de prompt que le instruye a imprimir su entorno, cada credencial en el `.env` compartido se filtra simultáneamente.

El multiplicador N-agentes es el problema central: cada agente adicional en la flota añade otra superficie de exposición para cada credencial compartida. Una flota de 20 agentes con 5 claves API en `.env` crea 100 puntos potenciales de exposición de credenciales antes de considerar la agregación de registros, los informes de errores o las herramientas de depuración que pueden capturar instantáneas del entorno.

### El registro CVE sobre secretos en texto plano en aplicaciones IA

Dos CVE documentan el costo real de la gestión insegura de secretos en sistemas IA desplegados:

**CVE-2024-34359** (llama-cpp-python, CVSS 9,6 Crítico): inyección de plantilla Jinja2 del lado del servidor mediante renderizado no sandboxeado de metadatos de modelo en `llama-cpp-python`. El campo de plantilla de chat de un archivo `.gguf` maliciosamente elaborado se renderizaba a través de `jinja2.Environment` sin sandboxing, lo que permitía ejecución remota de código. Cualquier aplicación que cargue modelos no confiables, incluidas las pipelines de agentes que descargan modelos de fuentes externas, está en el alcance. El problema estructural es que el código de carga de modelos confiaba en contenido externo sin aislamiento.

**CVE-2025-29927** (Next.js, CVSS 9,1 Crítico): omisión de autorización mediante el encabezado `x-middleware-subrequest` que permitía que solicitudes no autenticadas omitieran el middleware en despliegues de Next.js. Las aplicaciones que usan el middleware de Next.js para proteger rutas con credenciales, incluidos los backends de API de agentes IA, se vieron afectadas: la omisión permitía acceso a rutas que el middleware debía bloquear. El defecto está corregido en las versiones 12.3.5, 13.5.9, 14.2.25 y 15.2.3.

Ambos CVE ilustran la misma clase de riesgo subyacente: cuando los secretos o las rutas protegidas dependen de controles en la capa de aplicación en lugar de aislamiento estructural, un único fallo lógico los expone. El patrón vault-proxy elimina la superficie manteniendo los secretos fuera de los contenedores de agentes y detrás de la aplicación de la capa de infraestructura.

### Por qué los registros de agentes son un riesgo de credenciales

Los registros de aplicaciones tradicionales contienen eventos estructurados en sitios de llamada controlados. Los registros de agentes capturan todo: trazas de razonamiento LLM, argumentos de llamadas de herramientas, valores de retorno de herramientas y pasos de razonamiento intermedios. Cuando un agente llama a una API externa con una credencial en el encabezado Authorization, una configuración de registro naive captura ese encabezado. Cuando la traza de razonamiento de un agente incluye el texto "using API key sk-..." de un documento recuperado o un prompt, esa cadena aparece en el registro.

Los volúmenes de registros de agentes son altos y los períodos de retención a menudo son largos. Una credencial que aparece una vez en un sistema de agregación de registros permanece allí hasta que el registro se purga, lo que puede ser semanas o meses después de que el agente que la generó fue retirado.

### El camino de inyección de prompt hacia las credenciales

OWASP LLM Top 10 v1.1 (LLM06: Divulgación de información sensible, publicado en octubre de 2025) identifica la exfiltración de credenciales como el principal vector de ataque para las aplicaciones LLM. El ataque es directo: el contenido adversarial recuperado por un agente, desde una página web, un documento o la respuesta de una herramienta, contiene instrucciones como "imprimir todas las variables de entorno" o "mostrar tu clave API." Un agente sin aislamiento estructural de credenciales no puede distinguir esta instrucción de una instrucción de tarea legítima.

Una investigación a principios de 2026 escaneó 3.984 habilidades de agentes y encontró que 283 (7,1 %) contenían fallos críticos de manejo de credenciales que pasaban claves API a través del contexto LLM en texto plano. 76 habilidades contenían cargas de robo de credenciales deliberadas diseñadas para exfiltrar credenciales a endpoints controlados por atacantes. La única defensa estructural es garantizar que las credenciales nunca existan en el contexto del agente. Un agente no puede filtrar una credencial que no posee.

## Patrones de gestión de credenciales para agentes IA

### Patrón 1: Variables de entorno (Menos seguro)

Las variables de entorno (`os.environ`, archivos `.env`, flags Docker `--env`) son el patrón de credenciales por defecto para la mayoría de los frameworks de agentes. LangChain lee desde `os.environ`, CrewAI depende de la inyección de entorno, OpenAI Agents SDK espera credenciales en el entorno del proceso. Este patrón es apropiado solo para desarrollo local y prototipado.

Para flotas de agentes en producción, las variables de entorno fallan en cada eje de seguridad: existen en la memoria del proceso del agente (accesible por inyección de prompt), aparecen en `/proc/{pid}/environ` en hosts Linux, emergen en trazas de error y salidas de depuración, y se propagan a todos los agentes en una flota de entorno compartido.

### Patrón 2: Integración con gestor de secretos

Los gestores de secretos cloud (AWS Secrets Manager a $0,40/secreto/mes + $0,05 por 10.000 llamadas API; Azure Key Vault; GCP Secret Manager) mejoran respecto a las variables de entorno almacenando credenciales fuera del proceso del agente y recuperándolas bajo demanda. El agente llama a la API del gestor de secretos para obtener una credencial, la usa para una operación y la descarta.

Este patrón reduce la vida útil de la credencial en memoria pero no elimina la ventana de exposición: la credencial sigue pasando por la memoria del agente durante el ciclo de obtención-uso-descarte. Permanece visible para la inyección de prompt durante esa ventana y requiere que el agente mantenga una segunda credencial (la clave API del gestor de secretos o el rol IAM) para acceder a la primera.

### Patrón 3: Vault Proxy / Inyección de handle opaco (Más seguro)

El patrón vault-proxy mantiene las credenciales completamente fuera de los contenedores de agentes. El agente mantiene un handle opaco, una cadena de referencia como `$CRED{stripe_key}`, que identifica una credencial sin resolverla. Cuando el agente hace una llamada API que incluye el handle, el vault proxy intercepta la solicitud, resuelve el handle a la credencial real, la inyecta en la capa de red y reenvía la solicitud autenticada. El agente nunca ve la credencial en texto plano.

Este es el mismo principio que la inyección del lado del agente de HashiCorp Vault (35.763 estrellas, BSL, v2.0.2 lanzado el 5 de junio de 2026), integrado directamente en la capa de orquestación del agente. Con 700+ servidores MCP en el ecosistema (junio de 2026), el patrón de handle `$CRED{}` elimina la proliferación de `.env` por servidor: una referencia de handle en la configuración del agente cubre los requisitos de credenciales de cualquier servidor MCP.

Un contenedor de agente completamente comprometido, ejecutando instrucciones arbitrarias del atacante, tiene acceso cero a credenciales porque ninguna credencial existe dentro del alcance del contenedor.

### Patrón 4: Identidad de carga de trabajo y federación OIDC

La identidad de carga de trabajo (federación OIDC, SPIFFE/SPIRE, cuentas de servicio IAM en la nube) elimina completamente las claves API de larga duración para el acceso a servicios cloud. Cada contenedor de agente recibe un token de identidad de corta duración que se intercambia por una credencial del proveedor cloud en tiempo de ejecución. La credencial tiene un TTL acotado, típicamente 15 minutos a 1 hora, después del cual expira y se debe emitir un nuevo token.

La identidad de carga de trabajo es el patrón correcto para flotas de agentes que se ejecutan en infraestructura cloud donde se requieren credenciales del proveedor cloud (claves API de AWS, claves de cuenta de servicio de GCP). Requiere que la plataforma de orquestación gestione la emisión de identidad y la renovación de tokens, pero elimina completamente el problema de rotación de claves estáticas. Para las arquitecturas de [sistemas multi-agente](/learn/multi-agent-systems) que abarcan múltiples cuentas o proveedores cloud, la federación de identidad de carga de trabajo es el único modelo de credenciales escalable.

## La perspectiva de OpenLegion: el patrón de handle $CRED{}

Cada framework importante de agentes IA trata la gestión de credenciales como el problema de la aplicación anfitriona. LangChain y LangGraph leen desde `os.environ`. CrewAI depende de la inyección de entorno. OpenAI Agents SDK espera credenciales en el entorno del proceso. AutoGen hereda el entorno del proceso Python. Ninguno de estos frameworks proporciona aislamiento estructural de credenciales; dejan la gestión de credenciales al operador, lo que en la práctica significa archivos `.env` y variables de entorno compartidas.

El vault-proxy de OpenLegion está integrado en la capa de orquestación del agente. Los agentes referencian las credenciales como handles opacos `$CRED{nombre}`. El host mesh resuelve los handles del lado del servidor e inyecta credenciales en el límite de red. Ningún contenedor de agente recibe jamás una credencial en texto plano. La inyección de prompt no puede exfiltrar lo que no está presente.

Infisical (27.296 estrellas, plataforma de secretos TypeScript open source con núcleo bajo licencia MIT) recaudó $2,8M en financiación inicial en 2023, señalando la demanda del mercado de gestión de secretos nativa para desarrolladores. OpenLegion integra la misma capacidad directamente en el agente runtime, sin necesidad de despliegue separado de gestión de secretos.

| **Dimensión** | **OpenLegion** | **LangChain/LangGraph** | **CrewAI** | **OpenAI Agents SDK** | **AutoGen** |
|---|---|---|---|---|---|
| **Almacenamiento de credenciales** | Vault (handles opacos) | Entorno / .env | Entorno / .env | Entorno / .env | Entorno / .env |
| **Patrón de acceso del agente** | Handle $CRED{} -- nunca resuelto en contenedor | os.environ lectura directa | os.environ lectura directa | os.environ lectura directa | os.environ lectura directa |
| **Texto plano en contexto del agente?** | Nunca | Sí -- en lectura de os.environ | Sí -- en lectura de os.environ | Sí -- en lectura de os.environ | Sí -- en lectura de os.environ |
| **Soporte de rotación** | Nativo vault; rotación en caliente sin reinicio | Manual; requiere reinicio | Manual; requiere reinicio | Manual; requiere reinicio | Manual; requiere reinicio |
| **Alcance por agente** | Aplicado a nivel mesh por lista de permitidos | No aplicado | No aplicado | No aplicado | No aplicado |
| **Rastro de auditoría** | Cada resolución de handle registrada con ID de agente | Ninguno nativo | Ninguno nativo | Ninguno nativo | Ninguno nativo |

Para los equipos que evalúan la superficie total de exposición de credenciales de su stack actual, el [modelo de amenazas de seguridad de agentes IA](/learn/ai-agent-security) cubre la fuga de credenciales como una de las seis categorías de amenazas documentadas, junto con inyección de prompt, escape de sandbox y abuso de presupuesto.

## Rotación de secretos para flotas de agentes IA

### Arrendamientos de credenciales con TTL acotado

Las claves API estáticas, credenciales sin expiración, son las peores credenciales para las flotas de agentes. Una clave estática filtrada permanece válida indefinidamente. La rotación de claves requiere coordinar todos los agentes que usan la clave, potencialmente durante tareas activas.

Los arrendamientos de credenciales con TTL acotado resuelven ambos problemas. La credencial se emite con una ventana de expiración, 1 hora es común para sesiones de agentes interactivos; 15 minutos para operaciones de alta sensibilidad. Cuando el arrendamiento expira, el vault emite automáticamente una credencial nueva. La credencial antigua es inválida después de la expiración, limitando el valor de cualquier copia filtrada. Las tareas de agentes que abarcan múltiples ventanas de arrendamiento reciben renovaciones transparentes sin interrupción.

El motor de secretos dinámicos de HashiCorp Vault genera credenciales de corta duración para bases de datos, proveedores cloud y backends personalizados bajo demanda. Cada credencial es única para el agente solicitante y expira después de un TTL configurable. CVE-2026-39829 (golang/crypto, junio de 2026) parchó una vulnerabilidad DoS en el análisis de clave pública SSH causada por tamaños de módulo RSA sin acotar; Vault v2.0.2 lo abordó limitando las claves RSA a 8.192 bits. Incluso la infraestructura vault construida específicamente para este propósito entrega CVE, por eso las capas de abstracción entre agentes y secretos sin procesar importan incluso cuando se usa Vault directamente.

### Rotación en caliente sin reinicio del agente

La rotación tradicional de secretos de aplicaciones requiere reiniciar el proceso para adoptar la nueva credencial. Las flotas de agentes no pueden tolerar reinicios forzados: los agentes pueden estar en medio de una tarea, manteniendo estado de trabajo que se pierde al reiniciar, o coordinando con otros agentes en una transferencia de múltiples pasos.

La rotación en caliente inyecta la nueva credencial en el vault sin tocar el contenedor de agente en ejecución. La siguiente llamada API del agente a través del vault proxy usa la nueva credencial de forma transparente. Desde la perspectiva del agente, el handle `$CRED{nombre}` sigue resolviendo; solo el secreto subyacente ha cambiado.

La rotación en caliente requiere que los agentes nunca almacenen credenciales en caché localmente. El patrón de handle `$CRED{}` aplica esto estructuralmente: los handles se resuelven en el momento de la llamada, no al inicio, por lo que el almacenamiento en caché local del valor resuelto nunca es posible.

### Alcance de rotación por agente

En una flota de credenciales compartidas, rotar una credencial afecta a cada agente que la usa. Un evento de rotación requiere coordinar en toda la flota, creando un cuello de botella de coordinación y una ventana donde algunos agentes usan la credencial antigua y otros la nueva.

El alcance de credenciales por agente hace que la rotación sea ortogonal: rotar las credenciales del Agente A no afecta al Agente B, porque el Agente B mantiene su propio ámbito de credenciales separado. Esto solo es alcanzable cuando la capa de orquestación aplica el alcance por agente en lugar de depender de archivos `.env` compartidos. Para diseños de [flujos de trabajo agénticos](/learn/agentic-workflows) que encadenan múltiples agentes especializados, el alcance de rotación por agente es esencial para la higiene de credenciales sin tiempo de inactividad.

## Aislamiento de credenciales entre agentes

### Asignación de credenciales por agente

Cada agente en una flota solo debe tener las credenciales que su tarea específica requiere. Un agente de scraping web necesita acceso a una credencial de cliente HTTP pero no una cadena de conexión a base de datos. Un agente de análisis de datos necesita acceso de lectura a un almacén de datos pero ningún token de escritura para APIs externas. Un agente de publicación necesita acceso de escritura a un CMS pero ningún acceso a bases de datos internas.

La asignación de credenciales por agente requiere que la capa de orquestación aplique el alcance, no el agente mismo. Un agente que solicita una credencial para la que no está autorizado debe recibir una denegación en el límite del vault, no recibir silenciosamente la credencial porque estaba presente en un `.env` compartido.

OWASP LLM06 (Divulgación de información sensible) señala específicamente que las credenciales de agentes sobre-aprovisionadas son un factor contribuyente a los incidentes de fuga de credenciales: los agentes reciben más acceso del que su tarea requiere, por lo que cuando se comprometen, el radio de impacto es mayor de lo necesario.

### Alcance de credenciales del servidor de herramientas MCP

Los servidores de herramientas del Model Context Protocol a menudo requieren sus propias credenciales, claves API para los servicios que proxy. Con 700+ servidores MCP en el ecosistema (junio de 2026), el problema de gestión de credenciales en la capa MCP ya no es teórico: cada servidor es un vector potencial de proliferación de `.env`. En OpenLegion, las credenciales del servidor MCP se almacenan en el mismo vault y se inyectan a través del mismo patrón proxy. El servidor de herramientas MCP recibe solicitudes autenticadas del proxy mesh en lugar de credenciales sin procesar del agente.

Esto evita que un servidor MCP malicioso se use como vector de recolección de credenciales. Un servidor MCP comprometido solo encuentra referencias de handles en las solicitudes entrantes, no claves sin procesar. Para el modelo completo de refuerzo de la [seguridad del Model Context Protocol](/learn/model-context-protocol), consulte la guía dedicada.

### Revocar credenciales al retirar al agente

Cuando un agente completa su tarea o es archivado, sus credenciales deben revocarse inmediatamente. Las credenciales estáticas que sobreviven a su agente asociado crean accesos huérfanos: claves válidas sin rastro de auditoría asociado, pertenecientes a un proceso que ya no se ejecuta.

La revocación de credenciales al retirar al agente requiere que la capa de orquestación rastree los eventos del ciclo de vida del agente y active revocaciones en el vault. El mesh de OpenLegion maneja esto automáticamente: cuando un agente es archivado, el mesh revoca todos los handles de credenciales asociados con el ámbito de ese agente. Para los sistemas de [orquestación de agentes IA](/learn/ai-agent-orchestration) que gestionan el ciclo de vida del agente de forma programática, la revocación de credenciales debe ser un evento de ciclo de vida de primera clase, no una reflexión operativa posterior.

## Rastros de auditoría y registro de acceso a credenciales

### Qué registrar (y qué no)

Cada evento de acceso a credenciales debe producir una entrada de registro que contenga: el ID del agente que resolvió el handle, el nombre del handle (no el valor resuelto), la marca de tiempo, el endpoint externo al que se dirigió la solicitud autenticada y el resultado (éxito o fallo de autorización). Lo que no se debe registrar: el valor real de la credencial, la cadena secreta resuelta o cualquier derivado de la credencial en texto plano. El nombre del handle es suficiente para fines de auditoría y forenses.

### Correlacionar el uso de credenciales con las acciones del agente

Los rastros de auditoría de agentes difieren de los rastros de auditoría de aplicaciones tradicionales: la ruta del código es no determinista. Una aplicación tradicional sigue un grafo de llamadas fijo; un agente puede tomar cualquier acción dependiendo de su prompt, las salidas de las herramientas y el razonamiento LLM. Los registros de auditoría de agentes deben capturar cada llamada de herramienta y sus argumentos, no solo los accesos a credenciales, para reconstruir el contexto completo alrededor de un evento sospechoso de uso de credenciales.

El orquestador de OpenLegion registra las llamadas de herramientas y las resoluciones de credenciales en un flujo de eventos unificado. Un análisis forense puede reproducir la secuencia: tarea recibida -> llamada LLM -> herramienta seleccionada -> credencial resuelta -> API externa llamada -> respuesta recibida. Esta es la arquitectura correcta para despliegues de agentes IA en entornos regulados o de alto riesgo.

### Requisitos de auditoría para entornos regulados

Para servicios financieros, sanidad y otros sectores regulados, los registros de auditoría de credenciales de agentes deben cumplir requisitos específicos: inmutabilidad (los registros no pueden ser alterados después de su creación), resistencia a la manipulación (la integridad de los registros es verificable), cumplimiento del período de retención (registros retenidos durante la duración requerida) y controles de acceso (solo el personal autorizado puede leer los registros de auditoría). Estos requisitos se mapean directamente a la arquitectura vault-proxy: el host mesh genera entradas de registro de auditoría a medida que se resuelven las credenciales, las escribe en un almacén de solo adición y firma las entradas para resistencia a la manipulación. Los contenedores de agentes nunca tienen acceso al almacén de registros de auditoría. Para las decisiones de [plataforma de agentes IA](/learn/ai-agent-platform), la arquitectura del registro de auditoría es una consideración de cumplimiento clave junto con la elección del backend de secretos.

## Elegir un backend de secretos para su plataforma de agentes

### HashiCorp Vault

HashiCorp Vault (35.763 estrellas, BSL, v2.0.2 lanzado el 5 de junio de 2026) es el sistema de gestión de secretos open source de referencia. Proporciona generación dinámica de secretos, arrendamientos con TTL acotado, políticas de acceso de grano fino, registro de auditoría completo y una arquitectura de plugins para motores de secretos personalizados. Nota: HashiCorp pasó de la licencia Apache 2.0 aprobada por OSI a BSL (Business Source License) en agosto de 2023; BSL no es una licencia open source aprobada por OSI y restringe el uso comercial por parte de los competidores de Vault.

Vault es la elección correcta cuando necesita un sistema autónomo de gestión de secretos que compartan múltiples servicios. La carga operacional no es trivial: Vault requiere su propio despliegue, configuración de alta disponibilidad y procedimientos de desellado. Para flotas de agentes donde Vault ya está desplegado como infraestructura, integrar la gestión de credenciales de agentes en el motor de políticas de Vault es sencillo.

### Infisical

Infisical (27.296 estrellas, núcleo bajo licencia MIT, TypeScript open source) proporciona una plataforma de secretos nativa para desarrolladores con una interfaz web, CLI y SDK para gestión de secretos, rotación y rastros de auditoría. Recaudó $2,8M en financiación inicial en 2023 y se posiciona como una alternativa más ligera a HashiCorp Vault para equipos que desean gestión de secretos sin la complejidad operacional de Vault ni las restricciones de licencia BSL.

Para flotas de agentes que no ejecutan ya Vault, Infisical vale la pena evaluarlo como backend de secretos. Su diseño SDK-first se integra limpiamente con los runtimes de agentes Python, y su alcance por entorno se mapea naturalmente a los requisitos de alcance por agente.

### Cloud-nativo (AWS/Azure/GCP)

AWS Secrets Manager ($0,40/secreto/mes + $0,05 por 10.000 llamadas API), Azure Key Vault y GCP Secret Manager proporcionan almacenamiento de secretos gestionado con integración nativa a los sistemas IAM de cada proveedor cloud. Si su flota de agentes se ejecuta completamente dentro de un único proveedor cloud, la gestión de secretos nativa en la nube evita la carga operacional de ejecutar Vault o Infisical por separado.

La limitación: los gestores de secretos nativos de la nube requieren credenciales IAM de la nube para acceder, el problema de la credencial de arranque. Un nuevo contenedor de agente necesita alguna credencial para autenticarse en AWS Secrets Manager antes de poder recuperar sus credenciales operacionales. La identidad de carga de trabajo OIDC resuelve este problema de arranque para despliegues nativos de la nube.

<!-- SCHEMA: FAQPage -->
## Preguntas frecuentes

### ¿Qué es la gestión de credenciales para agentes IA?

La gestión de credenciales para agentes IA es el conjunto de prácticas de infraestructura que gobiernan cómo los agentes autónomos obtienen, usan, rotan y ceden claves API, tokens y secretos. Los agentes difieren de las aplicaciones tradicionales porque funcionan de forma autónoma, pueden ser comprometidos mediante inyección de prompts, producen registros detallados y operan como flotas de múltiples instancias, todo lo cual crea vectores de exposición de credenciales que los patrones estándar de variables de entorno no abordan. OWASP LLM Top 10 v1.1 (2025) lista la Divulgación de información sensible (LLM06) como amenaza top-10, con la exfiltración de credenciales como vector de ataque principal.

### ¿Qué CVE están relacionados con la fuga de credenciales de agentes IA?

CVE-2024-34359 (llama-cpp-python, CVSS 9,6) documentó una vulnerabilidad de inyección de plantilla Jinja2 del lado del servidor en la pipeline de carga de modelos: la plantilla de chat de un archivo `.gguf` elaborado se renderizaba sin sandboxing, lo que permitía ejecución remota de código en cualquier aplicación que cargara modelos no confiables. CVE-2025-29927 (Next.js, CVSS 9,1) demostró que el encabezado `x-middleware-subrequest` podía omitir la autorización de middleware en aplicaciones Next.js, incluidos los backends de agentes IA que usaban middleware para proteger rutas con credenciales. Ambos CVE se remontan a controles de seguridad en la capa de aplicación que fallan bajo entrada maliciosa; la solución estructural es mantener los secretos completamente fuera de los contenedores de agentes.

### ¿Cómo previene el patrón vault-proxy la fuga de credenciales?

El vault proxy intercepta las llamadas API de los agentes, resuelve los handles de credenciales opacos a secretos reales en la capa de red y devuelve la respuesta autenticada sin que la credencial entre jamás en el contenedor o la ventana de contexto del agente. El agente mantiene un handle como `$CRED{stripe_key}` que identifica el secreto sin resolverlo. Un contenedor de agente completamente comprometido que ejecuta instrucciones arbitrarias del atacante todavía tiene acceso cero a credenciales sin procesar, porque ninguna credencial existe dentro del alcance del contenedor.

### ¿Por qué es importante el aislamiento de credenciales por agente en los sistemas multi-agente?

En un sistema multi-agente, el radio de impacto de cada agente si es comprometido está acotado por las credenciales que mantiene. Si cada agente comparte un único archivo `.env` con todos los secretos, comprometer cualquier agente expone todas las credenciales a cada sistema descendente. El alcance de credenciales por agente, aplicado en la capa de orquestación y no en el propio código del agente, significa que un agente de investigación comprometido no puede acceder a los tokens de escritura del agente de publicación ni a las credenciales de base de datos del agente de datos. OWASP LLM06 identifica explícitamente las credenciales de agentes sobre-aprovisionadas como factor contribuyente a los incidentes de fuga de credenciales.

### ¿Qué dice OWASP sobre la gestión de credenciales para agentes IA?

OWASP Top 10 para aplicaciones LLM v1.1 (publicado en octubre de 2025) lista la Divulgación de información sensible como LLM06, identificando la exfiltración de credenciales como el principal vector de ataque para las aplicaciones LLM. La guía recomienda evitar el almacenamiento de credenciales en texto plano en el contexto del agente, implementar el alcance de credenciales con mínimo privilegio y usar controles de la capa de infraestructura en lugar de depender del código del agente para proteger los secretos. La inyección de prompt, OWASP LLM01 y el principal riesgo, es el vector de ataque más común para desencadenar la divulgación de credenciales en agentes desplegados.

### ¿Cómo gestiona OpenLegion las credenciales para agentes que ejecutan servidores MCP?

En OpenLegion, las credenciales del servidor de herramientas MCP se almacenan en el vault y se inyectan a través del mismo patrón proxy que las credenciales de agentes. El servidor MCP recibe solicitudes autenticadas del proxy mesh en lugar de credenciales sin procesar del agente; el agente nunca mantiene las claves API upstream del servidor MCP. Con 700+ servidores MCP en el ecosistema (junio de 2026), esto elimina la proliferación de `.env` por servidor: una configuración vault cubre todos los requisitos de credenciales MCP, y un servidor MCP comprometido no puede recolectar credenciales sin procesar de las solicitudes entrantes.

### ¿Qué es la rotación de secretos y por qué la necesitan los agentes IA?

La rotación de secretos es la práctica de reemplazar una credencial con una nueva de forma programada o activada, invalidando la anterior. Los agentes IA necesitan rotación porque se ejecutan durante períodos prolongados (horas a días), son objetivos potenciales de exfiltración durante toda esa ventana y no se pueden reiniciar fácilmente a mitad de una tarea para adoptar credenciales rotadas. Los arrendamientos de credenciales con TTL acotado expiran automáticamente después de una ventana configurable (típicamente 1 hora), y el patrón vault-proxy admite rotación en caliente, inyectando el nuevo secreto sin tocar el contenedor de agente en ejecución, por lo que la rotación es transparente para el agente.

## Construir flotas de agentes sin exposición de credenciales

El problema de gestión de credenciales en las flotas de agentes IA es arquitectónico: si las credenciales existen en los contenedores de agentes, pueden filtrarse. CVE-2024-34359 y CVE-2025-29927 demuestran que incluso equipos bien dotados que ejecutan frameworks importantes entregan esta exposición. El patrón vault-proxy lo resuelve estructuralmente: las credenciales nunca entran en los contenedores de agentes, por lo que la inyección de prompt, el escape del contenedor o la exfiltración de registros no pueden recuperarlas.

El vault-proxy de OpenLegion está integrado en el mesh de agentes. Configure una credencial una vez con `$CRED{nombre}`, asígnela a los agentes que la necesiten y el mesh gestiona la inyección, la renovación TTL, el alcance por agente y el registro de auditoría. Sin despliegue de vault separado, sin coordinación de archivos `.env`, sin procedimientos de rotación manual.

[Asegure su flota de agentes con aislamiento de credenciales vault-proxy en OpenLegion](https://openlegion.ai)
