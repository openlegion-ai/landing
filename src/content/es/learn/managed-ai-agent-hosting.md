---
title: "Alojamiento Gestionado de Agentes de IA: Flotas Seguras"
description: >-
  Alojamiento gestionado de agentes de IA de OpenLegion: ejecute equipos
  seguros en una app web alojada, con credenciales en bóveda, presupuestos por
  agente y sin VPS dedicado.
slug: /learn/managed-ai-agent-hosting
primary_keyword: alojamiento gestionado de agentes de ia
secondary_keywords:
  - host ai agents
  - managed ai agent platform
  - hosted ai agents
  - ai agent hosting service
  - dedicated vps for ai agents
  - ai agent infrastructure
  - cloud ai agent hosting
  - secure ai agent hosting
date_published: 2026-05
last_updated: 2026-05
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-orchestration
  - /comparison
---

# Alojamiento Gestionado de Agentes de IA para Flotas Seguras

Quería una fuerza de trabajo de IA. Lo que obtuvo fue un segundo empleo en DevOps. El alojamiento gestionado de agentes de IA le devuelve ese empleo. Ejecuta los servidores, el aislamiento, la bóveda de credenciales y los presupuestos que sus agentes necesitan, así que usted no aprovisiona nada de eso. OpenLegion es una app web alojada: inicia sesión con Google y empieza, sin nada que instalar y sin VPS dedicado que alquilar, con sus claves en una bóveda que los agentes nunca tocan y un presupuesto en cada agente de forma predeterminada. Usted aporta un objetivo; nosotros operamos el suelo por debajo.

<!-- SCHEMA: DefinitionBlock -->

> **¿Qué es el alojamiento gestionado de agentes de IA?**
> El alojamiento gestionado de agentes de IA es un servicio que aprovisiona, aísla, asegura y opera la infraestructura sobre la que corren los agentes de IA autónomos: contenedores, almacenamiento de credenciales, presupuestos, redes y un panel de control, de modo que un equipo puede desplegar flotas de agentes sin construir ni mantener esa infraestructura por sí mismo.

## TL;DR

- El alojamiento gestionado de agentes de IA elimina el trabajo entre usted y una flota en marcha: sin configuración de servidores, sin ajuste de Docker, sin bóveda que operar.
- Los agentes son registros duraderos, no servidores: crear uno es instantáneo, un agente inactivo no cuesta nada y un espacio de trabajo puede ejecutar cientos.
- Las credenciales viven en una bóveda y se inyectan fuera del modelo, que solo llega a retener un identificador, de modo que un agente comprometido no puede leerlas.
- Cada agente lleva su propio presupuesto, y cada unidad de trabajo es un despertar registrado medido en créditos a $0.001 cada uno.
- El motor se publica con código disponible bajo la PolyForm Perimeter License 1.0.1; la plataforma alojada es propietaria.
- Gratis son 0$ con 1.000 créditos de una vez y sin tarjeta; Pro son 29$/mes con 10.000 créditos; Team son 99$/mes con 35.000.

## El Coste Oculto de "Solo Ejecuta un Agente"

Levantar un agente es un fin de semana. Ejecutar una flota en la que pueda confiar es un trimestre.

En algún punto entre el prototipo y la producción, el trabajo cambia de forma silenciosamente. Deja de ajustar prompts y empieza a ajustar contenedores. Deja de pensar en lo que el agente debería decir y empieza a pensar en dónde viven sus claves API, qué pasa cuando uno entra en bucle a las 3 de la madrugada y cómo evitar que un agente comprometido alcance a los otros nueve. Nada de eso es el trabajo que se propuso hacer. Todo eso es el trabajo que determina si los agentes son seguros de dejar en marcha.

El alojamiento gestionado existe para absorber exactamente esa capa. Con la oferta alojada de OpenLegion obtiene:

- **Una app web alojada** sin nada que instalar y sin VPS dedicado que alquilar: inicia sesión con Google y empieza.
- **Una ejecución en sandbox para cada tarea**: cada tarea corre bajo demanda y luego se detiene, y el código que el agente escribe no tiene acceso a red por defecto.
- **Una bóveda de credenciales** que mantiene las claves API y los tokens OAuth enteramente fuera del modelo, que solo llega a retener un identificador.
- **Aplicación de presupuesto por agente** con cortes estrictos, así que un agente en bucle no puede generar una factura sorpresa.
- **Un panel de control** para desplegar plantillas, chatear con agentes, observar coste y salud en vivo, y pausar cualquier cosa que se comporte mal.
- **Créditos incluidos** en cada plan, renovados mensualmente, con modelos elegidos por preset: Smartest, Smart o Normal.

