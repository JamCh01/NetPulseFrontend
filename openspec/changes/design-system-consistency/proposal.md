# Proposal: design-system-consistency

## Summary
This change aligns NetPulse Frontend’s global design-system behavior by unifying typography strategy and making theme-state behavior intentional and predictable.

## Motivation
Current styling includes conflicting font intentions (loaded font vs enforced font declarations) and a partially integrated theme state path. This increases long-term UI drift risk and makes global appearance behavior harder to reason about.

## Scope
In scope:
- Align font strategy across global CSS tokens and base layer usage.
- Ensure theme-state behavior is intentionally wired or explicitly simplified.

Out of scope:
- New responsive layout refactors.
- Interaction/touch target tuning.
- Page-level information density redesign.
- Feature-specific visual rebranding.

## Affected Files
- `src/index.css`
- `src/stores/theme-store.ts`
- `src/main.tsx`

## Proposed Changes
1. Typography system unification
- Choose one intentional primary UI font strategy and apply it consistently in token declarations and base layer.
- Remove contradictory declarations that can produce unpredictable fallback behavior.

2. Theme state integration
- Ensure app startup applies and preserves theme state predictably.
- Keep theme class behavior explicit and consistent with runtime expectations.
- If dead/unreachable theme logic remains, simplify to a single authoritative path.

## Acceptance Criteria
- Global font behavior is defined by one coherent strategy and reflected consistently in app runtime.
- Theme behavior is deterministic across page refresh and app startup.
- No regression in existing dark-first visual baseline unless intentionally specified.

## Risks and Mitigations
- Risk: font unification changes visual metrics (line breaks, spacing, card density).
  - Mitigation: validate key pages (auth, monitoring, tasks, dashboard) at common breakpoints.
- Risk: theme wiring changes initial paint behavior.
  - Mitigation: verify startup class application and post-refresh consistency.

## Rollout Plan
1. Consolidate typography declarations in global CSS.
2. Align theme initialization path in store and app entry.
3. Verify visual consistency and startup behavior.
4. Merge before final polish-oriented changes.

## Dependencies
- Should land after `interaction-and-responsive-baseline` to avoid interleaving foundational token/runtime changes with layout/interaction tuning.
