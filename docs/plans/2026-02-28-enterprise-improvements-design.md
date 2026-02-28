# Enterprise Landing Page Improvements — Design Document

**Date:** 2026-02-28
**Goal:** Strengthen the landing page for enterprise buyers by adding trust signals, enterprise-specific messaging, and navigation improvements.

## Context

Competitive analysis of CrewAI revealed key gaps: no enterprise CTA, no social proof, no enterprise-specific messaging. Since we're pre-customer (no logos, no case studies), we lean into technical trust signals — translating existing features into enterprise buyer language (governance, compliance, auditability, on-prem).

## Changes

### 1. New "Built for Enterprise" Section

**Position:** Between Security and Quickstart in page.tsx.

6-card grid of enterprise trust signals:
- On-Premises Deployment
- Audit-Ready Codebase
- Deterministic Workflows
- Credential Isolation
- Per-Agent Cost Governance
- Role-Based Access

Each card has an icon, title, and 1-2 sentence description using enterprise language (SOC 2, audit, governance, compliance, least-privilege).

### 2. Hero Subtitle Update

Append "Self-hosted. Auditable. Enterprise-ready." to the existing subtitle.

### 3. Add Security to Nav

Add "Security" link to NAV_LINKS in constants.ts, positioned after "Architecture".

### 4. Files Changed

- `src/lib/constants.ts` — add ENTERPRISE_FEATURES, update HERO.subtitle, add Security nav link
- `src/components/enterprise.tsx` — new component
- `src/app/page.tsx` — add Enterprise import and render between Security and Quickstart
