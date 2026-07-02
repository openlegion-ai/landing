---
title: "Agent as a Service: precios, aislamiento de inquilinos y AaaS vs autoalojado"
description: "Agent as a Service (AaaS): agentes de IA en infraestructura gestionada con precios por consumo. Cubre AWS Bedrock Agents, OpenAI Operator, CVE-2024-5184 y TCO comparado."
slug: /learn/agent-as-a-service
primary_keyword: agent as a service
last_updated: "2026-07-02"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-deployment
  - /learn/ai-agent-platform
  - /learn/ai-agent-security
  - /learn/ai-agent-multi-tenancy
  - /learn/credential-management-ai-agents
  - /learn/llm-cost-optimization
---

# Agent as a Service: modelos de precios, aislamiento de inquilinos y marco de decisión AaaS

Agent as a Service (AaaS) es un modelo de entrega comercial en el que los agentes de IA se ejecutan en la infraestructura gestionada de un proveedor, manejando orquestación, ejecución de herramientas, memoria y gestión de credenciales, facturado por token, por acción o por hora de agente en lugar de requerir que los clientes desplieguen su propio entorno de ejecución. AaaS se consolidó como categoría de compra empresarial en 2026: OpenAI Operator se lanzó en enero de 2025, Google Agent Space alcanzó disponibilidad general y AWS Bedrock Agents escaló a uso empresarial, llevando el volumen de búsqueda de 90/mes en junio de 2025 a 260-390/mes en el T1 2026, CPC $32,88.

<!-- SCHEMA: DefinitionBlock -->

> **Agent as a Service (AaaS)** es un modelo de entrega comercial en el que los agentes de IA se ejecutan en la infraestructura gestionada de un proveedor, manejando orquestación, ejecución de herramientas, memoria y gestión de credenciales, y se facturan al cliente de forma basada en el consumo (por token de entrada, por acción ejecutada o por hora de agente) sin requerir que el cliente despliegue y opere su propio entorno de ejecución de agentes.

## Qué significa Agent as a Service: las tres promesas de la plataforma

Cada plataforma AaaS hace tres afirmaciones. Entender cuáles se cumplen bien y cuáles son marketing ayuda a los compradores a evaluar proveedores antes de comprometer presupuesto de infraestructura.

### Promesa 1: Infraestructura gestionada (sin entorno de ejecución que operar)

AaaS descarga toda la pila de ejecución del agente al proveedor: motor de orquestación, entorno de ejecución de herramientas, backends de memoria, pipeline de observabilidad, escalado horizontal y SLA de tiempo de actividad. El cliente define el agente -- prompt del sistema, herramientas y configuración de memoria -- y lo invoca. El proveedor lo ejecuta.

Este es el mismo compromiso que cualquier servicio gestionado: RDS frente a Postgres autogestionado, Lambda frente a contenedores autogestionados. Se renuncia a la configurabilidad y potencialmente se paga una prima, a cambio de no asumir la carga operativa. La promesa de infraestructura gestionada está bien cumplida por AWS Bedrock Agents, Google Agent Space y la mayoría de las plataformas AaaS maduras.

La promesa se rompe cuando el cliente necesita una configuración de entorno de ejecución que la plataforma no expone: entornos de ejecución de herramientas personalizados, backends de memoria no estándar, versiones de modelos específicas o lógica de bucle de agente diferente del modelo de orquestación fijo de la plataforma.

Para detalles de la capa de infraestructura, consulte [infraestructura de despliegue y opciones de alojamiento para agentes de IA](/learn/ai-agent-deployment).

### Promesa 2: Precios por consumo (pagar por token, acción u hora)

Los precios de AaaS en 2026 han convergido en tres estructuras:

**Tarifa de orquestación por token sobre el costo del modelo.** La plataforma cobra por su capa de orquestación por separado del LLM subyacente. AWS Bedrock Agents: $0,000025 por token de entrada procesado por la capa de orquestación, cobrado sobre la tarifa LLM estándar. Para Claude 3.5 Sonnet en Bedrock ($3,00/M tokens de entrada), la tarifa de orquestación añade $0,025/M tokens de entrada, menos del 1% de sobrecosto. Para modelos más baratos como Amazon Titan Text a $0,30/M, la tarifa de orquestación representa un sobrecosto del 8,33%.

