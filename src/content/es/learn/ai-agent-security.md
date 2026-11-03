---
title: "Seguridad de Agentes de IA — Amenazas, Aislamiento, Bóvedas"
description: >-
 Guía de seguridad de agentes de IA: fuga de credenciales, inyección de prompt,
 escape de sandbox, y cómo el aislamiento de la ejecución, las credenciales
 guardadas en bóveda y los controles de presupuesto mitigan cada amenaza.
slug: /learn/ai-agent-security
primary_keyword: seguridad de agentes de ia
secondary_keywords:
 - ai agent credential leakage
 - ai agent prompt injection
 - ai agent sandbox escape
 - secure ai agent deployment
 - ai agent threat model
date_published: 2026-03
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

La **seguridad de agentes de IA** es la práctica de restringir agentes autónomos para que un agente comprometido, mal configurado o con comportamiento errático no pueda filtrar credenciales, exfiltrar datos, vaciar presupuestos o escalar privilegios. OpenLegion trata esto como una preocupación arquitectónica central, no un complemento. Cada acción es una intención verificada por un único motor de políticas antes de ocurrir, las credenciales viven en una bóveda fuera del modelo y cada agente lleva su propio presupuesto — todo habilitado por defecto.

Los modelos se eligen por preset — Smartest, Smart o Normal — por agente o por espacio de trabajo.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es la seguridad de agentes de IA?**
> La seguridad de agentes de IA abarca los controles que previenen que los agentes de IA autónomos causen daño — ya sea mediante fuga de credenciales, inyección de prompt, abuso de recursos, exfiltración de datos o agencia excesiva. Incluye aislamiento de runtime, gestión de credenciales, aplicación de coste, controles de permisos y validación de entrada aplicados a nivel de infraestructura.

## TL;DR

- **La amenaza es real.** La investigación muestra que el 77% de las organizaciones con despliegues de IA experimentaron incidentes de seguridad en 2024. Solo el 5% expresa confianza en sus medidas de seguridad de IA.
- **Cuatro amenazas principales**: fuga de credenciales, inyección de prompt, abuso de recursos (denegación de cartera) y exfiltración de datos. Cada una requiere una mitigación diferente.
- **Ningún framework importante proporciona seguridad integrada.** Basado en documentación pública, LangGraph, CrewAI, AutoGen y OpenClaw dependen todos de variables de entorno para credenciales sin aislamiento nativo ni aplicación de presupuesto.
- **Defensa en capas de OpenLegion**: un único motor de políticas delante de cada acción, ejecuciones de tarea en sandbox, separación de credenciales (una bóveda fuera del modelo), aplicación de permisos, validación de entrada y saneamiento Unicode — todo habilitado por defecto.
- **Las credenciales de sus servicios permanecen a salvo** — viven en una bóveda y se inyectan fuera del modelo, que solo llega a retener un identificador y nunca ve un secreto en bruto.

## El Modelo de Amenazas para Agentes de IA

### Amenaza 1: Fuga de credenciales

**Qué pasa.** Un agente con acceso a claves API — a través de variables de entorno, archivos de configuración o paso en contexto — filtra esas claves vía inyección de prompt, logging, mensajes de error o llamadas maliciosas a herramientas.

**Cuán común.** La investigación publicada a principios de 2026 encontró que 283 de 3.984 skills de agentes escaneados (7,1%) contenían fallos críticos de manejo de credenciales, pasando claves API y contraseñas a través del contexto LLM en texto plano. Por separado, 76 skills contenían payloads maliciosos deliberados diseñados para robo de credenciales. Incidentes de alto perfil incluyen un empleado de xAI filtrando una clave API en GitHub que proporcionó acceso a más de 60 LLMs privados durante dos meses, y una vulnerabilidad en una plataforma LLM popular que expuso claves API vía un endpoint no autenticado.

**Cómo lo mitiga OpenLegion.** Las credenciales viven en una bóveda y se inyectan fuera del modelo, que solo llega a retener un identificador. Cuando un agente necesita llamar a una API externa, la plataforma inyecta la credencial en el límite de la llamada. El agente nunca ve, registra ni tiene acceso de memoria a la clave en bruto. Incluso un agente totalmente comprometido no puede extraer credenciales porque nunca están presentes en su ejecución.

### Amenaza 2: Inyección de prompt

