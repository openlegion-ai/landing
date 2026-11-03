---
title: "Plataforma de Agentes de IA — Despliegue Agentes Seguros"
description: >-
  OpenLegion es una plataforma gestionada de agentes de IA con ejecuciones de
  tarea en sandbox, bóveda de credenciales y presupuestos por agente. Nada que
  instalar.
slug: /learn/ai-agent-platform
primary_keyword: plataforma de agentes de ia
secondary_keywords:
  - managed ai agent platform
  - self-hosted agent deployment
  - ai agent cost control
  - ai agent credential security
  - production ai agent infrastructure
date_published: 2026-03
last_updated: 2026-03
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-orchestration
  - /learn/ai-agent-security
  - /learn/ai-agent-frameworks
  - /comparison
---

# La Plataforma de Agentes de IA Construida para Producción

La mayoría de equipos empiezan con un framework. Ensamblan nodos de LangGraph o crews de CrewAI, ponen una demo a funcionar y luego chocan con un muro: ¿quién gestiona los contenedores? ¿Dónde van las claves API? ¿Qué impide que un agente descontrolado queme 500$ en tokens de la noche a la mañana?

Una **plataforma de agentes de IA** responde a esas preguntas antes de que escriba su primer agente. OpenLegion es una plataforma gestionada de agentes de IA que viene con ejecuciones de tarea en sandbox, credenciales guardadas en bóveda, presupuestos de créditos por agente y coordinación por objetivos y tareas (objetivos → tareas → agentes) — todo habilitado por defecto. Es una app web alojada: inicia sesión con Google y empieza. No hay nada que instalar.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es una plataforma de agentes de IA?**
> Una plataforma de agentes de IA es infraestructura gestionada para desplegar, orquestar y gobernar agentes de IA autónomos en producción. A diferencia de los frameworks crudos, una plataforma maneja aislamiento, gestión de credenciales, controles de coste y observabilidad de modo que los equipos despliegan agentes sin construir DevOps desde cero.

## TL;DR

- **Plataforma, no framework** — OpenLegion gestiona ejecuciones, credenciales, presupuestos y aprobaciones. Usted gestiona la lógica del agente.
- **Credenciales guardadas en bóveda** — Las credenciales se inyectan fuera del modelo, que solo llega a retener un identificador. Los agentes nunca ven las claves en bruto.
- **Una ejecución en sandbox por tarea** — Cada tarea corre bajo demanda y luego se detiene, así que no hay proceso de agente de larga vida que comprometer, y el código que el agente escribe corre sin acceso a red por defecto.
- **Aplicación de presupuesto por agente** — Cada agente lleva su propio presupuesto de créditos, medido a $0.001 el crédito, con corte automático estricto. Sin facturas sorpresa.
- **Presets de modelo** — Elija Smartest, Smart o Normal por agente o por espacio de trabajo. Nunca conecta un proveedor ni rota una clave.
- **Coordinación auditable por objetivos y tareas** — El trabajo se organiza objetivos → tareas → agentes, con un asistente que crea los compañeros que necesita. Sin "agente CEO" tomando decisiones opacas.
- **Conjunto de herramientas integrado** — Búsqueda y recuperación web, archivos, memoria a largo plazo, horarios, ejecución de código en sandbox y entregables compartibles. Disponibles para cada agente.
- **Memoria persistente del agente** — Los agentes recuerdan entre sesiones con búsqueda vectorial, archivos de workspace y aprendizajes de errores. Contexto gestionado automáticamente.

## Gestionado vs Autoalojado: Cuándo Tiene Sentido Cada Uno

La distinción entre frameworks de agentes de IA y plataformas de agentes de IA importa más en el momento del despliegue. Un framework le da los bloques de construcción — definiciones de agentes, integraciones de herramientas, patrones de conversación. Una plataforma le da la capa de producción: dónde corren los agentes, cómo acceden a credenciales, qué les impide salirse de los rieles.

**Frameworks autoalojados** (LangGraph, CrewAI, AutoGen) le dan el máximo control. Usted posee la infraestructura. Configura los contenedores. Construye el pipeline de credenciales. Esto funciona cuando su equipo tiene capacidad dedicada de DevOps e infraestructura existente con la que los agentes necesitan integrarse profundamente.

**Las plataformas gestionadas de agentes de IA** manejan la capa operativa para que su equipo se centre en la lógica del agente. OpenLegion se sitúa aquí — pero con una diferencia crítica: el motor que hay debajo se publica con código disponible bajo PolyForm Perimeter License 1.0.1. Obtiene operaciones de grado plataforma (aislamiento de la ejecución, bóveda, controles de presupuesto) sin una caja negra debajo.