**Tarifa por acción para integraciones de herramientas.** Consultas de AWS Bedrock Knowledge Base: $0,0004/consulta. Un agente que realiza 50 búsquedas KB por sesión paga $0,02/sesión en tarifas KB. A 100.000 consultas KB/día: $40/día solo en tarifas de acción.

**Niveles de suscripción por hora de agente.** Algunas plataformas ofrecen niveles donde cada agente activo cuenta contra las horas incluidas. Este modelo proporciona previsibilidad de costos para flotas de agentes estables pero puede ser ineficiente para cargas de trabajo irregulares.

Los precios por consumo alinean los incentivos del proveedor con el uso del cliente pero crean imprevisibilidad de costos para agentes de larga duración. Un bucle de agente descontrolado genera cargos tanto en la capa de orquestación como en la capa del modelo.

Para estrategias de reducción de costos, consulte [optimización de costos LLM y estrategias de presupuesto de tokens para flotas de agentes](/learn/llm-cost-optimization).

### Promesa 3: Aislamiento de credenciales (las credenciales nunca están en el contexto del agente)

El aislamiento de credenciales es el primitivo de seguridad de AaaS que distingue una plataforma gestionada del código de agente ejecutándose en una VM cloud con claves API en variables de entorno. Las credenciales se inyectan del lado del servidor en el momento de la ejecución y nunca aparecen en la ventana de contexto del agente, en archivos de registro o en parámetros de llamada de herramienta.

CVE-2024-5184 (Palo Alto Unit 42, junio 2024, CVSS 9,1 CRÍTICO) demostró que la inyección de prompts a través de la respuesta de herramientas puede hacer que un agente exfiltre su propia ventana de contexto. Si las claves API están en la ventana de contexto, son exfiltrables a través de este vector.

La pregunta diagnóstica a hacer a cada proveedor AaaS: **"Si la ventana de contexto completa de mi agente es extraída por un atacante mediante inyección de prompts, ¿qué credenciales están en riesgo?"** La respuesta correcta es: ninguna.

- **AWS Bedrock Agents**: asunción de rol IAM por invocación; el agente se ejecuta bajo un token de rol IAM temporal y nunca tiene claves de API sin procesar
- **OpenLegion**: resolución de handle `$CRED{}` en Zona 2; el código del agente referencia una credencial por nombre; Zona 2 resuelve el valor real en el momento de la ejecución sin devolverlo al agente

Para el patrón de proxy de vault y la arquitectura de handle `$CRED{}`, consulte [gestión de credenciales y alcance de clave API por inquilino para agentes de IA](/learn/credential-management-ai-agents).

## El panorama de proveedores AaaS en 2026

### AWS Bedrock Agents: AaaS empresarial con aislamiento IAM

AWS Bedrock Agents es la plataforma AaaS empresarial dominante por alcance de mercado. Los agentes se definen mediante la consola o API de Bedrock, con grupos de acciones y bases de conocimiento.

**Precios (2026):**
- Capa de orquestación: $0,000025/token de entrada
- Costo del modelo: tarifas Bedrock estándar (Claude 3.5 Sonnet: $3,00/M entrada, $15,00/M salida)
- Consultas Knowledge Base: $0,0004/consulta
- Code Interpreter: $0,000025/token de entrada

**Aislamiento de credenciales:** Asunción de rol IAM por invocación. Cada Bedrock Agent tiene un rol de ejecución IAM asignado. El agente nunca tiene credenciales sin procesar.

**Limitaciones:** Acoplamiento estrecho con servicios AWS. Lógica de bucle de agente personalizada no soportada. La tarifa de orquestación por token se acumula rápidamente para agentes con contextos extensos.

### OpenAI Operator: AaaS de consumidor para tareas de navegador

OpenAI Operator, lanzado en enero de 2025, es el primer producto AaaS de consumidor convencional. Ejecuta tareas web en una sesión de navegador aislada en nombre del usuario.

