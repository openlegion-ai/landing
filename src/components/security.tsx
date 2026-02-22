"use client";

import { Shield, Lock, Key, Fingerprint, ShieldCheck, Type } from "lucide-react";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { SECURITY_LAYERS } from "@/lib/constants";

const LAYER_ICONS = [Shield, Lock, Key, Fingerprint, ShieldCheck, Type];

export function Security() {
  return (
    <SectionWrapper id="security" fade={false}>
      <AnimateIn>
        <div className="mb-16 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
            Security
          </p>
          <h2 className="mb-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            <span className="gradient-text">Six layers</span> of defense
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Designed from day one assuming agents will be compromised. Every layer
            operates independently.
          </p>
        </div>
      </AnimateIn>

      <StaggerContainer className="mx-auto max-w-2xl space-y-3">
        {SECURITY_LAYERS.map((layer, i) => {
          const Icon = LAYER_ICONS[i];
          return (
            <StaggerItem key={layer.number}>
              <div className="card-hover rounded-xl border border-border/50 bg-card/40 p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-accent/15 bg-accent/[0.07]">
                    <Icon className="h-5 w-5 text-accent-light" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="mb-1 text-base font-semibold text-foreground">
                      <span className="mr-2 font-mono text-accent-light">
                        {String(layer.number).padStart(2, "0")}
                      </span>
                      {layer.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">
                      {layer.description}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </SectionWrapper>
  );
}
