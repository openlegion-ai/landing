---
title: "Seguridad de Agentes de IA — Amenazas, Aislamiento, Bóvedas"
description: >-
 Guía de seguridad de agentes de IA: fuga de credenciales, inyección de prompt,
 escape de sandbox, y cómo el aislamiento por contenedor, las credenciales con
 proxy de bóveda y los controles de presupuesto mitigan cada amenaza.
slug: /learn/ai-agent-security
primary_keyword: seguridad de agentes de ia
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2025-12
last_updated: 2026-03
schema_types:
 - FAQPage
related:
 - /learn/ai-agent-platform
 - /learn/ai-agent-orchestration
 - /learn/ai-agent-frameworks
 - /comparison
---

# Seguridad de Agentes de IA: El Modelo de Amenazas para Flotas de Agentes en Producción

Cada framework de agentes de IA le da herramientas para construir agentes. Casi ninguno le da herramientas para contenerlos. Cuando un agente puede llamar APIs, navegar la web, ejecutar código y acceder a bases de datos, la pregunta de seguridad no es si algo puede salir mal — es cómo se ve el radio de explosión cuando ocurre.

La **seguridad de agentes de IA** es la práctica de restringir agentes autónomos para que un agente comprometido, mal configurado o con comportamiento errático no pueda filtrar credenciales, exfiltrar datos, vaciar presupuestos o escalar privilegios. OpenLegion trata esto como una preocupación arquitectónica central, no un complemento. Cada agente corre en un contenedor aislado con credenciales con proxy de bóveda, controles de presupuesto por agente y una matriz de permisos — todo habilitado por defecto.

Aporte sus propias claves API de LLM. Sin recargo en el uso del modelo.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es la seguridad de agentes de IA?**
> La seguridad de agentes de IA abarca los controles que previenen que los agentes de IA autónomos causen daño — ya sea mediante fuga de credenciales, inyección de prompt, abuso de recursos, exfiltración de datos o agencia excesiva. Incluye aislamiento de runtime, gestión de credenciales, aplicación de coste, controles de permisos y validación de entrada aplicados a nivel de infraestructura.

## TL;DR

- **La amenaza es real.** La investigación muestra que el 77% de las organizaciones con despliegues de IA experimentaron incidentes de seguridad en 2024. Solo el 5% expresa confianza en sus medidas de seguridad de IA.
- **Cuatro amenazas principales**: fuga de credenciales, inyección de prompt, abuso de recursos (denegación de cartera) y exfiltración de datos. Cada una requiere una mitigación diferente.
- **Ningún framework importante proporciona seguridad integrada.** Basado en documentación pública, LangGraph, CrewAI, AutoGen y OpenClaw dependen todos de variables de entorno para credenciales sin aislamiento nativo ni aplicación de presupuesto.
- **Defensa de seis capas de OpenLegion**: Aislamiento por contenedor, endurecimiento de contenedor, separación de credenciales (proxy de bóveda), aplicación de permisos, validación de entrada y saneamiento Unicode — todo habilitado por defecto.
- **Los agentes de IA seguros son posibles con claves BYO** — el modelo de proxy de bóveda significa que sus claves permanecen en la zona de confianza y los agentes interactúan a través de un proxy que nunca expone secretos en bruto.

## El Modelo de Amenazas para Agentes de IA

### Amenaza 1: Fuga de credenciales

**Qué pasa.** Un agente con acceso a claves API — a través de variables de entorno, archivos de configuración o paso en contexto — filtra esas claves vía inyección de prompt, logging, mensajes de error o llamadas maliciosas a herramientas.

**Cuán común.** La investigación publicada a principios de 2026 encontró que 283 de 3.984 skills de agentes escaneados (7,1%) contenían fallos críticos de manejo de credenciales, pasando claves API y contraseñas a través del contexto LLM en texto plano. Por separado, 76 skills contenían payloads maliciosos deliberados diseñados para robo de credenciales. Incidentes de alto perfil incluyen un empleado de xAI filtrando una clave API en GitHub que proporcionó acceso a más de 60 LLMs privados durante dos meses, y una vulnerabilidad en una plataforma LLM popular que expuso claves API vía un endpoint no autenticado.

