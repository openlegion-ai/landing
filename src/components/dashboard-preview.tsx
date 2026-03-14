"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn } from "@/components/ui/animate-in";

interface Agent {
  id: string;
  role: string;
  model: string;
  avatar: number;
  colorIndex: number;
  state: string;
  health: string;
  cost: number;
  tokens: number;
  heartbeat: string | null;
}

const AGENT_COLORS = [
  { gradient: "from-indigo-600 to-indigo-400", stripe: "bg-indigo-500" },
  { gradient: "from-cyan-600 to-cyan-400", stripe: "bg-cyan-500" },
  { gradient: "from-emerald-600 to-emerald-400", stripe: "bg-emerald-500" },
  { gradient: "from-amber-600 to-amber-400", stripe: "bg-amber-500" },
  { gradient: "from-rose-600 to-rose-400", stripe: "bg-rose-500" },
  { gradient: "from-violet-600 to-violet-400", stripe: "bg-violet-500" },
];

const INITIAL_AGENTS: Agent[] = [
  { id: "researcher", role: "Lead Researcher", model: "claude-sonnet-4-6", avatar: 3, colorIndex: 0, state: "streaming", health: "healthy", cost: 1.24, tokens: 18420, heartbeat: "every 5m" },
  { id: "engineer", role: "Code Engineer", model: "gpt-4o", avatar: 7, colorIndex: 1, state: "thinking", health: "healthy", cost: 3.87, tokens: 42100, heartbeat: "every 10m" },
  { id: "reviewer", role: "PR Reviewer", model: "gemini-2.5-pro", avatar: 12, colorIndex: 2, state: "idle", health: "healthy", cost: 0.56, tokens: 8930, heartbeat: "every 30m" },
  { id: "writer", role: "Content Writer", model: "claude-haiku-4-5", avatar: 21, colorIndex: 3, state: "tool", health: "healthy", cost: 0.18, tokens: 12450, heartbeat: "every 15m" },
  { id: "qualifier", role: "Lead Qualifier", model: "deepseek-v3", avatar: 15, colorIndex: 4, state: "idle", health: "unhealthy", cost: 0.42, tokens: 5200, heartbeat: "every 20m" },
  { id: "outreach", role: "Sales Outreach", model: "mistral-large", avatar: 28, colorIndex: 5, state: "streaming", health: "healthy", cost: 2.15, tokens: 31840, heartbeat: "every 5m" },
];

const STATE_CYCLE = ["streaming", "thinking", "tool", "idle"] as const;

const STATE_DOT: Record<string, string> = {
  thinking: "bg-purple-400",
  streaming: "bg-green-400",
  tool: "bg-amber-400",
  idle: "bg-gray-600",
};

const STATE_LABEL: Record<string, string> = {
  thinking: "text-purple-400",
  streaming: "text-green-400",
  tool: "text-amber-400",
  idle: "text-muted/60",
};

const HEALTH_LABEL: Record<string, string> = {
  healthy: "Online",
  unhealthy: "Degraded",
};