## Alojamiento Gestionado vs Autoalojamiento: Cómo Elegir

La plataforma de OpenLegion es solo alojada, y el motor por debajo se publica con código disponible. La comparación de abajo es la compensación general entre operar usted mismo la infraestructura de agentes y que se la operen.

| Consideración | Autoalojado (PolyForm Perimeter License 1.0.1) | Alojamiento gestionado |
|---|---|---|
| Quién opera los servidores | Usted | OpenLegion |
| Tiempo de configuración | Tres comandos en su máquina | Inicie sesión con Google, nada que instalar |
| Bóveda de credenciales | Usted la opera | Operada por nosotros, fuera del modelo |
| Actualizaciones y parcheo | Usted hace pull y redespliega | Aplicadas por usted |
| Residencia de datos | Totalmente en su infraestructura | En la plataforma alojada que operamos |
| Mejor para | Regulado, air-gapped, control total | Equipos que quieren un equipo en marcha hoy |
| Modelo de coste | Sus propios costes de servidor | Gratis 0$, Pro 29$/mes, Team 99$/mes |

Elija autoalojamiento cuando el cumplimiento, la residencia de datos o el control total sobre el anfitrión pesen más que el coste de operarlo. Elija alojamiento gestionado cuando quiera agentes trabajando esta tarde y prefiera no poseer una bóveda, un runtime y una cadencia de actualizaciones. OpenLegion ofrece solo la plataforma alojada en el lanzamiento, así que no hay plataforma autoalojada a la que pasar.

## Qué Pasa Cuando Pulsa Desplegar

Inicie sesión con Google y su espacio de trabajo está listo: no hay nada que aprovisionar. Con él se crea un asistente, que crea los compañeros de equipo que necesita. Desde ahí describe el equipo que quiere (una mesa de investigación, un pipeline de ventas, un estudio de contenido) y la plataforma crea cada rol como un registro duradero con su propia memoria, presupuesto y permisos de herramientas.

Los agentes se coordinan a través de la [capa de orquestación](/learn/ai-agent-orchestration): el trabajo se organiza objetivos → tareas → agentes, con despertares por evento y delegación entre compañeros. Cada acción es una intención verificada por un único motor de políticas antes de ocurrir, lo que mantiene el comportamiento auditable y los costes predecibles. Usted habla con los agentes en el chat web en todos los planes, por Telegram y webhooks desde Pro, o Slack y email entrante en Team y superiores.

## Seguridad Que No Tiene Que Construir

La parte más difícil de alojar agentes de forma segura es la parte que los equipos más a menudo se saltan, porque es invisible hasta que falla. El plano gestionado de OpenLegion aplica la misma defensa en profundidad descrita en el modelo de [seguridad de agentes de IA](/learn/ai-agent-security), habilitada de forma predeterminada:

- Una ejecución en sandbox para cada tarea, sin proceso de agente de larga vida que comprometer.
- Una bóveda de credenciales que las inyecta fuera del modelo, así que los agentes nunca tienen claves en bruto.
- Una matriz de permisos por agente que gobierna qué herramientas, archivos y operaciones puede usar cada agente.
- Saneamiento de entrada, protección SSRF y endurecimiento contra inyección de prompt en cada frontera.
- Topes de presupuesto por agente que fallan en cerrado.

Hereda esto al registrarse, no leyendo una guía de endurecimiento e implementándola usted mismo. Para el runtime por debajo, consulte la visión general de la [plataforma de agentes de IA](/learn/ai-agent-platform).

## Precios y Por Qué Paga

Gratis son 0$ con 1.000 créditos de una vez y sin tarjeta; Pro son 29$/mes con 10.000 créditos; Team son 99$/mes con 35.000; Enterprise empieza en 1.500$. El trabajo se mide en créditos a $0.001 cada uno, y el coste exacto de cada tarea es visible. Los créditos incluidos se renuevan mensualmente; los packs de créditos que compre nunca caducan. La facturación corre sobre Stripe, y una página de garantía de devolución expone los términos. Compare los límites de los planes en la [página de precios](/pricing).

## La Perspectiva de OpenLegion