**Cómo lo mitiga OpenLegion.** OpenLegion usa credenciales con proxy de bóveda a través de un proxy de bóveda. Las claves API se almacenan en el Mesh Host (Zona 2). Cuando un agente necesita llamar a una API externa, la petición se enruta a través del proxy de bóveda, que inyecta la credencial en la capa de red. El agente nunca ve, registra ni tiene acceso de memoria a la clave en bruto. Incluso un agente totalmente comprometido no puede extraer credenciales porque nunca están presentes en el contenedor del agente.

### Amenaza 2: Inyección de prompt

**Qué pasa.** Un atacante incrusta instrucciones maliciosas en contenido que el agente procesa — páginas web, documentos, emails, registros de bases de datos, entradas del usuario. El agente sigue las instrucciones inyectadas en lugar de (o además de) su tarea pretendida.

**Cuán común.** La inyección de prompt aparece en más del 73% de los despliegues de IA en producción evaluados durante auditorías de seguridad. OpenAI declaró en diciembre de 2025 que la inyección de prompt "probablemente nunca se resolverá por completo". OWASP la clasifica como la vulnerabilidad #1 para aplicaciones LLM. Los incidentes del mundo real incluyen un agente de navegador que fue engañado para robar credenciales en 150 segundos vía instrucciones ocultas en una página web, y sistemas RAG empresariales donde contenido malicioso en documentos públicos causó que los agentes filtraran datos propietarios.

**Cómo lo mitiga OpenLegion.** OpenLegion aplica defensa en profundidad en múltiples capas. El saneamiento Unicode despoja caracteres invisibles (overrides bidi, caracteres tag, caracteres de ancho cero) en 56 puntos de control antes de que el contenido llegue al contexto del LLM — estos caracteres se usan comúnmente para ocultar instrucciones inyectadas. La validación de entrada previene path traversal y aplica evaluación segura de condiciones. El aislamiento por contenedor limita el radio de explosión: incluso si un agente es inyectado con éxito, solo puede acceder a su propio contenedor sandboxed con sus propios permisos delimitados. No puede acceder a datos de otros agentes, a la bóveda de credenciales ni al sistema anfitrión.

Ningún sistema puede garantizar inmunidad completa a la inyección de prompt. El enfoque de OpenLegion es minimizar la superficie de ataque y contener el daño.

### Amenaza 3: Abuso de recursos (Denegación de Cartera)

**Qué pasa.** Un agente entra en un bucle recursivo, hace llamadas API excesivas o es manipulado para consumir recursos mucho más allá de lo necesario. En sistemas multi-agente, esto se compone — un flujo de 5 agentes cuesta 5 veces lo que cuesta un único agente, y un bucle descontrolado puede quemar cientos de dólares en minutos antes de que nadie lo note.

**Cuán común.** Esto está listado como OWASP LLM10:2025 (Consumo Ilimitado). La mayoría de los sistemas de facturación cloud no detienen automáticamente los cargos cuando se exceden los presupuestos — las alertas se disparan, pero el medidor sigue corriendo. Los reportes comunitarios de usuarios de CrewAI y LangGraph describen bucles que queman tokens, consumiendo 10 veces los presupuestos esperados.

**Cómo lo mitiga OpenLegion.** Controles de presupuesto diarios y mensuales por agente con corte estricto. Cada agente en la flota tiene su propio presupuesto de tokens rastreado en tiempo real. Cuando se alcanza el límite, la [capa de orquestación](/learn/ai-agent-orchestration) detiene a ese agente específico. El resto del flujo continúa o pausa con gracia. No hay una "advertencia suave" que se ignore — el corte se aplica a nivel de infraestructura.

### Amenaza 4: Exfiltración de datos

**Qué pasa.** Un agente es manipulado para enviar datos sensibles a un endpoint controlado por el atacante. Las técnicas incluyen: instruir al agente para codificar datos en parámetros URL (que se registran o se envían vía previsualizaciones de enlace), usar el navegador del agente para visitar páginas controladas por el atacante o explotar llamadas a herramientas para reenviar datos a APIs externas.

