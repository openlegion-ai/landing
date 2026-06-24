---
title: "Multi-Tenancy de Agentes IA: Aislamiento de Credenciales y Controles SOC 2"
description: "Prevención de fugas de datos entre inquilinos en sistemas de agentes IA multi-inquilino. Cubre OWASP LLM06, scoping de credenciales por inquilino, espacios de nombres de Kubernetes y controles SOC 2 CC6.1/CC6.6."
slug: /learn/ai-agent-multi-tenancy
primary_keyword: multi-tenancy agentes ia
last_updated: "2026-06-24"
schema_types: ["FAQPage"]
related:
  - /learn/ai-agent-security
  - /learn/credential-management-ai-agents
  - /learn/ai-agent-governance
  - /learn/ai-agent-sandboxing
  - /learn/ai-agent-audit-log
  - /learn/ai-agent-platform
---

# Multi-Tenancy de Agentes IA: Aislamiento de Credenciales, Separación de Espacios de Nombres y SOC 2

La multi-tenancy de agentes IA es la propiedad arquitectónica de una plataforma de agentes que aísla las credenciales, la memoria, el contexto de ejecución y los registros de auditoría de cada inquilino de todos los demás inquilinos, aplicada en la capa de infraestructura, no por convención del desarrollador o por el seguimiento de instrucciones del agente. A diferencia de la multi-tenancy de aplicaciones web, los agentes mantienen claves API activas, acumulan memoria persistente entre solicitudes y ejecutan llamadas a herramientas autenticadas: tres dimensiones más allá del aislamiento de filas de datos que deben particionarse por inquilino para satisfacer OWASP LLM06 y SOC 2 CC6.1.

<!-- SCHEMA: DefinitionBlock -->

> **La multi-tenancy de agentes IA** es la propiedad arquitectónica de una plataforma de agentes que garantiza que los agentes que sirven a diferentes inquilinos no pueden acceder a las credenciales, la memoria, el contexto de ejecución o los registros de auditoría de los demás, aplicada en la capa de infraestructura mediante scopes de vault de credenciales por inquilino, ACLs de espacio de nombres de pizarra, aislamiento de ejecución en contenedores y registros de auditoría particionados, de modo que un producto SaaS B2B construido sobre la plataforma hereda el aislamiento de inquilinos como garantía estructural en lugar de responsabilidad del desarrollador.

## Por qué la Multi-Tenancy de Agentes es Más Difícil que la de Aplicaciones Web

La multi-tenancy tradicional de aplicaciones web aísla una cosa: las filas de datos. Agrega una columna `tenant_id`, filtra cada consulta, listo. La multi-tenancy de agentes debe aislar tres dimensiones adicionales que las aplicaciones web nunca tuvieron que abordar. Fallar en cualquiera de ellas constituye un evento de filtración de datos entre inquilinos bajo OWASP LLM06 Sensitive Information Disclosure.

### Las Tres Dimensiones de Aislamiento que las Aplicaciones Web No Tenían

**Aislamiento de credenciales**: las aplicaciones web identifican al usuario mediante un token de sesión; la sesión no tiene acceso persistente a servicios externos. Los agentes necesitan claves API reales con scope para el inquilino: una clave OpenAI, una clave Stripe, una clave Salesforce. Si el agente del InquilinoA y el agente del InquilinoB comparten una clave OpenAI, el uso intensivo del InquilinoA degrada el margen de límite de velocidad del InquilinoB; la facturación del InquilinoA con el proveedor incluye el consumo de tokens del InquilinoB; revocar la clave después de un compromiso del InquilinoA también interrumpe al InquilinoB.

**Aislamiento de memoria**: los agentes acumulan memoria de trabajo (ventana de contexto en curso), memoria semántica (embeddings de almacén vectorial) y estado de coordinación (entradas de pizarra) entre interacciones. Si alguno de estos almacenes de memoria no está particionado por inquilino, los documentos del InquilinoA recuperados en el contexto del agente durante una tarea pueden aparecer en el contexto del agente del InquilinoB durante una tarea semánticamente similar, sin requerir ninguna entrada adversarial. Este es el escenario canónico de filtración entre inquilinos de OWASP LLM06 v1.1.

