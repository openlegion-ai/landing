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
  state: string;
  health: string;
  cost: number;
  tokens: number;
}

const INITIAL_AGENTS: Agent[] = [
  { id: "researcher", role: "Lead Researcher", model: "claude-sonnet-4-6", avatar: 3, state: "streaming", health: "healthy", cost: 1.24, tokens: 18420 },
  { id: "engineer", role: "Code Engineer", model: "claude-sonnet-4-6", avatar: 7, state: "thinking", health: "healthy", cost: 3.87, tokens: 42100 },
  { id: "reviewer", role: "PR Reviewer", model: "gpt-4o", avatar: 12, state: "idle", health: "healthy", cost: 0.56, tokens: 8930 },
  { id: "writer", role: "Content Writer", model: "claude-haiku-4-5", avatar: 21, state: "tool", health: "healthy", cost: 0.18, tokens: 12450 },
  { id: "qualifier", role: "Lead Qualifier", model: "gemini-2.0-flash", avatar: 15, state: "idle", health: "unhealthy", cost: 0.42, tokens: 5200 },
  { id: "outreach", role: "Sales Outreach", model: "claude-sonnet-4-6", avatar: 28, state: "streaming", health: "healthy", cost: 2.15, tokens: 31840 },
];

const STATE_CYCLE = ["streaming", "thinking", "tool", "idle"] as const;

const STATE_DOT: Record<string, string> = {
  thinking: "bg-accent",
  streaming: "bg-success",
  tool: "bg-amber-400",
  idle: "bg-muted/40",
};

const STATE_LABEL: Record<string, string> = {
  thinking: "text-accent-light",
  streaming: "text-success",
  tool: "text-amber-400",
  idle: "text-muted/60",
};

const HEALTH_STYLES: Record<string, string> = {
  healthy: "bg-success/10 text-success border-success/20",
  unhealthy: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};

const HEALTH_DOT: Record<string, string> = {
  healthy: "bg-success",
  unhealthy: "bg-amber-400",
};

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function DashboardPreview() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const cycleRef = useRef(0);

  // Check prefers-reduced-motion
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // State cycling — one agent advances per tick (every 3s)
  useEffect(() => {
    if (reduceMotion) return;
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
  }, [reduceMotion]);

  // Token/cost ticking for non-idle agents (every 1.5s)
  useEffect(() => {
    if (reduceMotion) return;
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
  }, [reduceMotion]);

  // Derived totals
  const totalCost = useMemo(() => agents.reduce((s, a) => s + a.cost, 0), [agents]);
  const totalTokens = useMemo(() => agents.reduce((s, a) => s + a.tokens, 0), [agents]);
  const healthyCount = useMemo(() => agents.filter((a) => a.health === "healthy").length, [agents]);
  const unhealthyCount = useMemo(() => agents.filter((a) => a.health === "unhealthy").length, [agents]);

  return (
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
        <div className="dashboard-frame rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border/50 bg-[#0d0e14] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="ml-3 flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-accent/10">
                <svg className="h-3 w-3 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <span className="text-xs font-medium text-foreground/70">Fleet Overview</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] text-success">
                <span className="agent-pulse h-1.5 w-1.5 rounded-full bg-success" />
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
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {healthyCount} healthy
                  </span>
                )}
                {unhealthyCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {unhealthyCount} unhealthy
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
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
                  }}
                  className={`group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-[#111118]/90 to-[#0e0f16]/70 p-4 transition-all hover:border-accent/25 hover:shadow-lg hover:shadow-accent/5 ${
                    agent.state === "thinking" || agent.state === "streaming"
                      ? "border-accent/20"
                      : ""
                  }`}
                >
                  {/* Top accent stripe */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-accent/30 opacity-60 transition-opacity group-hover:opacity-100" />

                  {/* Header: avatar + name + health */}
                  <div className="mb-3 flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-accent/30 to-accent/10 p-0.5">
                      <Image
                        src={`/avatars/${agent.avatar}.svg`}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full rounded-full"
                        aria-hidden="true"
                      />
                      <span
                        className={`absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-[#111118] ${STATE_DOT[agent.state]} ${agent.state !== "idle" ? "agent-pulse" : ""}`}
                      />
                    </div>

                    {/* Name / role / model */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground/90">
                        {agent.id}
                      </p>
                      <p className="truncate text-[11px] text-muted/60">
                        {agent.role}
                      </p>
                      <p className="truncate text-[10px] text-muted/40">
                        {agent.model}
                      </p>
                    </div>

                    {/* Health badge */}
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${HEALTH_STYLES[agent.health]}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${HEALTH_DOT[agent.health]}`} />
                      {agent.health}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="space-y-0">
                    <div className="flex items-center justify-between border-b border-border/20 py-1.5">
                      <span className="text-[11px] text-muted/60">Activity</span>
                      <span className={`text-[11px] font-medium capitalize ${STATE_LABEL[agent.state]}`}>
                        {agent.state}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border/20 py-1.5">
                      <span className="text-[11px] text-muted/60">Cost today</span>
                      <span className="font-mono text-[11px] text-foreground/70 tabular-nums">
                        ${agent.cost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-[11px] text-muted/60">Tokens</span>
                      <span className="font-mono text-[11px] text-foreground/70 tabular-nums">
                        {agent.tokens.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-1.5 border-t border-border/20 pt-3">
                    <button
                      className="flex flex-1 items-center justify-center gap-1 rounded-md border border-accent/20 bg-accent/10 px-2 py-1.5 text-[11px] font-medium text-accent-light transition-colors hover:bg-accent/20"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Chat
                    </button>
                    <button
                      className="flex items-center justify-center gap-1 rounded-md border border-border/30 px-2 py-1.5 text-[11px] text-muted/60 transition-colors hover:border-border/50 hover:text-muted"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4v6h6" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                      Restart
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </AnimateIn>
    </SectionWrapper>
  );
}