**Cuán común.** Se han demostrado técnicas de exfiltración zero-click contra agentes operando en plataformas de mensajería (donde las previsualizaciones de enlaces buscan URLs automáticamente), herramientas de colaboración empresarial y repositorios de código. La investigación sobre agentes bancarios mostró aproximadamente 20% de tasas de éxito para ataques de exfiltración de datos.

**Cómo lo mitiga OpenLegion.** El aislamiento de red a nivel de contenedor restringe qué endpoints externos puede alcanzar cada agente. La matriz de permisos define herramientas, archivos y operaciones de mesh permitidas por agente. Las peticiones salientes se enrutan a través de canales controlados. Combinado con aislamiento de credenciales (el agente no tiene credenciales que exfiltrar) y la coordinación tipo flota (que registra cada acción), la superficie de ataque para exfiltración se reduce significativamente en comparación con agentes corriendo en espacios de proceso compartidos con acceso de red sin restricciones.

### Amenaza 5: Escape de sandbox

**Qué pasa.** Un agente o su código ejecutado escapa de su contenedor y obtiene acceso al sistema anfitrión, otros contenedores o la capa de orquestación. Las vulnerabilidades de escape de contenedor se descubren regularmente — múltiples CVEs de alta severidad de runC se divulgaron en noviembre de 2025 afectando Docker y Kubernetes en proveedores cloud principales.

**Cómo lo mitiga OpenLegion.** Endurecimiento de contenedor: ejecución no-root (UID 1000), flag `no-new-privileges`, límites de memoria configurables (384MB por defecto), límites de CPU configurables (0,15 por defecto) y sin sistema de archivos compartido entre contenedores. Cada agente obtiene su propio volumen `/data`. El modelo de confianza de cuatro zonas (más un nivel operador-o-interno) significa que incluso si un agente escapa de su contenedor, aterriza en una zona sin acceso directo a la bóveda de credenciales o contenedores de otros agentes. Para entornos que requieren aislamiento más fuerte, la arquitectura soporta microVMs Docker Sandbox.

### Amenaza 6: Ataques de cadena de suministro

**Qué pasa.** Se introduce código malicioso a través de skills de agente, servidores de herramientas MCP, configuraciones compartidas o dependencias de framework. Se han encontrado servidores MCP maliciosos en npm suplantando servicios legítimos. Archivos de configuración crowdsourced han sido armados con prompts ocultos activados por LLM.

**Cómo lo mitiga OpenLegion.** OpenLegion usa cero dependencias externas de framework — sin LangChain, sin Redis, sin Kubernetes. El core es Python puro + SQLite. Los servidores de herramientas MCP son soportados pero sandboxed a través de la matriz de permisos. La coordinación tipo flota significa que las llamadas a herramientas se declaran explícitamente en la definición del flujo, no se descubren dinámicamente en runtime — reduciendo la superficie para inyección inesperada de herramientas.

## Cómo Funciona el Aislamiento de Agentes de IA en OpenLegion

El modelo de confianza de cuatro zonas de OpenLegion más un nivel operador-o-interno separa cada despliegue en límites de seguridad distintos:

**Zona 0 — Entrada Externa No Confiable.** Cualquier cosa que llegue de usuarios o terceros: CLI, Telegram, Discord, Slack, WhatsApp y endpoints webhook. Las entradas se validan y sanean vía guardas de inyección de prompt antes de entrar a la Zona 2.

**Zona 1 — Contenedores de Agente Sandboxed (No Confiable).** Cada agente corre como una instancia FastAPI aislada en su propio contenedor Docker. Cada contenedor tiene su propio volumen `/data`, su propia base de datos de memoria (SQLite + búsqueda vectorial), límites de recursos configurables (384MB RAM / 0,15 CPU por defecto), ejecución no-root (UID 1000), `cap_drop=ALL`, `no-new-privileges`, un sistema de archivos raíz de solo lectura y sin acceso al socket Docker, la bóveda de credenciales o contenedores de otros agentes.