La mayoría del "alojamiento de agentes de IA" en el mercado es un proceso compartido que ejecuta los agentes de todos, con las claves en la configuración y sin aplicación de presupuesto real. Eso está bien para una demo y es peligroso en producción, porque los modos de fallo que de verdad le cuestan (una credencial filtrada, un bucle de coste descontrolado, un agente comprometido alcanzando a otro inquilino) son justo los que la infraestructura compartida empeora. El alojamiento gestionado solo vale la pena pagarlo si le compra el aislamiento y la seguridad de credenciales que de otro modo tendría que construir a mano. Nuestra postura es que esas garantías deberían ser lo predeterminado en lugar de un nivel al que actualizar, de modo que todos los planes reciben el mismo aislamiento, la misma bóveda y el mismo motor de políticas delante de cada acción.

## CTA

**Despliegue un equipo de agentes seguro sin operar la infraestructura.**
[Empezar](https://app.openlegion.ai) | [Ver precios](/pricing) | [Leer la documentación](https://docs.openlegion.ai)

---

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué es el alojamiento gestionado de agentes de IA?

El alojamiento gestionado de agentes de IA es un servicio que aprovisiona y opera la infraestructura que los agentes de IA autónomos necesitan (contenedores aislados, una bóveda de credenciales, aplicación de presupuesto, redes y un panel de control) de modo que un equipo puede desplegar y ejecutar flotas de agentes sin construir ni mantener esa infraestructura. Con OpenLegion inicia sesión con Google y empieza: no hay nada que instalar ni VPS dedicado que alquilar.

### ¿En qué se diferencia el alojamiento gestionado del autoalojamiento de OpenLegion?

OpenLegion es una app web alojada, y no hay plataforma autoalojada en el lanzamiento. Autoalojar en general significa que usted opera los servidores, opera la bóveda y aplica las actualizaciones usted mismo, lo que conviene a entornos regulados o air-gapped. El alojamiento gestionado significa que OpenLegion opera la plataforma, opera la bóveda y la parchea por usted. El motor por debajo se publica con código disponible bajo la PolyForm Perimeter License 1.0.1; la plataforma alojada es propietaria.

### ¿Es seguro alojar agentes de IA que tienen mis claves API y de cartera?

Sí, cuando las claves nunca viven dentro del agente. En OpenLegion, las claves API y los tokens OAuth se mantienen en una bóveda y se inyectan fuera del modelo, que solo llega a retener un identificador, de modo que ni siquiera un agente totalmente comprometido puede leer ni exfiltrar el secreto. OpenLegion no custodia claves de cartera ni fondos de agentes.

### ¿Cuánto cuesta el alojamiento gestionado de agentes de IA?

Gratis son 0$ con 1.000 créditos de una vez y sin tarjeta; Pro son 29$/mes con 10.000 créditos; Team son 99$/mes con 35.000; Enterprise empieza en 1.500$. La tarifa cubre la plataforma alojada, la bóveda de credenciales, el panel y los créditos incluidos del plan: no hay VPS dedicado que pagar. El trabajo se mide en créditos a $0.001 cada uno, los créditos incluidos se renuevan mensualmente y los packs que compre nunca caducan.

### ¿Necesito saber Docker o DevOps para usar el alojamiento gestionado?

No. OpenLegion es una app web alojada: inicia sesión con Google y empieza, no hay nada que instalar. Usted trabaja a través de un panel: describe el equipo que quiere y el asistente crea los compañeros que necesita. Docker, Python y la administración de servidores no forman parte de ello en absoluto.

### ¿Puedo pasar del alojamiento gestionado al autoalojado más tarde?

En el lanzamiento, no. La plataforma alojada es hoy la única forma de ejecutar OpenLegion, y es propietaria; el motor por debajo se publica con código disponible bajo la PolyForm Perimeter License 1.0.1. Todavía no hay una distribución autoalojada a la que migrar, así que cuente con la plataforma alojada por ahora.

### ¿Cuántos agentes puedo alojar en un plan gestionado?

Los límites de agentes escalan con el nivel del plan, desde un equipo pequeño en el plan de entrada hasta equipos grandes en niveles superiores, con límites personalizados para empresas. Los agentes son registros duraderos en lugar de servidores, así que crear uno es instantáneo y un agente inactivo no cuesta nada: cada agente cuenta como uno para el límite, así que un equipo de tres roles como un Dev Team cuenta como tres agentes.