La cuestión no es cuál es "mejor". Es si su equipo debería gastar horas de ingeniería en infraestructura de seguridad de agentes o en los agentes mismos.

### Cuándo tiene sentido autoalojarse

- Tiene requisitos estrictos de residencia de datos que excluyen cualquier servicio gestionado
- Sus agentes necesitan integración profunda con infraestructura on-prem existente
- Su equipo ya opera clústeres de Kubernetes y tiene prácticas maduras de DevOps
- Necesita personalizar el entorno de runtime a un nivel que las plataformas gestionadas no exponen

### Cuándo tiene sentido una plataforma gestionada de agentes de IA

- Necesita agentes en producción en días, no en meses
- Su equipo tiene de 1 a 5 ingenieros y no puede dedicar headcount a infraestructura
- Necesita garantías de [seguridad de agentes de IA](/learn/ai-agent-security) sin construirlas usted mismo
- Quiere controles de coste y trazas de petición sin instrumentar todo manualmente

## El Sistema de Presets de Modelo — Por Qué Importa

La mayoría de las plataformas de IA gestionadas hacen de la elección de modelo su problema: elija un proveedor, conecte una clave, rótela, reajuste cuando cambie. Esto crea dos problemas: opacidad de coste y lock-in con proveedor.

OpenLegion toma un enfoque diferente. Los modelos se eligen por preset — Smartest, Smart o Normal — por agente o por espacio de trabajo, así que no hay proveedor que conectar ni clave que rotar. El trabajo se mide en créditos a $0.001 cada uno, y el coste exacto de cada tarea es visible en la app.

Esto importa por tres razones:

**Transparencia de coste.** Ve exactamente lo que cada agente gasta y lo que costó cada tarea. Cada unidad de trabajo es un despertar registrado con un precio, no una línea en una factura mensual.

**Flexibilidad de modelo.** Intercambie presets por agente. Ejecute Smartest para razonamiento complejo, Smart para el trabajo diario y Normal para clasificación de alto volumen — todo en el mismo espacio de trabajo, gestionado desde el mismo panel.

**Sin lock-in.** Si deja OpenLegion, puede exportar el espacio de trabajo — agentes, tareas, recibos y entregables — y borrar lo que quede. No hay una capa de modelo propietaria de la que migrar.

## Para Quién Es

### Desarrolladores en solitario construyendo productos con agentes

Está enviando un producto impulsado por agentes y necesita que sea seguro desde el primer día. OpenLegion le da infraestructura de producción — ejecuciones en sandbox, bóveda de credenciales, controles de coste — sin contratar un equipo de DevOps. Describa el resultado que quiere y el asistente crea los compañeros de equipo que hacen falta para llegar.

### Equipos de startup enviando rápido

Su equipo tiene de 2 a 10 ingenieros. Necesita agentes en producción este sprint, no el próximo trimestre. No hay instalación: OpenLegion es una app web alojada y usted inicia sesión con Google. Gratis son 0$ con 1.000 créditos de una vez y sin tarjeta, así que su primer agente estará trabajando minutos después de registrarse.

### Equipos de seguridad empresariales

Necesita traza de peticiones y observabilidad de flujo, aislamiento de credenciales que sobreviva a un agente comprometido y controles de presupuesto que prevengan costes descontrolados. La arquitectura de OpenLegion está diseñada para entornos que requieren defensa en profundidad. La coordinación auditable por objetivos y tareas significa que cada paso de flujo es explícito y trazable — sin toma de decisiones opaca del LLM en el plano de control. Consulte nuestra página de [seguridad de agentes de IA](/learn/ai-agent-security) para el modelo de amenazas completo.

## Preparación para Producción: Qué Maneja OpenLegion vs DIY