**Zona 2 — Mesh Host (Confiable).** El único componente con acceso a credenciales. Ejecuta el Blackboard (estado compartido + WAL), enrutador PubSub, Bóveda de Credenciales (proxy de inyección ciega), matriz ACL, Gestor de Contenedores, Rastreador de Costes y Servicio de Navegador (Camoufox por agente en :8500). Esta zona está endurecida y no expuesta al código del agente.

**Zona 2.5 — Operador-o-Interno.** Operaciones reservadas del plano de control disponibles para el agente Operador o utilidades internas del mesh — gestión de flota, ediciones de agentes, concesiones de permisos (el Operador no puede conceder `can_spawn` ni `can_use_wallet`).

**Zona 3 — Interno Solo-Loopback.** El nivel más restringido: endpoints que requieren tanto una cabecera `x-mesh-internal: 1` como una IP de origen loopback. Usado solo para llamadas de coordinación interna del mesh.

Esta arquitectura significa que un agente comprometido en la Zona 1 no puede alcanzar la Zona 2 (credenciales) ni otros contenedores de la Zona 1 (datos de otros agentes). El radio de explosión de cualquier compromiso de un único agente está contenido al sandbox de ese agente.

## Gestión de Credenciales de Agentes de IA: Proxy de Bóveda vs Variables de Entorno

El patrón más común de gestión de credenciales en los [frameworks de agentes de IA](/learn/ai-agent-frameworks) son las variables de entorno. Su clave API se sitúa en un archivo `.env` o se pasa vía `OAI_CONFIG_LIST`. El proceso del agente la lee directamente. Esto significa:

- La clave existe en el espacio de memoria del agente
- Un ataque de inyección de prompt puede instruir al agente a imprimir o exfiltrar la clave
- Los logs, mensajes de error y salida de depuración pueden contener la clave
- Si el agente se ve comprometido, el atacante tiene acceso directo a todas las credenciales inyectadas

El proxy de bóveda de OpenLegion cambia esta arquitectura fundamentalmente. Las claves API se almacenan en la Bóveda de Credenciales del Mesh Host (Zona 2). Cuando un agente necesita hacer una llamada API autenticada, envía la petición al proxy de bóveda. El proxy inyecta la credencial en la capa de red, hace la llamada autenticada y devuelve el resultado al agente. El agente nunca ve, almacena ni tiene acceso de memoria a la clave en bruto.

Esto son **credenciales con proxy de bóveda** — el mismo principio usado por sistemas de gestión de secretos empresariales como HashiCorp Vault, pero integrado en la capa de [orquestación de agentes de IA](/learn/ai-agent-orchestration) en lugar de requerir infraestructura separada.

## Agentes de IA Contenedorizados: Por Qué el Aislamiento a Nivel de Proceso No Es Suficiente

Varios frameworks ofrecen alguna forma de aislamiento, pero los detalles de implementación importan:

| Framework | Enfoque de aislamiento | Qué está realmente aislado | Qué se comparte |
|---|---|---|---|
| **OpenLegion** | Contenedor Docker por agente (obligatorio) | Proceso, sistema de archivos, red, memoria, credenciales | Nada — los agentes están totalmente aislados |
| **OpenClaw** | Contenedor Docker (opcional) | Proceso, sistema de archivos | Socket Docker montado por defecto; red del anfitrión accesible |
| **LangGraph** | Ninguno integrado | N/D | Todo — los agentes comparten proceso Python |
| **CrewAI** | Docker para CodeInterpreter | Salida de ejecución de código | Los procesos de agente comparten runtime Python |
| **AutoGen** | Docker para ejecución de código | Salida de ejecución de código | Los procesos de agente comparten runtime Python |

La distinción crítica: OpenLegion aísla al **agente mismo** en un contenedor. Otros frameworks que ofrecen aislamiento Docker típicamente aíslan solo la **salida de ejecución de código** — el proceso del agente, su memoria y su acceso a credenciales permanecen compartidos. Esto significa que una inyección de prompt que compromete un agente en LangGraph o CrewAI tiene acceso a todas las credenciales y estado en el proceso compartido. En OpenLegion, el mismo compromiso está contenido a un único contenedor sandboxed sin acceso a credenciales.

## Controles de Coste de Agentes de IA: La Aplicación de Presupuesto como Seguridad

