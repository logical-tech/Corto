# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router for the public site and management console; React, shadcn/ui, Zod and TanStack Query on the client. A separate Bun + Hono API is the source of truth and can run without the GUI. PostgreSQL stores durable data and shared Redis accelerates redirects and auth state.

## Users

Developers, marketers and small teams that need to create short links, share them through a GUI or API, and understand how those links perform.

## Product Purpose

Create reliable short URLs, redirect them quickly, and make click performance understandable at both account and individual-link level. Success means the same workflows are complete through the management console and through documented API keys.

## Positioning

One self-hostable service combines a fast prefixed Redis redirect path, durable PostgreSQL analytics, a clean management console and a first-class external API without requiring a hosted vendor.

## Operating Context

Users create and manage links in a signed-in console or from CI, scripts and third-party systems using API keys. Deployment targets Docker and Dokploy while reusing externally managed PostgreSQL and Redis services.

## Capabilities and Constraints

- Email/password authentication uses Better Auth.
- Users can create, list, update, disable and delete their own short links.
- Redirects use Redis keys under a configurable application prefix and fall back to PostgreSQL on cache miss.
- Clicks are recorded without persisting raw IP addresses and feed general and per-link reports.
- External API access uses revocable API keys and documented versioned endpoints.
- The GUI and API are independently deployable from one Dockerfile; a no-GUI Compose definition runs only the API.
- Redis and PostgreSQL are shared external services and are not created by Compose.
- The final public domain, optional OAuth providers, transactional email provider and commercial claims remain open decisions.

## Brand Commitments

“Corto” is the product name. The requested tone is modern, minimal and approachable, with the simplicity of Kinde authentication surfaces.

## Evidence on Hand

No customer logos, testimonials, benchmarks or production usage data were provided; future surfaces must not fabricate them. Product demonstrations may use clearly labeled sample data.

## Product Principles

- Fast on the redirect path, clear everywhere else.
- GUI and API are equal entry points to the same capabilities.
- Self-hosting should require configuration, not source changes.
- Analytics should be useful without collecting unnecessary personal data.
- Prefer a small, understandable stack over speculative infrastructure.

## Accessibility & Inclusion

Keyboard navigation, visible focus, semantic structure, sufficient contrast, reduced-motion support and responsive behavior are baseline requirements.