const HEALTH_STYLES: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  unhealthy: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function DashboardPreview() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const cycleRef = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !isVisible) return;
    const id = setInterval(() => {
      const idx = cycleRef.current % INITIAL_AGENTS.length;
      cycleRef.current++;
      setAgents((prev) =>
        prev.map((a, i) => {
          if (i !== idx) return a;
          const curIdx = STATE_CYCLE.indexOf(a.state as typeof STATE_CYCLE[number]);
          const nextState = STATE_CYCLE[(curIdx + 1) % STATE_CYCLE.length];
          return { ...a, state: nextState };
        })
      );
    }, 3000);
    return () => clearInterval(id);
  }, [reduceMotion, isVisible]);

  useEffect(() => {
    if (reduceMotion || !isVisible) return;
    const id = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          if (a.state === "idle") return a;
          let tokenInc: number;
          if (a.state === "streaming") tokenInc = randInt(80, 200);
          else if (a.state === "thinking") tokenInc = randInt(30, 80);
          else tokenInc = randInt(10, 40);
          const costInc = tokenInc * 0.000035;
          return {
            ...a,
            tokens: a.tokens + tokenInc,
            cost: Math.round((a.cost + costInc) * 100) / 100,
          };
        })
      );
    }, 1500);
    return () => clearInterval(id);
  }, [reduceMotion, isVisible]);

  const totalCost = useMemo(() => agents.reduce((s, a) => s + a.cost, 0), [agents]);
  const totalTokens = useMemo(() => agents.reduce((s, a) => s + a.tokens, 0), [agents]);
  const healthyCount = useMemo(() => agents.filter((a) => a.health === "healthy").length, [agents]);
  const unhealthyCount = useMemo(() => agents.filter((a) => a.health === "unhealthy").length, [agents]);

  return (
    <div ref={sectionRef}>
    <SectionWrapper id="dashboard" fade={false}>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Fleet Dashboard
          </p>
          <h2 className="mb-5 text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            See your fleet in{" "}
            <span className="gradient-text">real time</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Every agent, every cost, every event — live. Chat with agents,
            monitor health, and track spend from one unified view.
          </p>
        </div>
      </AnimateIn>

      <AnimateIn delay={0.1}>
        <div className="dashboard-perspective">
        <div className="dashboard-tilt dashboard-frame rounded-2xl overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border/50 bg-[#0d0e14] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-3 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/10">
                <svg className="h-3 w-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground/70">Fleet Overview</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] text-green-400">
                <span className="agent-pulse h-1.5 w-1.5 rounded-full bg-green-400" />
                Live
              </span>
            </div>
          </div>

          {/* Fleet summary bar */}
          <div className="border-b border-border/30 bg-[#0b0c11] px-4 py-2.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                <span className="font-medium text-foreground/80">{agents.length}</span> agents
              </span>
              <span className="text-border">·</span>
              <span>
                <span className="font-mono font-medium text-foreground/80 tabular-nums">${totalCost.toFixed(2)}</span> today
              </span>
              <span className="text-border">·</span>
              <span>
                <span className="font-mono font-medium text-foreground/80 tabular-nums">{totalTokens.toLocaleString()}</span> tokens
              </span>
              <div className="hidden items-center gap-3 sm:flex sm:ml-auto">
                {healthyCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {healthyCount} online
                  </span>
                )}
                {unhealthyCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {unhealthyCount} degraded
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Agent grid */}
          <div className="bg-[#0a0b10] p-3 sm:p-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {agents.map((agent) => {
                const color = AGENT_COLORS[agent.colorIndex];
                const isActive = agent.state === "thinking" || agent.state === "streaming";
                return (
                <motion.div
                  key={agent.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
                  }}
                  className={`group relative overflow-hidden rounded-xl border bg-gradient-to-b from-[#111118]/90 to-[#0e0f16]/70 p-4 transition-all hover:shadow-lg hover:shadow-black/20 ${
                    isActive
                      ? "border-indigo-500/25 hover:border-indigo-500/40"
                      : "border-[#1e2030]/60 hover:border-[#2a2a3a]"
                  }`}
                >
                  {/* Top accent stripe — agent-colored */}
                  <div className={`absolute inset-x-0 top-0 h-[2px] ${color.stripe} opacity-60 transition-opacity group-hover:opacity-100`} />

                  {/* Header: avatar + name + health */}
                  <div className="mb-3 flex items-start gap-3">
                    {/* Avatar — agent-colored ring */}
                    <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br ${color.gradient} p-0.5`}>
                      <Image
                        src={`/avatars/${agent.avatar}.svg`}
                        alt=""
                        width={40}
                        height={40}
                        sizes="40px"
                        className="h-full w-full rounded-full"
                        aria-hidden="true"
                      />
                      <span
                        className={`absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-[#111118] ${STATE_DOT[agent.state]} ${isActive ? "agent-pulse" : ""}`}
                      />
                    </div>

                    {/* Name / role / model */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {agent.id}
                        </p>
                        <svg className="h-3 w-3 shrink-0 text-gray-600 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className="truncate text-[11px] text-gray-500 mt-0.5">
                        {agent.role}
                      </p>
                      <p className="truncate text-[10px] text-gray-600 mt-0.5">
                        {agent.model}
                      </p>
                    </div>

                    {/* Health badge */}
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${HEALTH_STYLES[agent.health]}`}
                    >
                      {HEALTH_LABEL[agent.health]}
                    </span>
                  </div>

                  {/* Stats with icons */}
                  <div className="space-y-0">
                    <div className="flex items-center justify-between border-b border-gray-800/30 py-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        Activity
                      </span>
                      <span className={`text-[11px] font-medium capitalize ${STATE_LABEL[agent.state]}`}>
                        {agent.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-800/30 py-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                        Heartbeat
                      </span>
                      <span className="text-[11px] font-medium text-pink-400">
                        {agent.heartbeat}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        Cost today
                      </span>
                      <span className="font-mono text-[11px] text-foreground/70 tabular-nums">
                        ${agent.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-1.5 border-t border-gray-800/30 pt-3">
                    <button
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-1.5 text-[11px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Chat
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-400"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                      Pause
                    </button>
                  </div>
                </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
        </div>
      </AnimateIn>
    </SectionWrapper>
    </div>
  );
}