**Qué pasa.** Un atacante incrusta instrucciones maliciosas en contenido que el agente procesa — páginas web, documentos, emails, registros de bases de datos, entradas del usuario. El agente sigue las instrucciones inyectadas en lugar de (o además de) su tarea pretendida.

**Cuán común.** La inyección de prompt aparece en más del 73% de los despliegues de IA en producción evaluados durante auditorías de seguridad. OpenAI declaró en diciembre de 2025 que la inyección de prompt "probablemente nunca se resolverá por completo". OWASP la clasifica como la vulnerabilidad #1 para aplicaciones LLM. Los incidentes del mundo real incluyen un agente de navegador que fue engañado para robar credenciales en 150 segundos vía instrucciones ocultas en una página web, y sistemas RAG empresariales donde contenido malicioso en documentos públicos causó que los agentes filtraran datos propietarios.

**Cómo lo mitiga OpenLegion.** OpenLegion aplica defensa en profundidad en múltiples capas. El saneamiento Unicode despoja caracteres invisibles (overrides bidi, caracteres tag, caracteres de ancho cero) antes de que el contenido llegue al contexto del LLM — estos caracteres se usan comúnmente para ocultar instrucciones inyectadas. La validación de entrada previene path traversal y aplica evaluación segura de condiciones. Actuar sobre contenido no confiable es uno de los tres muros donde el trabajo se detiene para la aprobación del propietario, lo que limita el radio de explosión: un agente inyectado solo puede actuar dentro de sus propios permisos delimitados. No puede alcanzar datos de otros agentes, la bóveda de credenciales ni el sistema anfitrión.

Ningún sistema puede garantizar inmunidad completa a la inyección de prompt. El enfoque de OpenLegion es minimizar la superficie de ataque y contener el daño.

### Amenaza 3: Abuso de recursos (Denegación de Cartera)

**Qué pasa.** Un agente entra en un bucle recursivo, hace llamadas API excesivas o es manipulado para consumir recursos mucho más allá de lo necesario. En sistemas multi-agente, esto se compone — un flujo de 5 agentes cuesta 5 veces lo que cuesta un único agente, y un bucle descontrolado puede quemar cientos de dólares en minutos antes de que nadie lo note.

**Cuán común.** Esto está listado como OWASP LLM10:2025 (Consumo Ilimitado). La mayoría de los sistemas de facturación cloud no detienen automáticamente los cargos cuando se exceden los presupuestos — las alertas se disparan, pero el medidor sigue corriendo. Los reportes comunitarios de usuarios de CrewAI y LangGraph describen bucles que queman tokens, consumiendo 10 veces los presupuestos esperados.

**Cómo lo mitiga OpenLegion.** Presupuestos por agente con corte estricto. Cada agente del equipo tiene su propio presupuesto, y cada unidad de trabajo es un despertar registrado medido en créditos a $0.001 cada uno. Cuando se alcanza el límite, la [capa de orquestación](/learn/ai-agent-orchestration) detiene a ese agente específico. El resto del flujo continúa o pausa con gracia. No hay una "advertencia suave" que se ignore — el corte se aplica a nivel de plataforma.

### Amenaza 4: Exfiltración de datos

**Qué pasa.** Un agente es manipulado para enviar datos sensibles a un endpoint controlado por el atacante. Las técnicas incluyen: instruir al agente para codificar datos en parámetros URL (que se registran o se envían vía previsualizaciones de enlace), usar el navegador del agente para visitar páginas controladas por el atacante o explotar llamadas a herramientas para reenviar datos a APIs externas.

**Cuán común.** Se han demostrado técnicas de exfiltración zero-click contra agentes operando en plataformas de mensajería (donde las previsualizaciones de enlaces buscan URLs automáticamente), herramientas de colaboración empresarial y repositorios de código. La investigación sobre agentes bancarios mostró aproximadamente 20% de tasas de éxito para ataques de exfiltración de datos.

**Cómo lo mitiga OpenLegion.** El código que el agente escribe corre en un sandbox sin acceso a red por defecto, y alcanzar a un tercero en su nombre se detiene para la aprobación del propietario. La matriz de permisos define herramientas, archivos y operaciones permitidas por agente. Las peticiones salientes se enrutan a través de canales controlados. Combinado con aislamiento de credenciales (el agente no tiene credenciales que exfiltrar) y recibos que registran cada acción, la superficie de ataque para exfiltración se reduce significativamente en comparación con agentes corriendo en espacios de proceso compartidos con acceso de red sin restricciones.