Los controles de coste no son solo gobernanza financiera — son un mecanismo de seguridad. Un agente descontrolado consumiendo tokens ilimitados es un ataque de abuso de recursos, ya sea activado por inyección maliciosa de prompt o por un simple bug en el bucle de razonamiento del agente.

La aplicación de presupuesto de OpenLegion funciona a nivel del orquestador:

- Cada agente tiene un presupuesto diario y mensual de tokens configurable
- El uso de tokens se rastrea en tiempo real por el Rastreador de Costes en la Zona 2
- Cuando un agente alcanza su límite, el orquestador emite un corte estricto — el agente se detiene
- El resto del pipeline del flujo continúa o pausa con gracia
- Los datos de coste son visibles en el panel de flota con desgloses por agente

Ningún otro framework importante de agentes de IA proporciona esta capacidad integrada, basado en documentación pública al momento de escribir.

## Consideraciones de Cumplimiento y Auditoría

OpenLegion está **diseñado para entornos que requieren** controles de cumplimiento, incluyendo:

- **Traza de peticiones**: La coordinación tipo flota auditable significa que cada paso del flujo es explícito y trazable. El sistema integrado de traza de peticiones registra transiciones de tareas, llamadas a herramientas y gasto de tokens para observabilidad en tiempo real. El Blackboard (estado compartido) proporciona contexto de coordinación entre agentes.
- **Coordinación tipo flota auditable**: la coordinación tipo flota (blackboard + pub/sub + handoff) puede ser auditada antes de la ejecución — puede verificar el flujo completo de datos, permisos e interacciones de agente sin ejecutar el sistema.
- **Aislamiento de datos**: Los contenedores por agente con volúmenes `/data` dedicados aseguran que los datos sensibles procesados por un agente no sean accesibles a otros agentes.
- **Soporte air-gap**: Sin servicios externos (sin Redis, sin Kubernetes, sin servicios cloud requeridos) significa que OpenLegion puede correr en entornos on-premise.

**Importante**: OpenLegion no posee actualmente certificaciones SOC 2, ISO 27001, HIPAA u otras certificaciones de cumplimiento. La arquitectura está construida para soportar entornos con estos requisitos, pero la certificación es función de su despliegue, configuración y controles organizacionales — no solo del framework.

## CTA