**Aislamiento del registro de auditoría**: un registro de auditoría compartido donde las llamadas a herramientas del InquilinoA y del InquilinoB están mezcladas no puede exportarse al equipo de cumplimiento del InquilinoA sin exponer los registros del InquilinoB. SOC 2 CC6.1 requiere que el auditor de cada inquilino solo pueda ver sus propios registros, lo que requiere particionamiento en la capa de almacenamiento, no solo filtrado en tiempo de consulta.

### Shared-Nothing vs Pool vs Bridge: Tres Modelos de Multi-Tenancy

**Modelo Silo (shared-nothing)**: cada inquilino obtiene infraestructura completamente dedicada. Máximo aislamiento al mayor costo por inquilino. Correcto para inquilinos empresariales con requisitos estrictos de residencia de datos e industrias reguladas.

**Modelo Pool**: todos los inquilinos comparten la infraestructura con aislamiento aplicado solo en la capa de aplicación mediante filtrado de parámetros `tenant_id`. Costo más bajo, aislamiento más débil. Apropiado solo para cargas de trabajo de baja sensibilidad sin clientes empresariales.

**Modelo Bridge**: infraestructura de cómputo compartida con aislamiento aplicado en el plano de control. Cada inquilino obtiene un scope de vault de credenciales dedicado y un espacio de nombres de memoria aplicados por ACLs de infraestructura; el cómputo se comparte pero es gobernado por Kubernetes namespace ResourceQuota. Este es el estándar recomendado para SaaS B2B. La arquitectura basada en proyectos de OpenLegion es una implementación del modelo Bridge.

## OWASP LLM06: Divulgación de Información Sensible Entre Inquilinos

OWASP LLM Top 10 v1.1 clasifica la filtración de datos entre inquilinos bajo LLM06: Sensitive Information Disclosure como de alta severidad.

### El Vector de Ataque de Filtración Entre Inquilinos

1. El agente del InquilinoA procesa una solicitud de soporte al cliente. Recupera la documentación interna del producto y los registros de clientes del InquilinoA en su ventana de contexto, luego incrusta y almacena pasajes relevantes en el almacén vectorial compartido.
2. El agente del InquilinoB procesa una solicitud semánticamente similar. Consulta el almacén vectorial compartido; la consulta devuelve los pasajes incrustados del InquilinoA como los K vecinos más cercanos porque son temáticamente similares y no hay índice particionado por inquilino.
3. Los registros internos de clientes del InquilinoA aparecen en el contexto del agente del InquilinoB.

No se requiere ninguna entrada adversarial. La filtración es un fallo arquitectónico.

Para el marco completo que incluye inyección de prompt (LLM01), ver [seguridad de agentes IA y el modelo de amenazas OWASP LLM Top 10](/learn/ai-agent-security).

### Filtración de Memoria: Memoria de Trabajo, Almacenes Vectoriales y Estado de Pizarra

Tres tipos de memoria de agente requieren cada uno un tratamiento de aislamiento de inquilino separado:

**Memoria de trabajo (ventana de contexto en curso)**: la ventana de contexto actual del agente nunca debe compartirse entre solicitudes de inquilinos.

**Memoria semántica (almacén vectorial)**: si se usa un almacén vectorial compartido, cada escritura debe incluir `tenant_id` como campo de metadatos obligatorio, y cada consulta debe incluir un filtro de metadatos `{tenant_id: current_tenant_id}` inyectado en la capa del cliente de almacenamiento.

**Estado de coordinación (pizarra)**: el estado clave-valor compartido entre agentes debe usar prefijos de clave con scope de inquilino, por ejemplo `projects/{tenant_id}/*`, con aplicación de ACL en la capa mesh.

## Aislamiento de Credenciales: Scope de Vault por Inquilino