### Amenaza 5: Escape de sandbox

**Qué pasa.** Un agente o su código ejecutado escapa de su contenedor y obtiene acceso al sistema anfitrión, otros contenedores o la capa de orquestación. Las vulnerabilidades de escape de contenedor se descubren regularmente — múltiples CVEs de alta severidad de runC se divulgaron en noviembre de 2025 afectando Docker y Kubernetes en proveedores cloud principales.

**Cómo lo mitiga OpenLegion.** El código que el agente escribe corre en un sandbox sin acceso a red por defecto, y cada tarea corre bajo demanda y luego se detiene — no hay proceso de agente de larga vida que comprometer. Cada agente obtiene su propio almacenamiento, nunca uno compartido. Un único motor de políticas delante de cada acción significa que, incluso si una ejecución fuera subvertida, no tiene ruta directa a la bóveda de credenciales ni a los datos de otro agente. Las credenciales se inyectan fuera del modelo, así que una ejecución subvertida no tiene nada que robar.

### Amenaza 6: Ataques de cadena de suministro

**Qué pasa.** Se introduce código malicioso a través de skills de agente, servidores de herramientas MCP, configuraciones compartidas o dependencias de framework. Se han encontrado servidores MCP maliciosos en npm suplantando servicios legítimos. Archivos de configuración crowdsourced han sido armados con prompts ocultos activados por LLM.

**Cómo lo mitiga OpenLegion.** Cada herramienta que un agente puede alcanzar la concede explícitamente un propietario, no se descubre en runtime, y no hay superficie de plugins de terceros en el lanzamiento. Las concesiones de herramienta las verifica el motor de políticas en cada llamada, y cada concesión queda registrada como un recibo que el propietario puede leer. La coordinación por objetivos y tareas significa que las llamadas a herramientas son explícitas en la definición de la tarea, no se resuelven dinámicamente — reduciendo la superficie para inyección inesperada de herramientas.

## Cómo Funciona el Aislamiento de Agentes de IA en OpenLegion

OpenLegion pone un único motor de políticas delante de cada acción y separa un espacio de trabajo en límites de seguridad distintos:

**Entrada no confiable.** Cualquier cosa que llegue de usuarios o terceros: chat web, Telegram, Slack, email entrante y endpoints webhook. Las entradas se validan y sanean vía guardas de inyección de prompt, y actuar sobre contenido no confiable se detiene para la aprobación del propietario.

**La ejecución del agente.** Cada tarea corre bajo demanda y luego se detiene. El código que el agente escribe corre en un sandbox sin acceso a red por defecto, y la ejecución no retiene credenciales, solo un identificador. Los agentes son registros duraderos, no servidores, así que no hay proceso de larga vida que comprometer, crear uno es instantáneo, un agente inactivo no cuesta nada y un espacio de trabajo puede ejecutar cientos.

**El motor de políticas.** Cada acción es una intención verificada antes de ocurrir: llamada a herramienta, delegación, aprobación, coste. Es el único componente con acceso a la bóveda, inyecta credenciales fuera del modelo y registra cada acción como un recibo que el propietario puede leer.

**Decisiones de propietario y administrador.** El trabajo se detiene para una aprobación en tres muros solamente: alcanzar a un tercero en su nombre, borrar datos y actuar sobre contenido no confiable. Las aprobaciones las decide en la app un propietario o administrador, nunca el propio agente.

**Aislamiento del espacio de trabajo.** Los agentes, tareas, memoria y recibos de un espacio de trabajo están delimitados a ese espacio, y las concesiones de permisos por agente lo estrechan aún más. Nada de lo que hace un agente alcanza fuera de las concesiones que le dio su propietario.

Esta arquitectura significa que un agente comprometido no puede alcanzar la bóveda ni los datos de otro agente. El radio de explosión de cualquier compromiso de un único agente está contenido a la ejecución de ese agente y a sus propias concesiones.

## Gestión de Credenciales de Agentes de IA: Bóveda de Credenciales vs Variables de Entorno

El patrón más común de gestión de credenciales en los [frameworks de agentes de IA](/learn/ai-agent-frameworks) son las variables de entorno. Su clave API se sitúa en un archivo `.env` o se pasa vía `OAI_CONFIG_LIST`. El proceso del agente la lee directamente. Esto significa:

- La clave existe en el espacio de memoria del agente
- Un ataque de inyección de prompt puede instruir al agente a imprimir o exfiltrar la clave
- Los logs, mensajes de error y salida de depuración pueden contener la clave
- Si el agente se ve comprometido, el atacante tiene acceso directo a todas las credenciales inyectadas

La bóveda de credenciales de OpenLegion cambia esta arquitectura fundamentalmente. Las claves API se almacenan en la bóveda, fuera del modelo. Cuando un agente necesita hacer una llamada API autenticada, la plataforma inyecta la credencial en el límite de la llamada, hace la llamada autenticada y devuelve el resultado al agente. El modelo solo llega a retener un identificador y nunca ve, almacena ni tiene acceso de memoria a la clave en bruto.

Esto son **credenciales guardadas en bóveda** — el mismo principio usado por sistemas de gestión de secretos empresariales como HashiCorp Vault, pero integrado en la capa de [orquestación de agentes de IA](/learn/ai-agent-orchestration) en lugar de requerir infraestructura separada.

## Agentes de IA Contenedorizados: Por Qué el Aislamiento a Nivel de Proceso No Es Suficiente

Varios frameworks ofrecen alguna forma de aislamiento, pero los detalles de implementación importan:

| Framework | Enfoque de aislamiento | Qué está realmente aislado | Qué se comparte |
|---|---|---|---|
| **OpenLegion** | Ejecución en sandbox por tarea (siempre activa) | Proceso, sistema de archivos, red, memoria, credenciales | Nada — los agentes están totalmente aislados |
| **OpenClaw** | Contenedor Docker (opcional) | Proceso, sistema de archivos | Socket Docker montado por defecto; red del anfitrión accesible |
| **LangGraph** | Ninguno integrado | N/D | Todo — los agentes comparten proceso Python |
| **CrewAI** | Docker para CodeInterpreter | Salida de ejecución de código | Los procesos de agente comparten runtime Python |
| **AutoGen** | Docker para ejecución de código | Salida de ejecución de código | Los procesos de agente comparten runtime Python |

La distinción crítica: OpenLegion aísla la **propia ejecución de la tarea**. Otros frameworks que ofrecen aislamiento Docker típicamente aíslan solo la **salida de ejecución de código** — el proceso del agente, su memoria y su acceso a credenciales permanecen compartidos. Esto significa que una inyección de prompt que compromete un agente en LangGraph o CrewAI tiene acceso a todas las credenciales y estado en el proceso compartido. En OpenLegion, el mismo compromiso está contenido a una única ejecución en sandbox sin acceso a credenciales.

## Controles de Coste de Agentes de IA: La Aplicación de Presupuesto como Seguridad

Los controles de coste no son solo gobernanza financiera — son un mecanismo de seguridad. Un agente descontrolado consumiendo tokens ilimitados es un ataque de abuso de recursos, ya sea activado por inyección maliciosa de prompt o por un simple bug en el bucle de razonamiento del agente.

La aplicación de presupuesto de OpenLegion funciona a nivel del orquestador:

- Cada agente tiene su propio presupuesto configurable, medido en créditos a $0.001 cada uno
- El uso se rastrea en tiempo real y el coste exacto de cada tarea es visible
- Cuando un agente alcanza su límite, el orquestador emite un corte estricto — el agente se detiene
- El resto del pipeline del flujo continúa o pausa con gracia
- Los datos de coste son visibles en el panel con desgloses por agente

Ningún otro framework importante de agentes de IA proporciona esta capacidad integrada, basado en documentación pública al momento de escribir.

## Consideraciones de Cumplimiento y Auditoría

OpenLegion está **diseñado para entornos que requieren** controles de cumplimiento, incluyendo:

- **Traza de peticiones**: La coordinación auditable por objetivos y tareas significa que cada paso del flujo es explícito y trazable. Cada llamada a herramienta, delegación y aprobación queda registrada con la identidad del agente, una marca de tiempo y el coste exacto de la tarea. El registro compartido de objetivos y tareas proporciona contexto de coordinación entre agentes.
- **Coordinación auditable por objetivos y tareas**: la coordinación por objetivos y tareas (objetivos → tareas → agentes) puede ser auditada antes de la ejecución — puede verificar el flujo completo de datos, permisos e interacciones de agente sin ejecutar el sistema.
- **Aislamiento de datos**: El almacenamiento por agente y las concesiones de permisos por agente aseguran que los datos sensibles procesados por un agente no sean accesibles a otros agentes.
- **Mínimo privilegio**: Las herramientas, archivos y operaciones de cada agente los concede explícitamente un propietario, y cada concesión queda registrada como un recibo.

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