**Aislamiento de credenciales:** Sesión de navegador aislada por tarea. Las credenciales no se conservan entre tareas.

**Limitaciones:** Solo navegador, sin integraciones de herramientas personalizadas. Sin API de desarrollador para definiciones de agentes personalizadas.

### Google Agent Space: AaaS para empresas centradas en Workspace

Google Agent Space (lanzado en 2025, disponibilidad general en 2026) es la plataforma AaaS empresarial de Google para organizaciones estandarizadas en Google Workspace.

**Precios:** Mediante facturación por consumo de Google Cloud, vinculada a los costos de modelos de Vertex AI más tarifas de invocación de Cloud Run.

**Limitaciones:** Bloqueo en el ecosistema de Google Cloud. Menos flexible para integraciones multi-cloud. Opacidad de precios en múltiples dimensiones de facturación.

Para una comparación a nivel de características de plataformas AaaS, consulte [características de plataformas de agentes de IA y comparación de frameworks](/learn/ai-agent-platform).

## Precios AaaS: entendiendo el costo total

### La tarifa de capa de orquestación: el costo oculto

| **Modelo** | **Precio de entrada** | **Tarifa de orquestación** | **Orquestación % del costo del modelo** |
|---|---|---|---|
| Claude 3.5 Sonnet | $3,00/M | $0,025/M | 0,83% |
| Claude 3 Haiku | $0,25/M | $0,025/M | 10% |
| Amazon Titan Text | $0,30/M | $0,025/M | 8,33% |

### Tarifas por acción y el impuesto sobre agentes de larga duración

- **AWS Bedrock KB a 100.000 consultas/día**: $40/día = $1.200/mes
- **OpenSearch autoalojado en t3.medium** a 100.000 consultas/día: ~$0,16/día = $5/mes

El punto de cruce: las tarifas de acción AaaS superan el costo de infraestructura autoalojada a aproximadamente **12.500 consultas/día**.

### Costo de bucle descontrolado en AaaS: doble facturación

Los bucles de agente descontrolados cuestan más en AaaS que en despliegues autoalojados porque AaaS factura tanto el costo del modelo como la tarifa de capa de orquestación en cada iteración.

## Seguridad AaaS: aislamiento de credenciales y la prueba CVE-2024-5184

### La prueba CVE-2024-5184 para plataformas AaaS

CVE-2024-5184 (Palo Alto Unit 42, junio 2024, CVSS 9,1 CRÍTICO): inyección de prompts a través de la respuesta de API de herramienta.

**La prueba CVE-2024-5184**: "Si la ventana de contexto de mi agente es extraída por un atacante mediante inyección de prompts, ¿qué credenciales son accesibles?"

**Superado** (credenciales no en la ventana de contexto):
- AWS Bedrock Agents
- OpenLegion

**No superado** (credenciales accesibles):
- Cualquier plataforma donde el desarrollador haya colocado claves API en el prompt del sistema

### Aislamiento de prompts multi-inquilino

**Aislamiento a nivel de infraestructura (más fuerte):**
- AWS Bedrock Agents: roles IAM separados por inquilino
- Google Agent Space: aislamiento mediante límites de proyecto de Google Cloud
- OpenLegion: ACL de espacio de nombres de tablero por proyecto

**Aislamiento a nivel de prompt del sistema (más débil):** Falla cuando la inyección de prompts sobreescribe la instrucción del inquilino (OWASP LLM06:2023).

Para la arquitectura completa de alcance de credenciales por inquilino y ACL de espacio de nombres, consulte [arquitectura multi-inquilino de agentes de IA y aislamiento entre inquilinos](/learn/ai-agent-multi-tenancy).

### El modelo de responsabilidad compartida en AaaS

Errores comunes de clientes que crean brechas de seguridad:

1. Credenciales en prompts del sistema
2. Permisos de herramientas demasiado amplios
3. Sin alcance de herramientas por agente
4. Sin interrupción HITL para acciones irreversibles

## AaaS vs autoalojado: el marco de decisión

### Cuándo AaaS gana

