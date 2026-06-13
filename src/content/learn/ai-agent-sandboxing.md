---
title: "AI Agent Sandboxing — Container Isolation, Escape CVEs, and Hardening"
description: "How AI agent sandboxing works: Docker, gVisor, WebAssembly, and seccomp hardening. Covers sandbox escape CVEs, code execution isolation, browser agent sandboxing, and runtime cost trade-offs."
slug: /learn/ai-agent-sandboxing
primary_keyword: ai agent sandboxing
last_updated: "2026-06-13"
schema_types:
  - FAQPage
related:
  - /learn/ai-agent-security
  - /learn/ai-agent-tool-use
  - /learn/ai-agent-orchestration
  - /learn/managed-ai-agent-hosting
  - /learn/ai-agent-platform
  - /learn/browser-use-agents
---

# AI Agent Sandboxing: Container Isolation, Escape CVEs, and Hardening

AI agent sandboxing is the practice of isolating agent processes in containers, microVMs, or WebAssembly runtimes so a compromised, injected, or misbehaving agent cannot access the host system, peer agents' data, or credentials outside its defined scope. Traditional software sandboxing assumes bounded, predictable behavior. Agents execute LLM-generated code, browse arbitrary web pages, call external APIs, and spawn subprocesses — each action an unbounded blast radius without isolation. Anthropic's Computer Use documentation (September 2024) requires Docker container isolation for any agent operating OS-level bash, text\_editor, or computer tools.

<!-- SCHEMA: DefinitionBlock -->
AI agent sandboxing is the practice of running AI agent processes in isolated execution environments — containers, microVMs, or language runtimes — so that a compromised, injected, or misbehaving agent cannot access the host system, other agents' data, credential stores, or network resources outside its defined scope.

## Why AI Agents Need Stronger Sandboxing Than Traditional Software

Standard application sandboxing assumes a program with a known set of system calls, a bounded file access pattern, and predictable network behavior. An AI agent has none of these properties. It receives instructions from an LLM, which may generate code, commands, or tool calls that the developer never anticipated — and never reviewed. The sandboxing requirement for agents is categorically different.

### Agents Execute Code: The Unrestricted Subprocess Problem

When an agent executes LLM-generated Python, JavaScript, or shell commands, it runs arbitrary code in whatever environment it inhabits. Without isolation, that code inherits the agent's full process context: filesystem access, environment variables (where secrets often live), network access, and the ability to spawn further subprocesses.

OWASP LLM08 Excessive Agency (v1.1, 2025) identifies code execution as the primary mechanism by which agents exceed intended permissions. CVE-2024-21626 (runc, January 2024, CVSS 8.6) demonstrated that even well-designed container runtimes have escape paths: a leaked file descriptor in runc allowed processes inside a container to access the host filesystem. Fixed in runc 1.1.12 — but non-root execution combined with no-new-privileges mitigated the CVE without patching.

The correct architecture: LLM-generated code executes in a nested sandbox — a microVM or WASM runtime — inside the agent container, not directly in the agent's process space. The [AI agent tool use and least-privilege assignment](/learn/ai-agent-tool-use) page covers tool ACL gates that restrict which tools an agent can invoke at all.

### Agents Browse the Web: The Exfiltration Channel Problem

A browser-enabled agent fetches arbitrary web content and processes it in its LLM context. Without network egress restriction, an injected agent can exfiltrate data via HTTP requests to attacker-controlled endpoints — encoding credentials or memory contents in URL parameters or POST bodies. The browser itself is an exfiltration channel if DNS lookups and outbound HTTP are unrestricted.

OpenAI's Operator (January 2025) uses isolated browser sessions per task with no cross-task credential bleed. Session isolation — a fresh browser profile per task, no shared cookies or storage — prevents session state carry-over between tasks while network egress restriction limits where the browser can send data.

### Shared Process Space: How One Agent Compromises the Fleet