| Capacidad | DIY (Solo Framework) | OpenLegion |
|---|---|---|
| **Runtime de agente** | Usted configura Docker, gestiona imágenes, maneja la red | Los agentes son registros duraderos, no servidores; cada tarea corre bajo demanda en un sandbox y luego se detiene |
| **Gestión de credenciales** | Variables de entorno o integración de bóveda personalizada | Credenciales en bóveda inyectadas fuera del modelo — los agentes nunca ven las claves en bruto |
| **Controles de coste** | Seguimiento manual, sin límites estrictos | Presupuestos de créditos por agente a $0.001 el crédito, con corte automático |
| **Orquestación** | Codifique su propia lógica de enrutamiento o use enrutamiento basado en LLM | Coordinación por objetivos y tareas (objetivos → tareas → agentes) — auditable |
| **Observabilidad** | Integrar LangSmith, Datadog o logging personalizado | Panel integrado con streaming en vivo, gráficos de coste, trazas de petición |
| **Despliegue multi-canal** | Construir integraciones por canal | Chat web en todos los planes, Telegram y webhooks desde Pro, Slack y email entrante en Team y superiores |
| **Automatización de navegador** | Configurar Playwright/Puppeteer, gestionar instancias Chrome | No se ofrece en el lanzamiento — los agentes leen la web en vivo con búsqueda y recuperación integradas |
| **Extensibilidad de herramientas** | Construir integraciones personalizadas o usar herramientas LangChain | Integrada — búsqueda y recuperación web, archivos, memoria, horarios, ejecución de código en sandbox, entregables compartibles |
| **Memoria del agente** | Construir RAG o gestión de estado personalizada | Memoria vectorial persistente por agente con gestión automática de contexto |
| **Failover de modelos** | Lógica de reintento personalizada por proveedor | Lo gestiona la plataforma — elija un preset y ella enruta por usted |

El resumen: si está evaluando [frameworks de agentes de IA](/learn/ai-agent-frameworks) y se encuentra construyendo más infraestructura que lógica de agente, está resolviendo un problema de plataforma con herramientas de framework. OpenLegion maneja la capa de plataforma para que pueda centrarse en lo que sus agentes hacen realmente.

## Extensibilidad de Herramientas Integrada

OpenLegion entrega sus herramientas con la plataforma en lugar de pedirle que conecte servidores. Cada agente tiene búsqueda y recuperación web, manejo de archivos, memoria a largo plazo, horarios, ejecución de código en sandbox y entregables compartibles desde el momento en que se crea. Los conectores en el lanzamiento son Google Calendar y los archivos de Google Drive que usted elija; el Model Context Protocol (MCP) no está soportado en el lanzamiento.

Las herramientas integradas significan que un agente es útil en el momento en que lo crea, sin nada que instalar ni configurar. Cada llamada a herramienta es una intención verificada por un único motor de políticas antes de ocurrir, así que los agentes se mantienen dentro de sus límites de permisos y cada llamada queda registrada como un recibo.

## Memoria Persistente del Agente

Los agentes en OpenLegion mantienen memoria entre sesiones usando búsqueda vectorial, archivos de workspace y aprendizajes de errores. Cuando un agente encuentra un problema y lo resuelve, la solución se almacena y se recupera en sesiones futuras — reduciendo fallos repetidos y mejorando la calidad de ejecución a lo largo del tiempo.

La memoria está limitada por agente y aislada de cualquier otro agente y de cualquier otro espacio de trabajo. La gestión automática de contexto mantiene el uso de tokens eficiente exponiendo solo memorias relevantes para la tarea actual, en lugar de cargar historiales completos de conversación.

## Arquitectura: Un Único Motor de Políticas Delante de Cada Acción

OpenLegion separa cada espacio de trabajo en cuatro límites de confianza más un nivel de decisión del propietario:

**Entrada externa no confiable.** Cualquier cosa que llegue de usuarios o terceros: chat web, Telegram, Slack, email entrante y endpoints webhook. Todas las entradas se validan y sanean vía guardas de inyección de prompt antes de llegar al motor de políticas.

**La ejecución del agente (no confiable).** Cada tarea corre bajo demanda y luego se detiene, y el código que el agente escribe corre en un sandbox sin acceso a red por defecto. Incluso una ejecución totalmente comprometida no puede acceder a sus credenciales, a los datos de otros agentes ni a otro espacio de trabajo.

**El motor de políticas (confiable).** Una sola capa verifica cada acción como una intención antes de que ocurra y la registra como un recibo que el propietario puede leer: llamada a herramienta, delegación, aprobación, coste. Contiene el registro compartido de objetivos y tareas, la bóveda de credenciales, la matriz de permisos y el presupuesto de créditos de cada agente. Este es el cerebro — y es el único componente que toca sus credenciales.

**Decisiones de propietario o administrador.** El trabajo se detiene para una aprobación en tres muros solamente: alcanzar a un tercero en su nombre, borrar datos y actuar sobre contenido no confiable. La decisión la toma en la app un propietario o un administrador, nunca un agente.

**Plano de control solo interno.** El nivel más restringido: operaciones administrativas como crear agentes, conceder permisos de herramienta y cambiar de plan, alcanzadas a través de una única API de administración delimitada a un solo espacio de trabajo.

Esta arquitectura significa que la [orquestación de agentes de IA](/learn/ai-agent-orchestration) y la seguridad no son preocupaciones separadas — son el mismo sistema.