AaaS es la mejor opción cuando:
- **Volumen bajo a medio**: tarifas de acción menores que los costos de infraestructura autoalojada (punto de cruce ~12.500 consultas/día)
- **Rapidez en llegar a producción**: AaaS elimina semanas de configuración de infraestructura
- **Herencia de cumplimiento**: plataformas AaaS certificadas SOC 2 Tipo II

### Cuándo gana el autoalojamiento

La infraestructura autoalojada es la opción correcta cuando:
- **El volumen supera el punto de cruce**: más de 50.000 acciones de agente/día
- **Requisitos de entorno de ejecución personalizados**: entornos de ejecución de herramientas no estándar
- **Requisitos de residencia de datos**: sectores regulados
- **El riesgo de bloqueo de proveedor es inaceptable**

### Costo total de propiedad

Comparación TCO para 100.000 acciones/día:

**AaaS (estilo AWS Bedrock):**
- Consultas KB: $1.200/mes
- Tarifas de orquestación: ~$300/mes
- Total: ~$1.500/mes + costos de modelos

**Autoalojado:**
- Clúster Kubernetes: $800/mes
- Almacén vectorial: $200/mes
- Stack de observabilidad: $150/mes
- Engineering: $2.400/mes
- Total: ~$3.550/mes + costos de modelos

## La perspectiva de OpenLegion: la seguridad AaaS es una cuestión de arquitectura de credenciales

Agent as a Service es la categoría de compra de IA empresarial de crecimiento más rápido en 2026, y también la categoría con la base de seguridad menos estandarizada.

**Aplicación arquitectónica**: las credenciales nunca entran en el código del agente o la ventana de contexto. Esta propiedad no puede ser eludida por un error del desarrollador.

**Aislamiento basado en convenciones**: los desarrolladores reciben instrucciones de no poner credenciales en los prompts del sistema. Se rompe bajo presión de tiempo, brechas de revisión de código y fallos de incorporación de desarrolladores.

Tres cifras concretas:
- **CVE-2024-5184 (CVSS 9,1 CRÍTICO, junio 2024)**
- **CPC $32,88** para "agent as a service" en T1-T2 2026
- **Crecimiento 4x interanual** en volumen de búsqueda de junio 2025 a principios de 2026

| **Control de seguridad** | **OpenLegion** | **AWS Bedrock Agents** | **Google Agent Space** | **OpenAI Operator** | **LangGraph (autoalojado)** |
|---|---|---|---|---|---|
| **Vault de credenciales con resolución de handle $CRED{}** | Zona 2, arquitectónico | Asunción de rol IAM | Alcance de cuenta de servicio | Aislamiento de sesión | Responsabilidad del desarrollador |
| **Límite de gasto diario por agente (capa de infraestructura)** | Zona 2, $0-$50/día | No disponible | No disponible | No disponible | Responsabilidad del desarrollador |
| **ACL de tablero por proyecto de inquilino** | Arquitectónico | Basado en IAM | Basado en proyecto | N/A | Responsabilidad del desarrollador |
| **Alcance de permisos de herramientas por agente** | Aplicado por el entorno de ejecución | IAM del grupo de acciones | Basado en IAM | N/A | Responsabilidad del desarrollador |
| **Registro de auditoría WORM por inquilino (SOC 2 CC6.1)** | Nativo | CloudTrail | Cloud Audit Logs | N/A | Responsabilidad del desarrollador |
| **Definición de agente en git** | INSTRUCTIONS.md | Consola/API | Consola/API | N/A | Responsabilidad del desarrollador |

