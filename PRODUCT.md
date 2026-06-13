# Product

## Register

product

## Users

NetPulse is used by network operators, infrastructure owners, and service administrators who need to inspect network reachability from multiple distributed Agents. They are usually in an operations workflow: confirming whether a Target is healthy, comparing Agents, checking route evidence, and deciding whether a problem is local, regional, upstream, or target-side.

## Product Purpose

NetPulse provides a target-centric monitoring workspace for ICMP, TCP, MTR, IPERF3, and Route Trace checks. Success means users can move from "something looks wrong" to "which Agent, protocol, route, or time window explains it" without losing context or waiting through distracting refresh behavior.

## Brand Personality

Precise, restrained, operational.

The interface should feel like a dependable monitoring console: dense enough for repeated use, calm enough for incident review, and explicit about state. It should not feel like a marketing dashboard or a decorative analytics demo.

## Anti-references

- Marketing-style SaaS dashboards with oversized hero metrics and decorative gradients.
- Card-heavy layouts where every data point becomes an isolated tile.
- Decorative glassmorphism, novelty controls, or motion that does not communicate state.
- Low-contrast gray text on dark panels, especially for links, descriptions, table cells, and filter controls.
- Refresh behavior that blanks charts or tables while new monitoring samples arrive.

## Design Principles

1. Keep the Target as the primary context. Protocols, Agents, charts, result timelines, and tables should always read as evidence about the selected Target.
2. Make Agent comparison first-class. When multiple Agents exist, summaries and tables should group by Agent before they group by individual samples.
3. Preserve operational continuity. Auto-refresh should update data in place and keep the previous useful view visible during background work.
4. Use restrained hierarchy. Typography, borders, spacing, and semantic color should clarify state without turning every section into a separate card.
5. Prefer familiar product affordances. Filters, time selectors, tables, empty states, and error states should be predictable and consistent across protocols.

## Accessibility & Inclusion

Aim for WCAG AA contrast for text and controls. Reduced-motion users should not depend on animation to understand state. Color is allowed for protocol and status recognition, but labels and structure must carry the same meaning for color-blind users. Layouts must remain usable on narrow screens without text overflow or hidden actions.