## Empezar

```text
1. Inicia sesión con Google en app.openlegion.ai — no hay nada que instalar.
2. Dile al asistente lo que quieres hacer; él crea los agentes que necesita.
3. Aprueba la primera acción que alcance a un tercero y luego lee los recibos.
```

Gratis son 0$ con 1.000 créditos de una vez y sin tarjeta. Pro son 29$/mes con 10.000.

## CTA

**¿Listo para desplegar agentes seguros?**
[Empezar](https://app.openlegion.ai) | [Leer la documentación](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué es una plataforma de agentes de IA?

Una plataforma de agentes de IA es infraestructura gestionada que maneja las preocupaciones operativas de ejecutar agentes de IA autónomos: aislamiento por contenedor, gestión de credenciales, controles de coste, orquestación y observabilidad. Se sitúa por encima de frameworks como LangGraph o CrewAI y proporciona la capa de producción que los frameworks le dejan a usted.

### ¿Cuál es la mejor plataforma de agentes de IA para producción?

La mejor plataforma de agentes de IA para producción depende de sus requisitos de seguridad y operativos. Si necesita aislamiento de la ejecución integrado, credenciales guardadas en bóveda y controles de presupuesto por agente sin construir infraestructura personalizada, OpenLegion proporciona esto de fábrica. Para equipos profundamente invertidos en el ecosistema Microsoft, Azure AI Agent Service vale la pena evaluar. Para máxima flexibilidad con más esfuerzo DIY, autoalojar LangGraph con LangSmith ofrece observabilidad fuerte.

### ¿Qué es una plataforma empresarial de agentes de IA?

Una plataforma empresarial de agentes de IA añade gobernanza, cumplimiento y controles de seguridad encima de la orquestación básica de agentes. Los requisitos clave incluyen: aislamiento de credenciales (los agentes nunca deberían ver claves API en bruto), trazabilidad de flujo, aplicación de presupuesto para prevenir costes descontrolados, control de acceso basado en roles y opciones de despliegue que soporten requisitos de residencia de datos. La arquitectura de OpenLegion está diseñada para entornos que requieren estos controles.

### ¿Puedo alojar agentes de IA con mis propias claves API?

No, y no hace falta. El acceso a modelos está incluido: elija un preset — Smartest, Smart o Normal — por agente o por espacio de trabajo, y OpenLegion se encarga del proveedor. El trabajo se mide en créditos a $0.001 cada uno, así que ve el coste exacto de cada tarea. Gratis son 0$ con 1.000 créditos de una vez y sin tarjeta.

### Agentes de IA gestionados vs autoalojados: ¿cuál es la diferencia?

Las plataformas gestionadas de agentes de IA manejan el aprovisionamiento, la bóveda de credenciales, los controles de coste y la observabilidad por usted. Autoalojado significa que despliega un framework (LangGraph, CrewAI, AutoGen) en su propia infraestructura y construye estas capas operativas usted mismo. Gestionado es más rápido a producción y requiere menos inversión en DevOps. Autoalojado da máximo control de infraestructura. OpenLegion es gestionada: inicia sesión con Google y empieza, y el motor por debajo se publica con código disponible bajo PolyForm Perimeter License 1.0.1.

### ¿Cómo se compara OpenLegion con otras plataformas de agentes de IA?

OpenLegion se diferencia en arquitectura security-first. Basado en documentación pública al momento de escribir, ningún otro [framework de agentes de IA](/learn/ai-agent-frameworks) importante proporciona credenciales guardadas en bóveda integradas, una ejecución en sandbox para cada tarea o aplicación de presupuesto por agente nativa. Consulte nuestra [comparativa de frameworks](/learn/ai-agent-frameworks) para un desglose detallado a través de OpenClaw, LangGraph, CrewAI, AutoGen y Semantic Kernel.

### ¿Qué licencia usa OpenLegion?

El motor de OpenLegion se publica con código disponible bajo la licencia PolyForm Perimeter License 1.0.1 en [GitHub](https://github.com/openlegion-ai/openlegion). La plataforma alojada es propietaria, y es donde los equipos ejecutan agentes sin gestionar ninguna infraestructura.

### ¿Qué tan rápido puedo desplegar mi primer agente?

Minutos, sin nada que instalar. Inicie sesión con Google, dígale al asistente lo que quiere hacer y él creará los agentes que necesita. Gratis son 0$ con 1.000 créditos de una vez y sin tarjeta, así que nada se interpone entre iniciar sesión y su primera tarea.

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