### Scope de Credenciales por Inquilino: Por qué Fallan las Claves API Compartidas

El error de credenciales de multi-tenancy más común es usar una clave API LLM para todos los inquilinos. Esto falla de cuatro formas distintas: compartir el límite de velocidad, costo no atribuible, radio de revocación e isolamiento de auditoría roto.

Patrón correcto: cada inquilino obtiene su propia clave API. Para la arquitectura completa del vault ver [gestión de credenciales y patrones de scope de vault por inquilino](/learn/credential-management-ai-agents).

### Anti-Patrón JWT: Scope del Token Sin Revocación

Tres mitigaciones, todas requeridas juntas:

1. **Tokens de corta duración**: TTL de 300 segundos (5 minutos) para tokens de llamadas a herramientas de agentes.
2. **Registro de revocación activo**: una tabla por inquilino de IDs de tokens válidos.
3. **Rotación de tokens por tarea**: emitir un nuevo token para cada tarea del agente.

## Aislamiento de Ejecución: Espacios de Nombres de Kubernetes y Cuotas de Recursos

### Espacio de Nombres por Inquilino: RBAC, NetworkPolicy y ResourceQuota

Cuatro componentes son necesarios:

**Espacio de nombres por inquilino**: los pods del agente de cada inquilino se ejecutan en un espacio de nombres de Kubernetes dedicado.

**RBAC con ServiceAccounts con scope de espacio de nombres**: cada inquilino obtiene un ServiceAccount dedicado con RoleBindings con scope a su propio espacio de nombres.

**NetworkPolicy con denegación predeterminada**: aplicar una política de denegación de todo el ingress y egress a cada espacio de nombres de inquilino por defecto.

**ResourceQuota con LimitRange**: aplicar límites de CPU, memoria y conteo de pods por espacio de nombres.

Para controles de sandboxing a nivel de proceso ver [sandboxing de agentes IA y aislamiento de ejecución a nivel de proceso](/learn/ai-agent-sandboxing).

## Cumplimiento SOC 2 para Plataformas de Agentes Multi-Inquilino

### CC6.1: Controles de Acceso Lógico por Clasificación de Datos

El cumplimiento de CC6.1 requiere tres controles específicos: scope de vault de credenciales por inquilino, espacio de nombres de memoria por inquilino y partición de registro de auditoría por inquilino.

Los auditores de SOC 2 marcan las claves API compartidas usadas entre inquilinos como deficiencias de CC6.1. Para el mapeo completo de controles ver [gobernanza de agentes IA y marcos de cumplimiento SOC 2](/learn/ai-agent-governance).

### CC6.6: Restricción de Acceso Privilegiado para Agentes con Permisos Elevados

El cumplimiento de CC6.6 requiere: prevención estructural de llamadas de agentes privilegiados entre inquilinos, definiciones de permisos de agentes privilegiados auditables y registros de auditoría por invocación para acciones privilegiadas.

## Particionamiento del Registro de Auditoría por Inquilino

**Patrón de clave de almacenamiento**: `audit/{tenant_id}/{year}/{month}/{day}/{agent_id}/{tool_call_id}.json`

**Política de bucket S3 por inquilino**: un prefijo de bucket separado con una política de recursos separada por inquilino.

**Atributos de recursos OTLP**: incluir `tenant_id` como atributo de recurso en cada registro de registro de OpenTelemetry.

**Espacio de trabajo SIEM por inquilino**: en implementaciones SIEM compartidas, configurar índices o espacios de trabajo por inquilino.

Para el diseño completo del registro de auditoría ver [registro de auditoría de agentes IA y registros de cumplimiento por inquilino](/learn/ai-agent-audit-log).

## Anti-Patrones: Lo que No se Debe Hacer

### Anti-Patrón 1: ID de Inquilino en el Prompt del Agente, no en la Infraestructura