El enfoque más seguro son las credenciales guardadas en bóveda: almacene claves API en una bóveda a la que los agentes no puedan acceder directamente. Cuando un agente necesita hacer una llamada autenticada, la plataforma inyecta la credencial fuera del modelo. El agente nunca ve la clave en bruto. OpenLegion implementa esto con una bóveda de credenciales que el modelo solo puede referenciar por identificador. El enfoque menos seguro (y más común) son las variables de entorno, donde las claves existen en la memoria del agente y pueden filtrarse vía inyección de prompt, logging o salida de error.

### ¿Cómo funciona el aislamiento de agentes de IA?

El aislamiento de agente significa ejecutar cada agente en su propio entorno sandboxed — proceso, sistema de archivos, namespace de red y espacio de memoria separados. En OpenLegion, cada tarea corre bajo demanda y luego se detiene, el código que el agente escribe corre en un sandbox sin acceso a red por defecto, y los agentes no comparten almacenamiento. Esto significa que un agente comprometido no puede acceder a datos de otros agentes, la bóveda de credenciales o el sistema anfitrión. Esto difiere de frameworks donde los agentes comparten un proceso Python y pueden acceder a la memoria de otros.

### ¿Por qué los agentes de IA necesitan controles de presupuesto / coste?

Los agentes autónomos pueden entrar en bucles recursivos, hacer llamadas API excesivas o ser manipulados para consumir recursos mucho más allá de lo necesario. Sin controles de presupuesto, un único agente descontrolado puede vaciar cientos de dólares en tokens en minutos. En sistemas multi-agente esto se compone — cada agente multiplica el riesgo. OpenLegion da a cada agente su propio presupuesto con corte estricto, medido en créditos a $0.001 cada uno, previniendo que cualquier agente individual cause coste ilimitado.

### ¿Son posibles los agentes de IA seguros con claves BYO?

OpenLegion no usa un modelo BYO (Bring Your Own) de claves para LLMs: los modelos se eligen por preset, Smartest, Smart o Normal, por agente o por espacio de trabajo. Las credenciales de servicio que sí aporta, como tokens OAuth y claves API de terceros, se guardan en una bóveda y se inyectan fuera del modelo, que solo llega a retener un identificador. Sigue teniendo total transparencia de coste: cada unidad de trabajo es un despertar registrado medido en créditos a $0.001 cada uno, y el coste exacto de cada tarea es visible.

### ¿Qué es el OWASP Top 10 para agentes de IA?

OWASP publicó el Top 10 para Aplicaciones Agénticas en diciembre de 2025. El riesgo #1 es el Secuestro de Objetivo del Agente — donde un atacante manipula a un agente para perseguir objetivos diferentes a los que el usuario pretendía. Otros riesgos principales incluyen fuga de credenciales, agencia excesiva (agentes realizando acciones más allá de su alcance) y vulnerabilidades de cadena de suministro (herramientas o plugins maliciosos). OpenLegion aborda esto a través de credenciales guardadas en bóveda, ejecuciones de tarea en sandbox, matrices de permisos y coordinación por objetivos y tareas (objetivos → tareas → agentes).

### ¿Cómo se compara OpenLegion con OpenClaw en seguridad?

Basado en documentación pública, OpenLegion proporciona configuraciones de seguridad más estrictas. El despliegue local por defecto de OpenClaw requiere el montaje del socket Docker (concediendo amplio acceso al anfitrión), su analizador de seguridad ha reportado problemas con activación consistente y almacena credenciales en configuración accesible al proceso del agente. OpenLegion ejecuta cada tarea en una ejecución en sandbox, guarda las credenciales en una bóveda inyectada fuera del modelo, aplica presupuestos por agente y aplica saneamiento Unicode en múltiples puntos de control. Para una comparativa detallada, consulte [OpenLegion vs OpenClaw](/comparison/openclaw).

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