[Empieza a construir en OpenLegion](https://app.openlegion.ai): despliega agentes con aislamiento arquitectónico de credenciales, límites de gasto diario por agente aplicados en Zona 2 y ACL de tablero que hacen que el acceso entre inquilinos sea arquitectónicamente imposible.

<!-- SCHEMA: FAQPage -->

## Preguntas frecuentes

### ¿Qué es Agent as a Service (AaaS)?

Agent as a Service (AaaS) es un modelo de entrega comercial en el que los agentes de IA se ejecutan en la infraestructura gestionada de un proveedor, manejando orquestación, ejecución de herramientas, memoria y gestión de credenciales, facturado al cliente de forma basada en el consumo. La categoría AaaS se consolidó en 2026 con el lanzamiento de OpenAI Operator (enero 2025), la disponibilidad general de Google Agent Space y AWS Bedrock Agents alcanzando escala empresarial. Cada plataforma AaaS hace tres promesas: infraestructura gestionada, precios por consumo y aislamiento de credenciales.

### ¿Cuánto cuesta Agent as a Service?

Los precios de AaaS tienen tres capas de costo: el costo del modelo LLM subyacente, una tarifa de capa de orquestación (AWS Bedrock Agents: $0,000025/token de entrada) y tarifas por acción para integraciones de herramientas (AWS Bedrock Knowledge Base: $0,0004/consulta). A 100.000 acciones de agente/día, las tarifas de plataforma AaaS típicamente alcanzan $1.500-$3.600/mes antes de los costos del modelo.

### ¿Qué es AWS Bedrock Agents y cómo se cobra?

AWS Bedrock Agents es la plataforma AaaS gestionada de Amazon con orquestación de agentes, grupos de acciones y bases de conocimiento en infraestructura gestionada de AWS con aislamiento de credenciales basado en roles IAM. Precios (2026): $0,000025 por token de entrada para la capa de orquestación; las consultas de Knowledge Base cuestan $0,0004 por consulta.

### ¿Qué fue OpenAI Operator y por qué importa para AaaS?

OpenAI Operator, lanzado en enero de 2025, es el primer producto AaaS de consumidor convencional: un agente de IA que ejecuta tareas web en una sesión de navegador aislada en nombre del usuario, cobrado por completitud de tarea. La importancia de Operator fue demostrar que los consumidores pagarán por la ejecución de tareas de agente como servicio, correlacionando directamente con el aumento 4x interanual en el volumen de búsqueda de "agent as a service" a principios de 2026.

### ¿Cómo funciona el aislamiento de credenciales en plataformas AaaS?

El aislamiento de credenciales significa que la plataforma nunca expone las claves API LLM, credenciales de base de datos o secretos de herramientas del cliente al código del agente. AWS Bedrock Agents lo logra mediante la asunción de roles IAM. OpenLegion usa la resolución de handle `$CRED{}` en Zona 2: el código del agente referencia una credencial por nombre; Zona 2 resuelve el valor real en el momento de la ejecución sin devolverlo al agente.

### ¿Qué riesgos de seguridad son específicos de las plataformas AaaS?

El principal riesgo específico de AaaS es la superficie de ataque ampliada para la inyección de prompts (CVE-2024-5184, CVSS 9,1 CRÍTICO): los agentes AaaS llaman a APIs externas y procesan contenido web externo en nombre de los inquilinos, y cualquiera de esas respuestas puede contener instrucciones elaboradas maliciosamente. El segundo riesgo es la fuga de prompts entre inquilinos con arquitectura de aislamiento débil. El tercer riesgo es la brecha de responsabilidad compartida.

### ¿Cuándo debo usar AaaS vs infraestructura autoalojada?

AaaS es la mejor opción para volumen bajo a medio, rapidez en llegar a producción o herencia de cumplimiento. El autoalojamiento gana a escala (más de 50.000 acciones/día), para requisitos de entorno de ejecución personalizados, regulaciones de residencia de datos o cuando el riesgo de bloqueo de proveedor es inaceptable. El cálculo TCO siempre debe incluir el tiempo de ingeniería para operar la infraestructura autoalojada.

### ¿Qué es el aislamiento de prompts multi-inquilino en AaaS?

El aislamiento de prompts multi-inquilino significa que el prompt del sistema, el historial de conversación, los resultados de herramientas y el estado de memoria del inquilino A nunca aparecen en el contexto del agente del inquilino B. Los mecanismos de aislamiento más fuertes son a nivel de infraestructura. El patrón más débil es el aislamiento a nivel de prompt del sistema, que falla cuando la inyección de prompts sobreescribe la instrucción del inquilino (OWASP LLM06:2023).