Inyectar el `tenant_id` en el prompt del sistema del agente y depender del agente para aplicar su propio límite de inquilino es el anti-patrón de multi-tenancy más común y peligroso. Falla por bypass de inyección de prompt, deriva de alucinación y ausencia de aplicación en la infraestructura.

### Anti-Patrón 2: Almacén Vectorial Compartido sin Filtros de Inquilino

Este es el vector principal de filtración OWASP LLM06. La corrección requiere un campo de metadatos `tenant_id` obligatorio en cada escritura y un filtro de metadatos inyectado en la capa del cliente de almacenamiento en cada consulta.

### Anti-Patrón 3: Clave API LLM Compartida con Reclamación de Inquilino en el Prompt

Este anti-patrón falla en CC6.1: compartir límite de velocidad, fallo de atribución de costos, radio de revocación y registros de auditoría del proveedor que no pueden particionarse por inquilino.

## La Perspectiva de OpenLegion: Aislamiento por Arquitectura, no por Convención

OpenLegion aplica el aislamiento de inquilinos mediante tres mecanismos a nivel de infraestructura que el código del agente no puede eludir: scope de vault de credenciales por proyecto, ACLs de espacio de nombres de pizarra y mensajería entre agentes de proyectos cruzados bloqueada de forma predeterminada.

| **Control de aislamiento** | **OpenLegion** | **LangChain / LangGraph** | **CrewAI** | **AutoGen** | **OpenAI Agents SDK** |
|---|---|---|---|---|---|
| **Scope de vault de credenciales por inquilino** | Aplicado por infraestructura | Convención desarrollador | Convención desarrollador | Convención desarrollador | Convención desarrollador |
| **ACLs de espacio de nombres de pizarra** | Aplicado por infraestructura | No disponible | No disponible | No disponible | No disponible |
| **Mensajería entre agentes de proyectos bloqueada** | Bloqueada por defecto | No disponible | No disponible | No disponible | No disponible |
| **Cap de presupuesto por inquilino (Zona 2)** | Aplicado por infraestructura | Convención desarrollador | Convención desarrollador | Convención desarrollador | Convención desarrollador |
| **Partición de auditoría por inquilino (WORM)** | Aplicado por infraestructura | Convención desarrollador | Convención desarrollador | Convención desarrollador | Convención desarrollador |
| **Kubernetes namespace + ResourceQuota** | Gestionado por plataforma | Auto-gestionado | Auto-gestionado | Auto-gestionado | Auto-gestionado |

Para la capa de infraestructura alojada ver [plataforma de agentes IA gestionada con garantías de aislamiento de inquilinos](/learn/ai-agent-platform).

<!-- SCHEMA: FAQPage -->

## Preguntas Frecuentes

### ¿Qué es la multi-tenancy de agentes IA?

La multi-tenancy de agentes IA es la propiedad arquitectónica de una plataforma de agentes que garantiza que los agentes que sirven a diferentes inquilinos no pueden acceder a las credenciales, la memoria, el contexto de ejecución o los registros de auditoría de los demás, aplicada en la capa de infraestructura en lugar de por convención del desarrollador. Se diferencia de la multi-tenancy tradicional de aplicaciones web al requerir tres dimensiones de aislamiento adicionales: scope de vault de credenciales por inquilino, particionamiento de memoria por inquilino y particionamiento de registro de auditoría por inquilino.

### ¿Qué es OWASP LLM06 y cómo afecta a los sistemas de agentes multi-inquilino?

OWASP LLM Top 10 v1.1 LLM06 Sensitive Information Disclosure clasifica la filtración de datos entre inquilinos como de alta severidad: el escenario en el que un agente procesa los datos del InquilinoA, almacena documentos recuperados en una capa de memoria compartida sin particionamiento por inquilino y luego los muestra en una respuesta del InquilinoB. El ataque no requiere ninguna entrada adversarial. La mitigación requiere particionamiento de memoria por inquilino en la capa del cliente de almacenamiento, scope de credenciales por inquilino y particiones de registros de auditoría por inquilino.