**Despliegue agentes que son seguros por defecto.**
[Empezar](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué significa seguridad de agentes de IA?

La seguridad de agentes de IA es el conjunto de controles que previenen que los agentes de IA autónomos causen daño mediante fuga de credenciales, inyección de prompt, abuso de recursos, exfiltración de datos, escape de sandbox o agencia excesiva. Abarca aislamiento de runtime (sandboxing de agentes), gestión de credenciales (previniendo exposición de claves), aplicación de coste (deteniendo gasto descontrolado), controles de permisos (limitando lo que los agentes pueden hacer) y validación de entrada (filtrando entradas maliciosas).

### ¿Cómo se aseguran los agentes de IA con claves API?

El enfoque más seguro son las credenciales con proxy de bóveda: almacene claves API en una bóveda a la que los agentes no puedan acceder directamente. Cuando un agente necesita hacer una llamada autenticada, la petición se enruta a través de un proxy que inyecta la credencial en la capa de red. El agente nunca ve la clave en bruto. OpenLegion implementa esto a través de su proxy de bóveda en la Zona 2 del modelo de confianza de cuatro zonas (más un nivel operador-o-interno). El enfoque menos seguro (y más común) son las variables de entorno, donde las claves existen en la memoria del agente y pueden filtrarse vía inyección de prompt, logging o salida de error.

### ¿Cómo funciona el aislamiento de agentes de IA?

El aislamiento de agente significa ejecutar cada agente en su propio entorno sandboxed — proceso, sistema de archivos, namespace de red y espacio de memoria separados. En OpenLegion, cada agente corre en un contenedor Docker dedicado con límites de recursos configurables (384MB RAM, 0,15 CPU por defecto), ejecución no-root y sin sistema de archivos compartido. Esto significa que un agente comprometido no puede acceder a datos de otros agentes, la bóveda de credenciales o el sistema anfitrión. Esto difiere de frameworks donde los agentes comparten un proceso Python y pueden acceder a la memoria de otros.

### ¿Por qué los agentes de IA necesitan controles de presupuesto / coste?

Los agentes autónomos pueden entrar en bucles recursivos, hacer llamadas API excesivas o ser manipulados para consumir recursos mucho más allá de lo necesario. Sin controles de presupuesto, un único agente descontrolado puede vaciar cientos de dólares en tokens en minutos. En sistemas multi-agente esto se compone — cada agente multiplica el riesgo. OpenLegion aplica presupuestos diarios y mensuales por agente con cortes estrictos a nivel del orquestador, previniendo que cualquier agente individual cause coste ilimitado.

### ¿Son posibles los agentes de IA seguros con claves BYO?

Sí. El modelo BYO (Bring Your Own) de claves es realmente más seguro con la arquitectura adecuada. En OpenLegion, sus claves se almacenan en la Bóveda de Credenciales del Mesh Host y se inyectan a través de un proxy de bóveda en la capa de red. Los agentes nunca ven las claves en bruto. Esto le da total transparencia de coste (ve exactamente lo que gasta cada agente con cada proveedor), flexibilidad de proveedor (intercambie modelos por agente) y las mismas garantías de aislamiento de credenciales independientemente del proveedor que use. Aporte sus propias claves API de LLM. Sin recargo en el uso del modelo.

### ¿Qué es el OWASP Top 10 para agentes de IA?

OWASP publicó el Top 10 para Aplicaciones Agénticas en diciembre de 2025. El riesgo #1 es el Secuestro de Objetivo del Agente — donde un atacante manipula a un agente para perseguir objetivos diferentes a los que el usuario pretendía. Otros riesgos principales incluyen fuga de credenciales, agencia excesiva (agentes realizando acciones más allá de su alcance) y vulnerabilidades de cadena de suministro (herramientas o plugins maliciosos). OpenLegion aborda esto a través de credenciales con proxy de bóveda, aislamiento por contenedor, matrices de permisos y coordinación tipo flota (blackboard + pub/sub + handoff).

### ¿Cómo se compara OpenLegion con OpenClaw en seguridad?

Basado en documentación pública, OpenLegion proporciona configuraciones de seguridad más estrictas. El despliegue local por defecto de OpenClaw requiere el montaje del socket Docker (concediendo amplio acceso al anfitrión), su analizador de seguridad ha reportado problemas con activación consistente y almacena credenciales en configuración accesible al proceso del agente. OpenLegion ejecuta agentes en contenedores aislados obligatorios, usa un proxy de bóveda para credenciales con proxy de bóveda, aplica presupuestos por agente y aplica saneamiento Unicode en múltiples puntos de control. Para una comparativa detallada, consulte [OpenLegion vs OpenClaw](/comparison/openclaw).

### ¿Qué frameworks de cumplimiento aplican a los agentes de IA?

Los frameworks clave incluyen OWASP Top 10 para Aplicaciones LLM (2025) y Aplicaciones Agénticas (2026), NIST AI Risk Management Framework (con próximos Estándares de Agentes de IA), ISO/IEC 42001 (sistemas de gestión de IA), la Ley de IA de la UE (cuya aplicación comienza en agosto de 2026) y regulaciones específicas del sector como HIPAA, SOC 2 y SOX dependiendo de su dominio. La arquitectura de OpenLegion está diseñada para entornos que requieren estos controles pero no posee certificaciones por sí misma.

---

## Enlaces Internos a Incluir

| Texto de Anclaje | Destino |
|---|---|
| Plataforma de agentes de IA | /learn/ai-agent-platform |
| Orquestación de agentes de IA | /learn/ai-agent-orchestration |
| Comparativa de frameworks de agentes de IA | /learn/ai-agent-frameworks |
| Seguridad de agentes de IA | /learn/ai-agent-security |
| Alternativa a OpenClaw | /openclaw-alternative |
| OpenLegion vs OpenClaw | /comparison/openclaw |
| Documentación | /docs |
| GitHub | https://github.com/openlegion-ai/openlegion |
