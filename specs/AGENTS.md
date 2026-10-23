# AGENTS.md: How to work from these docs

For teammates and AI agents. Read this first, then `README.md`.

> **Implementation work:** read the repository root [`AGENTS.md`](../AGENTS.md) before touching code. It adds the token, i18n, verification, and skill-routing rules.
>
> **V1 authority:** `09-v1-design-lock.md` supersedes files `01`–`08` where they conflict. Read it before building v1.

## Rules

1. **Read the relevant doc before building.** Each system has one file. Do not guess rules.
2. **Respect the status tags.**
   - LOCKED: never change without product-owner approval.
   - DEFAULT: implement it as written, but keep the value in config, not hardcoded.
   - TBD: stop and ask. Do not invent a rule.
3. **Server decides everything.** Combat, resources, trades, research, and timing are calculated on the server. The client only displays state and sends intents (e.g., "send 40 troops from A to B").
4. **All numbers live in config files** (JSON/TypeScript constants), never scattered in logic. Every DEFAULT number must be easy to tune.
5. **No real names.** Countries, leaders, parties, and weapons use invented or generic names ("Light Tank", not a real model). No real political content.
6. **No pay-to-win.** Never add anything purchasable that affects match power. Persistent unlocks are cosmetic only.
7. **Keep it clear.** If a screen needs more than a few numbers to understand, simplify it. Pixel art, low-res, big numbers.
8. **Time is server time (UTC).** The war window, season days, and era gates all use server time.
9. **Small tasks.** Build in the v1 order from `09-v1-design-lock.md` (§17). `08` remains the original roadmap. Each milestone must be playable before starting the next.
10. **Log new assumptions.** If you had to assume something, add it to the "Open questions" section of `09-v1-design-lock.md` and mark it DEFAULT. For the original vision, use `08` as well.

## Naming conventions

- Resources: `money`, `gold`, `food`, `water`, `oil`
- Eras: `era1_ww1`, `era2_ww2`, `era3_modern`, `era4_advanced`
- Unit types: `infantry`, `tank`, `aircraft`, `missile`
- Phases: `peace`, `war`
- Statuses in docs: `LOCKED`, `DEFAULT`, `TBD`

## Definition of done (per feature)

- Matches the relevant doc.
- Numbers come from config.
- Works with the server as the source of truth.
- Has at least one automated test for its core rule.
- Readable on a phone-sized screen.