### ¿Cómo se aplican SOC 2 CC6.1 y CC6.6 a las plataformas de agentes multi-inquilino?

SOC 2 Tipo II CC6.1 requiere que el acceso lógico esté restringido según la clasificación de datos; en un sistema de agentes multi-inquilino, el límite del inquilino es el límite de clasificación principal. CC6.6 se aplica a agentes con permisos de herramientas elevados; estos agentes son funcionalmente usuarios privilegiados y deben estar estructuralmente impedidos de procesar solicitudes fuera de su scope de inquilino asignado. Una clave API compartida usada entre inquilinos generalmente se marcará como deficiencia de CC6.1.

### ¿Cuál es la vulnerabilidad del TTL del token JWT en los sistemas de agentes multi-inquilino?

Los tokens de acceso JWT utilizados para el contexto de inquilino en las llamadas a herramientas de agentes comúnmente expiran después de 3.600 segundos (1 hora); si un token emitido para el InquilinoA se almacena en caché incorrectamente, es compartido por un error de infraestructura o capturado en un registro de depuración, puede usarse para hacer llamadas autenticadas atribuidas al InquilinoA durante toda la duración del TTL sin detección. La mitigación requiere tres controles aplicados juntos: tokens de corta duración con TTL de 300 segundos, registro de revocación activo por inquilino y rotación de tokens por tarea.

### ¿Cómo funciona el aislamiento de espacio de nombres de Kubernetes para agentes multi-inquilino?

El aislamiento de espacio de nombres de Kubernetes proporciona aislamiento de ejecución mediante cuatro componentes: un espacio de nombres dedicado por inquilino, RBAC con ServiceAccounts por inquilino y RoleBindings con scope de espacio de nombres, NetworkPolicy con denegación predeterminada y lista blanca explícita para puntos de conexión externos requeridos, y ResourceQuota con límites de cómputo por espacio de nombres. El aislamiento de espacio de nombres aborda la dimensión de cómputo de la multi-tenancy y debe combinarse con el scope de credenciales por inquilino y el particionamiento de memoria.

### ¿Cuál es el anti-patrón del almacén vectorial compartido en los sistemas de agentes multi-inquilino?

Usar un almacén vectorial compartido sin filtros de inquilino obligatorios por consulta inyectados en la capa del cliente de almacenamiento es el vector principal de filtración OWASP LLM06. La implementación correcta requiere un campo de metadatos `tenant_id` en cada escritura y un filtro de metadatos inyectado en la capa del cliente del almacén vectorial en cada consulta. Para requisitos de cumplimiento estrictos, los espacios de nombres por inquilino o índices separados aplican el aislamiento en la capa de dirección de almacenamiento.

### ¿Cómo aplica OpenLegion el aislamiento de inquilinos?

OpenLegion aplica el aislamiento de inquilinos mediante tres mecanismos a nivel de infraestructura: scope de vault de credenciales por proyecto (Zone 2 resuelve handles `$CRED{}` usando el contexto de proyecto autenticado de la sesión mesh, no de parámetros proporcionados por el agente; la resolución de credenciales entre proyectos es arquitectónicamente imposible), ACLs de espacio de nombres de pizarra (los agentes tienen permisos de lectura y escritura solo para el prefijo de clave de su proyecto, aplicados por el supervisor mesh) y mensajería entre agentes de proyectos bloqueada de forma predeterminada.

### ¿Cuáles son los tres modelos de arquitectura de multi-tenancy para plataformas de agentes?

Los tres modelos de multi-tenancy tienen diferentes garantías de aislamiento y perfiles de costo: el modelo Silo (shared-nothing) da a cada inquilino infraestructura completamente dedicada; el modelo Pool comparte toda la infraestructura con aislamiento aplicado solo en la capa de aplicación; el modelo Bridge comparte la infraestructura de cómputo mientras aplica el aislamiento en el plano de control mediante scopes de vault de credenciales por inquilino y ACLs de espacio de nombres de memoria. El modelo Bridge es el estándar recomendado para SaaS B2B.