In a shared-process multi-agent deployment — all agents running as threads in one Python process, or in containers sharing a Docker socket — a compromised agent can read other agents' memory, write to shared state, or via the Docker socket, create new containers with elevated privileges. The Docker socket is effectively root: any process that can write to `/var/run/docker.sock` can create a privileged container and escape the host. Mounting the Docker socket into agent containers is a configuration mistake that negates every other sandboxing measure.

Per-agent container isolation with no shared sockets and per-agent credential scoping is the only structural mitigation. See [AI agent orchestration patterns](/learn/ai-agent-orchestration) for fleet topology that avoids shared-process deployment.

## The Sandbox Technology Stack

Production AI agent sandboxing is layered. Each layer handles a different threat surface; no single layer is sufficient alone.

### Layer 1: Linux Namespaces and cgroups (OS-Level Isolation)

Linux provides six namespace types that isolate different aspects of the process environment:

- **PID namespace**: Agent sees only its own processes; cannot signal or observe host PIDs
- **Network namespace**: Isolated network stack; custom routing rules and egress restrictions apply only within this namespace
- **Mount namespace**: Isolated filesystem view; host mounts not visible unless explicitly shared
- **UTS namespace**: Isolated hostname and domain name; agent cannot read or modify host identity
- **IPC namespace**: Isolated inter-process communication; no shared memory segments with host
- **User namespace**: UID remapping; agent's root (UID 0) maps to an unprivileged host UID

cgroup v2 enforces resource limits: CPU shares, memory limits (hard and soft), and I/O bandwidth. Without cgroup limits, a runaway agent or injected code can exhaust host resources, causing denial of service for the entire fleet. OpenLegion defaults: 384MB RAM limit, 0.15 CPU quota per agent.

### Layer 2: seccomp and AppArmor (Syscall Filtering)

Docker's default seccomp profile blocks approximately 44 of 300+ Linux syscalls — those with no legitimate container use case or known exploitation history. For AI agents, a custom seccomp profile should additionally block:

- `ptrace` (process inspection — used in container escape chains)
- `keyctl` and `add_key` (kernel keyring manipulation)
- `unshare` (namespace creation — can be used to escape user namespace restrictions)
- `mount` (filesystem mounting within the container)
- `pivot_root` / `chroot` (filesystem root manipulation)
- `clone` with `CLONE_NEWUSER` (user namespace creation for privilege escalation)

AppArmor profiles add MAC (mandatory access control) at the path level, restricting which files and network sockets the agent process can access even if seccomp allows the underlying syscall. Use both: seccomp filters syscalls, AppArmor filters resource access.

### Layer 3: Capability Dropping (Least-Privilege Execution)

Linux capabilities divide root privileges into ~40 distinct capabilities. Docker grants containers a subset by default — 14 capabilities — that still include dangerous ones like `NET_RAW` (raw socket access) and `SYS_CHROOT`. For AI agents:

```yaml
# docker-compose.yml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
cap_add:
  - NET_BIND_SERVICE   # only if agent needs to bind port <1024
read_only: true
user: "1000:1000"
```

`cap_drop: ALL` removes every capability. `no-new-privileges` prevents setuid binaries from acquiring capabilities not in the initial set. Running as UID 1000 (non-root) means CVE-2024-21626-style fd leaks that require root to exploit are structurally mitigated without patching. This is the minimum hardening baseline; each item is independently load-bearing.

### Layer 4: gVisor and microVMs (Kernel-Level Isolation)

Standard containers share the host kernel. A kernel-level exploit inside a container affects the host. Two technologies address this:

**gVisor** interposes a user-space kernel (written in Go) between the container process and the real host kernel. Syscalls from the container are intercepted by the Sentry (gVisor's kernel surrogate) rather than passed to the host kernel directly. This eliminates most kernel exploit paths at the cost of approximately 10-15% throughput overhead for I/O-heavy workloads. Google Cloud Run uses gVisor as its container runtime. Run with `--runtime=runsc` in Docker.

**Firecracker microVMs** provide full VM isolation — each agent gets its own kernel — with startup times of approximately 125ms and memory overhead under 5MB per VM. This is the technology behind E2B and AWS Lambda. microVMs are the correct choice when untrusted code execution is the primary threat; the isolation boundary is a full VM rather than a container.

For AI agents that only need process isolation (no arbitrary code execution), gVisor is adequate. For agents that execute LLM-generated code, Firecracker or equivalent microVM isolation is preferable.

### Layer 5: WebAssembly Sandboxing (Language-Level Isolation)

WebAssembly (WASM) provides a language-level sandbox for untrusted code execution. WASM modules run in a memory-safe, capability-based sandbox — no direct filesystem or network access unless explicitly granted via WASI capabilities. Three production runtimes:

- **Wasmtime** (Bytecode Alliance, Rust): 2-10ms startup, capability-based WASI, suitable for short-lived code execution tasks
- **Wasmer** (MIT): supports multiple compilation backends, embeddable in Python/Go/Rust host processes
- **WasmEdge**: focused on cloud-native and edge use cases, AOT compilation for near-native throughput

WASM sandboxing is appropriate for tool implementations that execute user-provided or LLM-generated logic within a single agent's tool call — no subprocess spawning, no filesystem access beyond explicitly granted paths, bounded execution time via fuel metering. It does not replace container-level isolation; it complements it for in-process code execution.

## Container Escape CVEs: What Can Go Wrong

### CVE-2024-21626: runc File Descriptor Leak (CVSS 8.6, January 2024)

runc, the OCI container runtime underlying Docker and containerd, leaked an open file descriptor to the host's working directory into the container process. By referencing `/proc/self/fd/<leaked_fd>`, a process inside the container could access and write to the host filesystem, achieving a full container escape.

Fixed in runc 1.1.12 (released January 31, 2024). Systems running older runc versions remain vulnerable. Structural mitigations that reduce exploitability without patching: non-root execution (UID 1000), `cap_drop: ALL`, and `no-new-privileges` — these reduce blast radius if a future similar CVE appears. This is configuration hardening, not a patch substitute.

### Sandbox Escape via Docker Socket Mounting

Mounting `/var/run/docker.sock` into an agent container gives that container the ability to create new Docker containers with any configuration — including `privileged: true` and host network and filesystem mounts. This is not a CVE; it is a configuration mistake that negates all container isolation. Any agent with access to the Docker socket has effective root on the host.

Several AI agent frameworks mount the Docker socket by default to support "agent spawning other agents" patterns. Verify your deployment configuration explicitly. The OpenLegion Zone 2 container manager creates agent containers without socket access; agent code cannot inspect or modify the container configuration it runs in.

### Overlay Filesystem Attacks

Container overlay filesystems (overlayfs) have had a pattern of vulnerabilities where race conditions or improper privilege checks allow container processes to write to upper-layer directories with elevated permissions. CVE-2023-0778 is a related example in Podman: a TOCTOU flaw during volume export allowed a malicious user to replace a file with a symlink, gaining access to arbitrary host filesystem paths. The primary mitigation is a read-only root filesystem (`read_only: true`): the agent container filesystem is mounted read-only, with only explicitly declared tmpfs mounts writable. This eliminates the write surface for overlay attacks and limits the persistence of any injected code.

## Code Execution Sandboxes for AI Agents

When agents execute LLM-generated code, the code execution environment requires stronger isolation than the agent container itself. Three options for production:

### E2B: Firecracker microVM Code Execution

E2B provides on-demand Firecracker microVMs for sandboxed code execution. Each execution request starts a fresh microVM (~125ms), runs the code, and destroys the VM. Pricing: $0.000126 per compute-second. No code persistence between executions; no cross-request state. E2B supports Python, JavaScript, Bash, and arbitrary Linux environments via custom Docker images as the base for the microVM.

Appropriate for: agents that execute LLM-generated Python or shell commands as part of data analysis, code generation, or tool-building tasks. The microVM boundary means a compromised execution cannot reach the agent container or host.

### Modal: Ephemeral Container Functions

Modal runs code as ephemeral container functions on a managed compute platform. Pricing: $0.000037-$0.00048 per GB-second of memory, with GPU support. Container cold starts are approximately 50-200ms. Modal functions are stateless by design; no local filesystem persistence between calls. Network egress can be restricted via Modal's network policy layer.

Appropriate for: compute-heavy code execution (ML inference, numerical computation) and GPU workloads that need sandboxed execution with resource billing per call.

### In-Process WASM: Wasmtime for Untrusted Code

For agents that need to execute short-lived, untrusted functions in-process without the latency of a microVM or container call, Wasmtime embedded in the host language provides 2-10ms startup with WASI capability-based isolation. The WASM module cannot spawn subprocesses, cannot access the filesystem outside granted paths, and has bounded execution time via Wasmtime's fuel metering (CPU instruction budget per execution).

```rust
// Wasmtime with fuel metering and restricted WASI
let engine = Engine::new(Config::new().consume_fuel(true))?;
let mut store = Store::new(&engine, wasi_ctx);
store.set_fuel(1_000_000)?;  // ~1M instructions budget
// WasiCtx grants only explicitly declared capabilities
```

Appropriate for: plugin systems, user-defined tool logic, and LLM-generated functions that must run in-process with minimal latency. Not appropriate for agents that need full OS access or network calls.

## Browser Agent Sandboxing

### Why Browser Sessions Require Per-Task Isolation

Browser agents accumulate session state: cookies, localStorage, sessionStorage, cached credentials, and browser fingerprint data. Without per-task isolation, session state from one task bleeds into the next — or into a different agent sharing the browser instance. An attacker who injects a cookie-setting instruction in Task A can influence Task B's behavior if they share a session.

Per-task browser profiles — a fresh user data directory for each task, destroyed on completion — eliminate session carry-over. This is the isolation model used by OpenAI Operator (January 2025) and is the minimum baseline for any browser agent operating across different users or tasks. See [browser-use agents and session isolation](/learn/browser-use-agents) for implementation patterns.

### Network Egress Restriction for Browsers

Browser network egress should be restricted to a domain allowlist enforced by an HTTP proxy (squid or equivalent) or DNS-level filtering. Without egress restriction, an injected browser agent can POST credentials or memory contents to arbitrary external endpoints. The proxy enforcement point must be outside the agent's execution context — an allowlist enforced by agent code can be bypassed by injection.

Minimum egress policy for a task-scoped browser agent:

- Allow: task target domain(s), explicitly declared API endpoints
- Block: all other outbound HTTP/HTTPS
- Log: all DNS lookups and HTTP requests for audit

### Camoufox: Fingerprint-Resistant Browser Sandboxing

Camoufox is a hardened Firefox fork designed for browser automation with anti-detection properties — randomized fingerprints, patched WebGL/canvas APIs, and headless mode that matches headed behavior for bot-detection evasion. OpenLegion uses Camoufox for per-agent browser sessions, providing fingerprint isolation alongside process isolation. Each agent's browser session presents a distinct, consistent fingerprint that does not leak fleet topology to bot-detection systems on target websites.

## OpenLegion's Take: Hardening Defaults Are Non-Negotiable

Most AI agent frameworks leave sandbox configuration to the developer. CrewAI, AutoGen, LangGraph, and the OpenAI Agents SDK provide no default container hardening — the developer is responsible for every security_opt, cap_drop, and cgroup limit in the deployment configuration. This is reasonable for a library; it is a liability in a managed platform.

OpenLegion's Zone 2 container manager enforces hardening defaults at the infrastructure layer. Agent code cannot inspect or modify its own container configuration. The agent does not know its UID, its capability set, or its cgroup limits. These controls exist outside the agent's execution context.

| **Dimension** | **OpenLegion** | **LangGraph** | **CrewAI** | **OpenAI Agents SDK** | **AutoGen** |
|---|---|---|---|---|---|
| **Non-root execution (UID!=0)** | UID 1000, enforced | Not enforced | Not enforced | Not enforced | Not enforced |
| **cap_drop=ALL enforced** | Yes -- Zone 2 default | Not built-in | Not built-in | Not built-in | Not built-in |
| **no-new-privileges** | Yes -- Zone 2 default | Not built-in | Not built-in | Not built-in | Not built-in |
| **Read-only root filesystem** | Yes -- Zone 2 default | Not built-in | Not built-in | Not built-in | Not built-in |
| **Per-agent credential isolation** | Vault proxy -- no plaintext secrets | Developer responsibility | Developer responsibility | Developer responsibility | Developer responsibility |
| **Network egress restriction** | Configurable allowlist, mesh-enforced | Not built-in | Not built-in | Not built-in | Not built-in |
| **Configurable resource limits (RAM/CPU)** | 384MB / 0.15 CPU default, adjustable | Not built-in | Not built-in | Not built-in | Not built-in |

## Sandbox Hardening Checklist for Production AI Agents

1. **Run as non-root (UID 1000 or higher).** Most container escape CVEs require UID 0 inside the container. Non-root execution is the highest-ROI single change.
2. **Drop all capabilities (`cap_drop: ALL`).** Add back only what the agent genuinely needs. Most agents need none.
3. **Set `no-new-privileges: true`.** Prevents setuid/setgid binaries from acquiring capabilities not in the initial set.
4. **Mount root filesystem read-only.** Use tmpfs for writable paths (`/tmp`, `/run`). Eliminates persistence of injected code.
5. **Apply a custom seccomp profile.** Start from Docker's default; additionally block `ptrace`, `keyctl`, `unshare`, `mount`, `clone` with `CLONE_NEWUSER`.
6. **Never mount the Docker socket.** If agents need to spawn sub-agents, use an orchestration API, not Docker socket access.
7. **Restrict network egress.** Allowlist outbound destinations. Enforce at the mesh or proxy layer, not in agent code.
8. **Set cgroup resource limits.** Cap RAM (384MB is a reasonable default) and CPU quota. Prevents resource exhaustion attacks.
9. **Use a nested sandbox for code execution.** LLM-generated code runs in a microVM (Firecracker/E2B) or WASM runtime (Wasmtime), not directly in the agent container.
10. **Pin and patch runc.** Track runc CVEs (NVD filter: `runc`). CVE-2024-21626 was disclosed January 2024; unpatched hosts remained exploitable for months post-disclosure.

<!-- SCHEMA: FAQPage -->
## Frequently Asked Questions

### What is AI agent sandboxing?

AI agent sandboxing is the practice of running agent processes in isolated execution environments — Linux containers, microVMs, or WebAssembly runtimes — so a compromised or injected agent cannot access the host system, peer agents' data, or credentials outside its defined scope. Agents require stronger sandboxing than traditional software because they execute LLM-generated code, browse arbitrary web pages, and call external APIs — all actions with unbounded blast radius without isolation. Anthropic's Computer Use documentation (September 2024) requires Docker container isolation for any agent using OS-level tools.

### What is CVE-2024-21626 and how does it affect AI agents?

CVE-2024-21626 is a container escape vulnerability in runc (CVSS 8.6, disclosed January 2024) where a leaked file descriptor allowed processes inside a container to access the host filesystem. It was fixed in runc 1.1.12. For AI agents, the structural mitigations are non-root execution (UID 1000), `cap_drop: ALL`, and `no-new-privileges` — these reduce exploitability without requiring a patch. Any agent deployment running a pre-1.1.12 runc without these hardening controls is exposed to container escape via this vulnerability.

### What is the difference between Docker containers and microVMs for agent sandboxing?

Docker containers share the host kernel — a kernel-level exploit inside a container affects the host. microVMs (Firecracker, QEMU) give each agent its own kernel instance, providing full VM-level isolation at approximately 125ms startup overhead and under 5MB memory per VM. For agents that only need process isolation, hardened Docker containers with cap_drop=ALL, no-new-privileges, and gVisor are adequate. For agents that execute LLM-generated code, microVM isolation is preferable because the isolation boundary is a full kernel rather than a container.

### What is gVisor and when should it be used for AI agents?

gVisor is a user-space kernel implementation that intercepts syscalls from container processes and routes them through the Sentry (gVisor's kernel surrogate) rather than passing them to the host kernel directly. This eliminates most kernel exploit paths at approximately 10-15% throughput overhead for I/O-heavy workloads. Google Cloud Run uses gVisor as its container runtime. For AI agents, gVisor is the right choice when kernel-level isolation is needed but microVM startup latency is unacceptable.

### How should browser agent sessions be isolated?

Browser agent sessions require per-task isolation: a fresh browser profile (user data directory) for each task, destroyed on completion. Without per-task isolation, cookies, localStorage, and cached credentials from one task bleed into subsequent tasks. Network egress should be restricted to a domain allowlist enforced by an HTTP proxy outside the agent's execution context — allowlist enforcement in agent code can be bypassed by prompt injection. OpenAI Operator (January 2025) uses isolated browser sessions per task with no cross-task credential access as its baseline isolation model.

### What is the danger of mounting the Docker socket into an agent container?

Mounting `/var/run/docker.sock` into an agent container grants that container the ability to create new Docker containers with any configuration, including `privileged: true` with full host filesystem and network access. This effectively gives the agent root on the host — all container isolation is negated. Several AI agent frameworks mount the Docker socket by default to support agent-spawning patterns. This configuration mistake cannot be mitigated by seccomp, AppArmor, or capability dropping — the socket access itself is the escape path.

### What are seccomp and AppArmor and why do AI agents need custom profiles?

seccomp (Secure Computing Mode) is a Linux kernel feature that filters which syscalls a process can invoke. Docker's default seccomp profile blocks approximately 44 of 300+ syscalls. AI agents need custom profiles that additionally block `ptrace`, `keyctl`, `unshare`, `mount`, and `clone` with `CLONE_NEWUSER`. AppArmor adds MAC (mandatory access control) at the file and network socket level. Used together, seccomp restricts syscalls and AppArmor restricts resource access — two independent enforcement layers with different bypass paths.

### How does OpenLegion sandbox AI agents by default?

OpenLegion's Zone 2 container manager enforces hardening defaults outside the agent's execution context: UID 1000 (non-root), `cap_drop: ALL`, `no-new-privileges`, read-only root filesystem, 384MB RAM limit, and 0.15 CPU quota per agent. Agent code cannot inspect or modify its own container configuration. Per-agent credential isolation uses a vault proxy — agents receive opaque credential handles rather than plaintext secrets, so credentials are not accessible even if the container is compromised. Network egress is restricted to a configurable allowlist enforced at the mesh layer.

## Run Agents With Infrastructure-Layer Sandboxing Enforced by Default

Sandbox hardening left to developers produces inconsistent results. Some containers run non-root; others do not. Some have custom seccomp profiles; most use Docker defaults. In production fleets handling sensitive data or operating with tool access to external systems, a single misconfigured container is a fleet-wide risk.

For a full picture of the agent threat model that sandboxing addresses, see [AI agent security and threat model](/learn/ai-agent-security). For tool access controls that work alongside sandboxing, see [AI agent tool use and least-privilege assignment](/learn/ai-agent-tool-use).

[Deploy agents with UID 1000, cap_drop=ALL, read-only root, and per-agent credential vault isolation enforced by default -- get started on OpenLegion](https://app.openlegion.ai)
