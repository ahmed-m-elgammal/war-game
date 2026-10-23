# 08 — V1 Screens & HUD

> **Status:** DRAFT for review — 2026-10-23.
> **Authority:** subordinate to `specs/09-v1-design-lock.md`. If this document conflicts with `09`, `09` wins.
> **Scope:** v1 screen inventory, visual direction, HUD layout, phone wireframes, states, permissions, and acceptance checks.
> **Not in scope:** final art files, implementation code, balance values, legal copy, or a full brand book.
> **Status tags:** `LOCKED` only when quoting a rule already locked in `09`. New screen decisions are `APPROVED` (user decision for this doc) or `DOC DEFAULT` (decided here, still needs G0 promotion). Open items are `TBD`.

---

## 0. What this document decides

These choices were made explicitly for this document. They are not new game rules, and they do not override `09`.

| # | Decision | Status |
|---:|---|---|
| 1 | Deliverable is a written spec plus ASCII wireframes; no visual mockups. | APPROVED |
| 2 | All surfaces are covered: 13 game/meta, 1 optional war-planner sub-surface, 4 system surfaces. | APPROVED |
| 3 | The HUD is a **map-first war room**, not a Clash-style village dashboard. | APPROVED |
| 4 | Visual treatment is **warm paper field map + ink HUD**. | APPROVED |
| 5 | Bottom nav is 5 items: Research, Trade, Alliance, Army, Pass. Profile, Shop, and Settings live behind the top-left avatar. | APPROVED |
| 6 | Non-map screens use a hybrid presentation: sheets for province/incoming, full screens for meta screens. | APPROVED |
| 7 | Desktop uses a wider map plus a right-side context panel, not a separate dashboard. | APPROVED |
| 8 | Phone top bar is two rows: support + war clock, then five resources. | APPROVED |
| 9 | Every surface gets a phone wireframe; desktop gets written layout notes only. | APPROVED |
| 10 | Every screen entry uses the full spec template: purpose, entry/exit, layout, components, actions, data, permissions, states, desktop, acceptance. | APPROVED |
| 11 | Starter design tokens are defined here: colors, fonts, spacing, borders, motion. | APPROVED |
| 12 | Display font is **Silkscreen**; body font is **Inter**. | APPROVED |
| 13 | Up to 24 factions are distinguished by **8 color families + patterns + emblems**, never color alone. | APPROVED |
| 14 | Icons are **16×16 pixel icons**, 1px ink outline, nearest-neighbor. | APPROVED |
| 15 | Screen title is **Market**; bottom-nav label is **Trade**. | APPROVED |
| 16 | Guest onboarding is a 3-step flow. | APPROVED |
| 17 | With exactly one open world, onboarding goes straight to the map; the world list is shown when needed. | APPROVED |
| 18 | Tutorial is 5 spotlight cards, dismissible, never forced again after first capture. | APPROVED |
| 19 | Province panel opens as a compact ~40% peek sheet. | APPROVED |
| 20 | Attack uses a compact confirm sheet by default, with an optional full-screen **War Planner**. | APPROVED |
| 21 | Battle report is full-screen. | APPROVED |
| 22 | Incoming attack is a persistent alert plus an optional panel, never a forced modal. | APPROVED |
| 23 | Market uses 3 tabs: Listings / Offers / Exchange. | APPROVED |
| 24 | Research uses an era timeline plus branch cards, not a pan-and-zoom tree. | APPROVED |
| 25 | Alliance emphasizes roster, lock status, and invites; there is no chat. | APPROVED |
| 26 | Army / Orders uses 3 tabs: Armies / Build / Training. | APPROVED |
| 27 | Pass uses a scrollable free/premium reward track. | APPROVED |
| 28 | Shop uses a featured row plus a category grid. | APPROVED |
| 29 | Profile uses an identity header plus 4 tabs: Cosmetics / History / Account / Settings. | APPROVED |
| 30 | World list uses world cards with status and a join action. | APPROVED |
| 31 | Season recap leads with the player's personal result and title. | APPROVED |
| 32 | Loading is map-first and skeuomorphic; reconnect is a carved-ink panel. | APPROVED |
| 33 | Account linking is a post-first-capture prompt plus a Profile entry, never a forced block. | APPROVED |
| 34 | Accessibility baseline: WCAG AA contrast, pattern/emblem redundancy, 44px targets, reduced motion, 200% text scaling, screen-reader labels, visible focus. | APPROVED |
| 35 | This doc is UI-only for analytics; instrumentation is TBD until PC-04 is resolved. | APPROVED |
| 36 | Base palette is muted field-map. | APPROVED |
| 37 | Map defaults to fit-width; pinch/double-tap zoom and drag pan; no minimap or +/− buttons. | APPROVED |
| 38 | War clock is a phase-colored ring plus countdown. | APPROVED |
| 39 | Support meter is a continuous bar with threshold ticks plus the exact number. | APPROVED |
| 40 | Resource values are abbreviated in the top bar; exact values on tap. | APPROVED |

---

## 1. Screen count

**18 surfaces total:**

- **13 game/meta surfaces** from `09` §13.2.
- **1 optional sub-surface:** War Planner, reached from the attack sheet.
- **4 system surfaces:** Splash/Loading, Guest Onboarding, Account Link, Reconnect/Error.

```text
13 game/meta
  + 1 war planner
  + 4 system
  = 18 surfaces
```

Attack confirmation, resource breakdown, war-clock detail, avatar menu, ability targeting, and purchase confirmation are **reusable overlays**, not top-level surfaces. They are specified in §6 (with the compact M-03–M-10 table at the end of that section).

---

## 2. Surface inventory

| ID | Surface | Group | Presentation | HUD | Primary action | UI slice |
|---|---|---|---|---|---|---|
| S-01 | Splash / Loading | System | Full screen, immersive | None | Wait / Retry | U0 |
| S-02 | Guest Onboarding | System | 3-page full-screen flow | None | Continue / Enter world | U0 |
| S-03 | World List | Game/meta | Full screen, simplified header | Header only | Join / Enter / Inspect | U0 |
| S-04 | Map / HUD | Game/meta | Full screen | Full | Select province / issue orders | U0 |
| S-05 | Province Panel | Game/meta | Bottom sheet over map | Top bar visible; nav covered | Context action | U0 |
| S-06 | Research | Game/meta | Full screen | Full | Buy tech | U3 |
| S-07 | Market | Game/meta | Full screen, 3 tabs | Full | Trade | U4 |
| S-08 | Alliance | Game/meta | Full screen | Full | Invite / accept / leave | U4 |
| S-09 | Army / Orders | Game/meta | Full screen, 3 tabs | Full | Cancel / recall / queue | U1 |
| S-10 | Pass | Game/meta | Full screen, scrollable track | Full | Claim / buy | U6 |
| S-11 | Shop | Game/meta | Full screen, featured + grid | Full | Buy / equip | U6 |
| S-12 | Profile | Game/meta | Full screen, 4 tabs | Full | Equip / manage account | U5 |
| S-13 | Incoming Attack | Game/meta | Bottom sheet over map | Top bar visible; nav covered | Reinforce / retreat / hold | U2 |
| S-14 | Battle Report | Game/meta | Full screen, immersive | None | Read / return | U0 |
| S-15 | Season Recap | Game/meta | Full screen, immersive | None | Join next world | U7 |
| S-16 | War Planner | Optional sub-surface | Full screen, immersive | None | Confirm attack | U2 |
| S-17 | Account Link | System | Modal sheet over current screen | Dimmed behind | Link / continue as guest | U1 |
| S-18 | Reconnect / Error | System | Full screen, immersive | None | Retry / return | U0 |

**UI slices** (`U0`–`U7`) are the recommended client delivery order for this document. They are not the `P0`–`P13` implementation phases or the `P0`/`P1`/`P2` priorities in `07`. Navigation entries may exist as stubs before their surface's slice is complete.

### 2.1 Reusable overlays

| ID | Overlay | Trigger | Notes |
|---|---|---|---|
| M-01 | Attack Confirm | Province → Attack | Replaces the province sheet; not stacked. |
| M-02 | Abilities | Province → Abilities, or Army → Abilities | War-only; target mode follows. |
| M-03 | Resource Breakdown | Tap any top-bar resource | Stockpile, cap, income, upkeep, net. |
| M-04 | War Clock Detail | Tap the war clock | Phase, next transition, war beats, local time. |
| M-05 | Avatar Menu | Tap avatar | Profile, Shop, Map key, Change world, Settings, Link. |
| M-06 | Purchase Confirm | Shop / Pass buy | Native store sheet; app shows pending state. |
| M-07 | Create Listing / Offer | Market → Create | Form in the current layer. |
| M-08 | Destructive Confirm | Leave, kick, recall, sign out | Replaces current sheet content; attack has its own M-01 confirm. |
| M-09 | Map Key | Avatar menu | Legend for colors, patterns, icons, bands. |
| M-10 | Battle History | Army → Battle history | List of reports; opens S-14. |

---

## 3. Visual direction

### 3.1 One-line direction

**A warm paper war map pinned to a dark ink operations board: chunky province colors, stamped labels, pixel icons, big numbers, and one loud war clock.**

The map is the game. The HUD is the rim of the table, not a dashboard bolted on top.

### 3.2 The Clash correction

Clash of Clans is a useful reference for **clarity**, not for **structure**.

| Clash pattern | Use it? | Our version |
|---|---|---|
| Village/base is home | **No** | The province map is home. There is no village screen. |
| Persistent bottom shop/army bar | **Partial** | Five-item bottom nav plus an avatar menu. Shop is not in the nav. |
| Collector bubbles on buildings | **No** | Province production is explained in the province panel. |
| Builder huts / builders | **No** | One national build queue, one national training queue. |
| Big resource bars | **Yes** | Two-row top bar with five compact resource chips. |
| One-thumb actions | **Yes** | Bottom sheets, 48px primary buttons, thumb-reachable actions. |
| Timers and badges | **Yes** | Queue, march, protection, and claim timers; nav badges. |
| Shield and star icons | **Yes** | Protection shield, capital star. |
| Chat / clan chat | **No** | No chat in v1. Alliance status replaces conversation. |
| Base layout / decoration | **No** | Cosmetic capital monuments and map pins only. |

### 3.3 Map-first rules

1. The map is the home screen and the menu.
2. The top bar never leaves the map or a primary meta screen.
3. The war clock is the loudest persistent element.
4. Tapping a province opens a context sheet; the map stays visible behind it.
5. Meta screens keep the global HUD so resources and the clock never disappear.
6. Immersive screens are reserved for moments: onboarding, war planning, battle result, season recap, reconnect.
7. There is no separate base, inventory, campaign, or tactical battle screen.

### 3.4 Visual principles

- **Paper, not glass.** Flat fills, ink lines, hard offset shadows, no blur, no glassmorphism.
- **Big decisions, small details.** The number a player acts on is 16–20px; detail is 11–12px.
- **One primary action per surface.** Everything else is secondary or tertiary.
- **Pattern is information.** Faction patterns, rebel hatching, refugee dashes, and protection shields are not decoration.
- **The war window changes the room.** During war, the clock turns oxblood and a 2px inner frame appears around the map.
- **No hidden modifiers.** The battle report shows every multiplier that affected the result.
- **No dead buttons.** If a rule is TBD, the control is hidden or explicitly disabled with a reason.
- **The only CRT accent** is a 1px scanline or terminal tick inside the war clock and alert icons. There is no screen-wide CRT filter.
- **Wireframe names, numbers, timers, and dates are illustrative** unless they are tied to a rule in `09`; balance values live in config. Separate wireframes are not one continuous save.

---

## 4. Design tokens

### 4.1 Master palette — 16 colors

`09` specifies a 16-color palette. This is the starter set. Opacity tints are allowed; new hues are not.

| Token | Hex | Role |
|---|---|---|
| `paper` | `#F2E6CE` | Base map paper, screen background, sheet surface. |
| `paper-dark` | `#E2D2B4` | Recessed surfaces, skeletons, disabled fills. |
| `white` | `#FFF9EC` | Text/icons on ink; highlight edge. |
| `ink` | `#211B14` | Primary text, borders, primary buttons. |
| `ink-soft` | `#4A4033` | Secondary text, inactive icons, hairline detail. |
| `oxblood` | `#A33A2B` | War, danger, attack, uprising, destructive actions. |
| `rust` | `#B4673F` | Serious unrest, hostile accent, faction family 6. |
| `mustard` | `#C49A3A` | Warning, highlights, money resource, faction family 2. |
| `gold` | `#F2C94C` | Gold resource, selection glow, premium highlight. |
| `olive` | `#6F7A4C` | Peace, success, stable support, food resource, faction family 3. |
| `water` | `#5B8FA8` | Water resource, info, faction family 4. |
| `plum` | `#7D5A7A` | Faction family 5. |
| `slate` | `#5E6B73` | Faction family 7. |
| `teal` | `#3F7F7A` | Faction family 8. |
| `neutral` | `#C9B896` | Neutral province fill only. |
| `black` | `#0F0D0A` | Oil resource, deepest shadow, ink-on-ink detail. |

**8 faction color families:** oxblood, mustard, olive, water, plum, rust, slate, teal.

**Resource mapping:**

| Resource | Color | Icon treatment |
|---|---|---|
| Money | mustard | Stacked coin / treasury mark. |
| Gold | gold | Single ingot / crown mark. |
| Food | olive | Wheat sheaf. |
| Water | water | Droplet. |
| Oil | black | Barrel / drop with white highlight. |

**Contrast rule:** body text is `ink` on `paper` or `white` on `ink`. Oxblood is allowed for short labels and icons. Mustard, gold, olive, water, plum, rust, slate, and teal are **not** used for small text on paper; they are fills, icons, borders, and large labels with an ink outline.

### 4.2 Faction identity

Each faction gets:

- **1 color family** (8 options).
- **1 emblem** from 24 curated presets.
- **1 pattern** assigned at join time (8 options: solid, diagonal, dots, crosshatch, horizontal, vertical, checker, outline).

That is 8 families × 8 patterns × 24 emblems, far more than 24 players need. The pattern is assigned to avoid duplicate family+pattern combinations within a world. The player chooses color and emblem; the server assigns the pattern.

**Map fill:**

- Own: faction color at 65% over paper, pattern at 18% ink.
- Ally: shared alliance fill — the alliance **leader's color family** at 65% over paper — plus the member's personal pattern at 18% ink and a small alliance emblem in the panel. The shared fill is the group cue required by `09`; the personal pattern and emblem keep identity readable. (DOC DEFAULT: leader-color mapping.)
- Enemy: faction color at 55%, pattern; no emblem on the map.
- AI: faction color desaturated to 70%.
- Neutral: `neutral` fill, no pattern.
- Rebel: 45° oxblood/black hatch, no owner.
- Refugee: paper fill, 2px dashed ink border.
- Selected: 2px ink outline + 2px gold outer edge.
- Protected: 12px shield badge, top-right.
- Capital: 12px gold star badge, top-left.

> **`09` alignment:** `09` says allies share a map color. This doc uses the alliance leader's color family as the shared fill; each member's pattern and emblem preserve personal identity. The leader-color mapping is a DOC DEFAULT to confirm at G0, not a change to the locked rule.

### 4.3 Typography

Both fonts are self-hosted WOFF2; no third-party font CDN.

| Token | Font | Size / line | Weight | Use |
|---|---|---|---:|---|
| `display-xl` | Silkscreen | 28 / 32 | 700 | Season recap hero. |
| `display-l` | Silkscreen | 20 / 24 | 700 | Screen titles. |
| `display-m` | Silkscreen | 16 / 20 | 700 | Section titles, big numbers. |
| `display-s` | Silkscreen | 12 / 16 | 400/700 | Resource values, labels, stamped headers. |
| `body-l` | Inter | 16 / 24 | 500 | Primary reading, sheet body. |
| `body-m` | Inter | 14 / 20 | 400 | Standard body. |
| `body-s` | Inter | 12 / 16 | 400 | Secondary details. |
| `caption` | Inter | 11 / 14 | 500 | Helper text, timestamps. |
| `micro` | Inter | 10 / 12 | 600 | Badges, tiny meta. |

Rules:

- Silkscreen is used for short labels, titles, and short numbers. Never for sentences.
- Inter is used for all body copy, buttons, errors, and long numbers.
- Timers use Inter with `font-variant-numeric: tabular-nums`.
- No text below 10px.
- At 200% text scaling, layout reflows; nothing is clipped. Resource chips become horizontally scrollable; bottom-nav labels hide and icons retain accessible names.

### 4.4 Spacing and sizing

| Token | Value | Use |
|---|---:|---|
| `space-1` | 4px | Hairline gaps. |
| `space-2` | 8px | Inline gaps, chip padding. |
| `space-3` | 12px | Card gaps, compact padding. |
| `space-4` | 16px | Screen gutter, card padding. |
| `space-5` | 20px | Section inner padding. |
| `space-6` | 24px | Section gap. |
| `space-8` | 32px | Large section gap. |
| `space-10` | 40px | Hero spacing. |
| `space-12` | 48px | Full-screen breathing room. |
| `tap-min` | 44px | Minimum touch target. |
| `tap-primary` | 48px | Primary button height. |
| `topbar-h` | 88px | Two-row phone top bar content. |
| `nav-h` | 64px | Bottom navigation content. |
| `sheet-peek` | 40vh | Province/incoming peek. |
| `sheet-expanded` | 80vh | Expanded sheet. |
| `icon-sm` | 16px | Resource/unit icons. |
| `icon-md` | 24px | Bottom-nav icons. |
| `icon-lg` | 32px | Emblems, empty states. |

### 4.5 Borders, radii, shadows

| Token | Value | Use |
|---|---|---|
| `border` | `1px solid var(--ink)` | Default card, input, sheet edge. |
| `border-strong` | `2px solid var(--ink)` | Selected, focused, warning. |
| `border-danger` | `2px solid var(--oxblood)` | Incoming attack, destructive. |
| `radius-xs` | 2px | Chips, badges, resource chips. |
| `radius-sm` | 4px | Buttons, cards, inputs. |
| `radius-md` | 8px | Sheets, modals. |
| `shadow-hard` | `2px 2px 0 rgba(33, 27, 20, 0.25)` | Cards, primary buttons. |
| `shadow-lift` | `4px 4px 0 rgba(33, 27, 20, 0.22)` | Modals, sheets. |

No soft shadows, no blur, no gradients except a very subtle paper grain at ≤3% opacity. The pixel map is nearest-neighbor, no anti-aliasing.

### 4.6 Motion and haptics

| Token | Value | Use |
|---|---|---|
| `motion-fast` | 120ms | Button press, chip select. |
| `motion-base` | 180ms | Tabs, fades, modal. |
| `motion-sheet` | 240ms | Sheet up/down. |
| `ease-sheet` | `cubic-bezier(0.2, 0, 0, 1)` | Sheets, drawers. |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Fades, scale. |

Rules:

- Reduced motion: opacity-only 120ms; no pulse, slide, scale, or parallax.
- War clock pulses only in the final 15 minutes of war; reduced motion uses a static oxblood ring.
- Incoming attack province ring pulses at 1Hz; reduced motion uses a static 3px ring.
- Haptics are optional and respect OS settings:
  - light: tab change, chip select.
  - medium: send attack, confirm purchase.
  - success: capture, reward claim.
  - warning: incoming attack, support threshold.
- Web has no haptics.

**Audio cues (minimal, DEFAULT):**

| Cue | Trigger | Notes |
|---|---|---|
| `ui_tick` | Nav, tab, chip, button | Very soft, ≤40ms. |
| `march_drums` | Attack sent | One short cue, not a loop. |
| `battle_impact` | Battle report opens | Low hit; no gore. |
| `war_horn` | War starts | Once per session/world; respects mute. |
| `capture` | Capture result | Short rising motif. |
| `purchase` | Entitlement confirmed | Soft coin/chime; no casino sparkle. |
| `error` | Command rejected | Low thud; never a harsh buzzer. |
| `ambient_map` | Map only | Low-volume loop; pauses on immersive screens. |

No voice, no chat sounds, no music until a music decision exists. Mute and volume live in Profile → Settings.

- Meta screens enter with a 180ms fade + 8px rise; sheets slide up; battle report fades in from ink. Reduced motion uses a 120ms opacity fade only.

### 4.7 Z-index

| Layer | Z |
|---|---:|
| Map canvas | 0 |
| Map markers/armies | 10 |
| Map stamp/recenter | 20 |
| Top bar | 100 |
| Bottom nav | 100 |
| Alert stack | 120 |
| Sheet | 200 |
| Modal | 300 |
| Toast | 400 |
| Debug | 999 |

The sheet sits above the bottom nav, so the nav is covered while a sheet is open. The top bar remains visible. Critical alerts collapse into the sheet header while a sheet is open.

### 4.8 Iconography and emblems

- **16×16 pixel grid**, 1px ink outline, 2px internal detail, transparent background.
- Nearest-neighbor only; render at integer 1×/2×/3×. No fractional scaling, no anti-aliasing.
- **29 icons:** 5 resources, 16 unit icons (4 unit types × 4 eras), and 8 UI/nav/meta icons (research, trade, alliance, army, pass, profile, shop, settings).
- Unit icons use simplified NATO-ish block symbols, never real equipment silhouettes.
- **24 curated emblems**, 32×32, 1–2 colors plus ink outline. No uploads, no user images.
- Map glyphs are separate: capital star, protection shield, army dot, march arrow, incoming ring, rebel hatch, refugee dash.
- No emoji as UI icons. No icon fonts; ship SVGs or a sprite sheet.

---

## 5. Layout system

### 5.1 Phone — 390 × 844 baseline

```text
┌──────────────────────────────────────┐
│ Z1  TOP BAR — 88px                   │
│     row 1: avatar · support · clock  │
│     row 2: five resource chips       │
├──────────────────────────────────────┤
│                                      │
│ Z2  MAP / CONTENT — fills            │
│                                      │
│ Z3  ALERT STACK — top of content     │
│ Z4  CONTEXT SHEET — 40% or 80%       │
│                                      │
├──────────────────────────────────────┤
│ Z5  BOTTOM NAV — 64px                │
└──────────────────────────────────────┘
```

- Safe area top: `max(8px, env(safe-area-inset-top))`.
- Safe area bottom: `max(8px, env(safe-area-inset-bottom))`.
- Screen gutter: 16px.
- Map height: `100dvh − safe-top − 88 − 64 − safe-bottom`.
- On a 390×844 device with 47px top and 34px bottom insets, the map is about 611px tall.
- The top bar and bottom nav are fixed. The map is not.
- No horizontal scroll at 390px.

### 5.2 Breakpoints

| Width | Layout |
|---|---|
| 0–359px | Compact phone. Resource row scrolls horizontally; nav labels may hide. |
| 360–767px | Standard phone. Baseline layout above. |
| 768–1023px | Tablet. One-row top bar if it fits; content max 720px; sheets become 480px centered drawers. |
| ≥1024px | Desktop. One-row top bar; map on the left; right context panel 380px; bottom nav centered max 720px. |

### 5.3 Desktop

```text
┌────────────────────────────────────────────────────────────┐
│ TOP BAR — one row: avatar · support · resources · clock     │
├──────────────────────────────────────┬─────────────────────┤
│                                      │                     │
│              MAP                     │  CONTEXT PANEL      │
│                                      │  380px              │
│                                      │  province / detail  │
│                                      │                     │
├──────────────────────────────────────┴─────────────────────┤
│                BOTTOM NAV — centered, max 720px             │
└────────────────────────────────────────────────────────────┘
```

- The right panel replaces the province/incoming sheet and the detail rail on meta screens.
- The bottom nav stays. Do not introduce a separate desktop dashboard in v1.
- Hover is an enhancement, never the only way to act.
- Keyboard focus is always visible.

### 5.4 Top bar

```text
┌──────────────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62       ◷ PEACE 2:14     │  44px
├──────────────────────────────────────────────┤
│ [M]1.2k  [G]340  [F]2.1k  [W]800  [O]120    │  44px
└──────────────────────────────────────────────┘
```

- **Avatar:** 32×32, 1px ink border, faction emblem; tap opens M-05.
- **Support:** continuous bar, 4 tick marks at 15/25/40/60, exact number. Tapping opens support detail (M-03 variant).
- **War clock:** 96–108px; ring 24px + phase/time; tap opens M-04.
- **Resource chips:** five equal flex chips; icon 16px + abbreviated value; 2px storage fill at the bottom; tap opens M-03.
- Resource abbreviations: `1.2k`, `12.4k`, `1.2m`; exact value on tap.
- Storage fill turns mustard at 90%, oxblood at cap.
- During war, the war clock ring is oxblood and the map gets a 2px inner oxblood frame.
- During the final 15 minutes of war, the clock pulses at 1Hz; reduced motion is static.

### 5.5 Bottom navigation

```text
┌──────────────────────────────────────────────┐
│  RESEARCH    TRADE    ALLIANCE    ARMY   PASS│
│     [R]       [T]       [A]        [M]    [P]│
└──────────────────────────────────────────────┘
```

- Five equal items, 64px tall.
- Icon 24px, label 10px Silkscreen.
- Active: 2px oxblood line above the icon; label ink.
- Inactive: ink-soft icon/label.
- Badge: 16px oxblood square, white number, top-right of icon; max `9+`.
- Tap active item: scroll content to top or no-op.
- No Shop item. Shop is in the avatar menu.
- Keyboard shortcuts `1`–`5` when the map has focus.

### 5.6 Sheets and modals

- Peek sheet: 40vh, 8px top radius, drag handle 24×4px, 1px ink top border, paper surface.
- Expanded sheet: 80vh; map scrim 20% ink only above 60% expansion.
- Drag down or tap the map to close.
- One sheet at a time. Opening Attack Confirm replaces the province sheet content.
- Confirmation dialogs replace the current sheet content; they do not stack.
- Modals: centered, max 360px on phone, 480px on tablet/desktop, 8px radius, 1px ink border, hard lift shadow.
- Native IAP store sheets are OS-level and not styled by the game.

### 5.7 Global states

| State | Design |
|---|---|
| Loading | Skeleton blocks in paper-dark; no blank screen; optional 3-dot ink stamp. |
| Empty | 32px ink icon + one sentence + one primary action. |
| Error | Inline 1-line banner above the action; preserve form state; retry. |
| Offline | S-18 full-screen; no offline play. |
| Disabled | Paper-dark fill, ink-soft text, lock icon, reason line. |
| Pending | Button shows inline 16px progress; no optimistic resource changes. |
| Success | State change + 4s toast; no confetti except season recap. |
| Destructive | Action-specific confirm copy, not “OK.” |
| Locked | Lock icon + requirement text; never color alone. |
| Purchase | Native store sheet; app shows pending/receipt confirmation. |

### 5.8 Server-authority UI rule

The client never shows a resource deduction, capture, or queue change until the server acknowledges it.

- On send: button becomes pending, label changes to “Sending…”.
- On ack: update state and close the sheet.
- On rejection: keep the sheet open, show the server reason in a 1-line banner, restore the button.
- On connection loss during a command: show “Checking…” on reconnect; do not let the player send a duplicate.

---

## 6. Surface specs

Each spec uses the same template. “HUD” means the global top bar and bottom nav from §5. “Immersive” means no global HUD. Data and permissions are combined in one field because visibility is a property of the data: no screen exposes a value its viewer is not allowed to see.

---

### S-01 — Splash / Loading

- **Purpose:** boot the client, restore the session, and load the world before showing the map.
- **Presentation:** full-screen, immersive. No HUD.
- **Entry:** app launch, hard reload, return from a killed app.
- **Exit:** S-02 onboarding, S-04 map, S-03 world list, or S-18 reconnect/error.
- **Layout:** centered title block; ink map drawing; loading bar; one rotating tip; version stamp bottom-right.
- **Components:** title, subtitle, map drawing, loading bar, tip, retry button (error only), version.
- **Actions:** none in normal load; retry on error.
- **Data / permissions:** session restore state only; no faction data is shown until loaded.
- **States:** boot, restoring session, loading map, ready, error.
- **Desktop:** same composition centered at 640px; map drawing may scale up, type does not.
- **Acceptance:** never a blank screen; if loading exceeds 8s show a retry; if ready in under 400ms hold the splash for 400ms to avoid a flash; no fake progress.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│                                      │
│                                      │
│           THE SUCCESSION             │
│           VARDANIA · V1              │
│                                      │
│        [ ink map drawing ]           │
│        [ provinces and rivers ]      │
│                                      │
│                                      │
│        LOADING  ▓▓▓▓▓░░░             │
│        Raising the banners…          │
│                                      │
│   TIP: The war clock is the          │
│   loudest thing on the map.          │
│                                      │
│                         v0.1 · alpha │
└──────────────────────────────────────┘
```

---

### S-02 — Guest Onboarding

- **Purpose:** create a guest identity, choose a banner, and enter the first world with no email.
- **Presentation:** full-screen, 3 pages, immersive. Progress dots at top.
- **Entry:** first launch with no faction, or “Start over” after a linked sign-out.
- **Exit:** S-04 map if exactly one open world is joinable; S-03 world list if multiple or none; back to S-01 on fatal error.
- **Layout:** fixed progress header; scrollable content; sticky 48px primary CTA above the safe area; back arrow on steps 2–3.
- **Components:** display-name input, faction-name input, randomize button, emblem grid (6×4), color-family swatches (8), banner preview, world summary card, progress dots, helper text, inline validation.
- **Actions:** continue, back, randomize, enter world, choose another world.
- **Data / permissions:** display name 3–16 characters; faction name 3–20 (both DOC DEFAULT; confirm at G0); profanity filter; 24 emblems; 8 color families; pattern assigned by server. Guest session is created silently on boot; there is no email field.
- **States:** invalid or filtered name, world full, no open world, pre-registered, network error, submitting.
- **Desktop:** centered 480px card; step 2 becomes two columns (preview left, choices right).
- **Acceptance:** no email or password field; no forced account link; exactly 3 steps; invalid input is inline, never a modal; with one open world the player reaches the map in one tap from step 3.

**Wireframe — Step 1: Identity**

```text
┌──────────────────────────────────────┐
│  ←   STEP 1 OF 3           ●○○       │
│                                      │
│  CHOOSE YOUR NAME                    │
│  Every warlord needs one.            │
│                                      │
│  DISPLAY NAME                        │
│  ┌────────────────────────────────┐  │
│  │ Enter 3–16 characters          │  │
│  └────────────────────────────────┘  │
│                                      │
│  FACTION NAME                        │
│  ┌────────────────────────────────┐  │
│  │ Enter 3–20 characters          │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ RANDOMIZE ]                       │
│                                      │
│  No real names. Names are moderated. │
│                                      │
│                                      │
│  [            CONTINUE            ]  │
└──────────────────────────────────────┘
```

**Wireframe — Step 2: Banner**

```text
┌──────────────────────────────────────┐
│  ←   STEP 2 OF 3           ○●○       │
│                                      │
│  RAISE YOUR BANNER                   │
│                                      │
│  ┌────────────────┐  PREVIEW         │
│  │    [EMBLEM]    │  ASHEN COURT     │
│  │   OXBLOOD      │  ▨ pattern       │
│  └────────────────┘                  │
│                                      │
│  EMBLEM                              │
│  [X] [X] [X] [X] [X] [X]             │
│  [X] [X] [X] [X] [X] [X]             │
│  [X] [X] [X] [X] [X] [X]             │
│  [X] [X] [X] [X] [X] [X]             │
│                                      │
│  COLOR FAMILY                        │
│  [■] [■] [■] [■] [■] [■] [■] [■]     │
│                                      │
│  [ RANDOMIZE ]                       │
│  [            CONTINUE            ]  │
└──────────────────────────────────────┘
```

**Wireframe — Step 3: World**

```text
┌──────────────────────────────────────┐
│  ←   STEP 3 OF 3           ○○●       │
│                                      │
│  ENTER THE WAR                       │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ VARDANIA · WORLD 7             │  │
│  │ OPEN · DAY 2/30                │  │
│  │ 18/24 warlords                 │  │
│  │ War 18:00–00:00 UTC            │  │
│  └────────────────────────────────┘  │
│                                      │
│  Guest account. Link later to save   │
│  progress and earn season titles.    │
│                                      │
│  [          ENTER WORLD           ]  │
│  [         CHOOSE ANOTHER         ]  │
└──────────────────────────────────────┘
```

---

### S-03 — World List

- **Purpose:** choose an open world, enter a running world, inspect a finished world, or pre-register when none is open.
- **Presentation:** full screen with a simplified header. No resource HUD and no bottom nav, because the player may not have a faction yet.
- **Entry:** after onboarding when multiple/none are joinable; avatar menu → Change world; season recap → next world; app launch with no active faction.
- **Exit:** S-04 map, S-15 season recap for a finished world, or S-02 onboarding.
- **Layout:** header; filter chips; world-card list; sticky pre-register/empty action at the bottom.
- **Components:** header, avatar, close/back (only when entered from a current world), filter chips, world cards, status pill, day, player count, war window, “your faction” line, join/enter/inspect/recap buttons, pre-register card.
- **Actions:** filter, join, enter, inspect, view recap, pre-register, open avatar menu, close back to the current world when one exists.
- **Data / permissions:** name, status (`open`, `running`, `finished`), day 1–30, players, war window in local time, your faction. Joining is allowed only while `open` and inside the first 3 days; full worlds close early.
- **States:** loading, open, running, finished, full, no open world, pre-registered, error.
- **Desktop:** two-column card grid, max 960px, centered.
- **Acceptance:** status is readable without color; Join is never shown for a full/running/finished world; a current world is marked; pre-register never promises notifications that do not exist.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│  WORLDS                       [AV]   │
│                                      │
│  [ OPEN ] [ RUNNING ] [ FINISHED ]   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ WORLD 7        OPEN · DAY 2/30 │  │
│  │ 18/24 warlords                 │  │
│  │ War 18:00–00:00 UTC            │  │
│  │ Your faction: —                │  │
│  │ [         JOIN WORLD         ] │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ WORLD 6      RUNNING · DAY 17  │  │
│  │ 24/24 · join closed            │  │
│  │ Your faction: SALT LEAGUE      │  │
│  │ [           ENTER            ] │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ WORLD 5      FINISHED · DAY 30 │  │
│  │ Winner: ASHEN COURT            │  │
│  │ [       VIEW RECAP           ] │  │
│  └────────────────────────────────┘  │
│                                      │
│  No open world?  [ PRE-REGISTER ]    │
└──────────────────────────────────────┘
```

---

### S-04 — Map / HUD

- **Purpose:** the home screen. See the war, read the pulse, select provinces, and issue orders.
- **Presentation:** full screen with the full HUD (top bar + bottom nav).
- **Entry:** onboarding, world list, reconnect, battle report return, any bottom-nav back.
- **Exit:** S-05 province panel, S-13 incoming, any bottom-nav surface, avatar menu.
- **Layout:** two-row top bar; map canvas; alert stack below the top bar; world/day stamp top-left of the map; bottom nav; recenter button when zoomed/panned.
- **Components:** map canvas, province fills/patterns, resource icons, level pips, troop text, capital star, protection shield, incoming rings, army dots, march arrows, map stamp, alert stack, recenter, tutorial overlay, nav badges. If 3+ attacks are incoming, the alert stack shows the earliest plus “+N more” and opens the S-13 pager.
- **Actions:** tap province, tap army/march dot (opens S-09 with that march highlighted), drag pan, pinch zoom, double-tap zoom, tap alert, tap nav, tap avatar, recenter.
- **Data / permissions:** owner color/pattern, resource type, level, exact own/allied troops, enemy troop band, capital, protection, incoming attacks, armies/marches. No fog of war. Support is public. Enemy resources are never shown.
- **States:** loading, normal peace, war, final 15 minutes, incoming attack, tutorial, sheet open, spectating, eliminated/respawn pending, connection degraded.
- **Desktop:** map fills the left; right panel opens on province/alert selection; top bar becomes one row at ≥768px; bottom nav centered.
- **Acceptance:** support, five resources, and war clock are always visible; no exact enemy troop count ever enters the shared client schema; war is visually louder than peace; province names are not drawn at 1× zoom; effective province hit areas reach 44px through nearest-province tap slop even when the visual shape is smaller; no horizontal scroll.

**Wireframe — 390×844, peace**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│                                      │
│  WORLD 7 · DAY 2                     │
│                                      │
│    ╔══════╗   ┌──────┐   ┌──────┐    │
│    ║  ★   ║   │  F   │   │  O   │    │
│    ║ CAP  ║   │ NEU  │   │  AI  │    │
│    ╚══════╝   └──────┘   └──────┘    │
│                                      │
│    ┌──────┐   ┌──────┐   ┌──────┐    │
│    │  ●   │   │  ◆   │   │  ⚑   │    │
│    │ OWN  │   │ ALLY │   │ ENEM │    │
│    └──────┘   └──────┘   └──────┘    │
│                                      │
│    ┌──────┐   ┌──────┐               │
│    │  R   │   │  ▒   │               │
│    │ REBEL│   │ REFU │               │
│    └──────┘   └──────┘               │
│                                      │
│                         [ RECENTER ] │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

**Wireframe — war**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ WAR 1:12   │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│ ╔══════════════════════════════════╗ │
│ ║  WAR WINDOW · LAND GRAB · 1:12   ║ │
│ ╚══════════════════════════════════╝ │
│                                      │
│         MAP — oxblood inner frame    │
│                                      │
│    [⮕] hostile march                 │
│    [●] army dot                      │
│    [◉] incoming ring                 │
│                                      │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

---

### S-05 — Province Panel

- **Purpose:** inspect one province and take the correct context action.
- **Presentation:** bottom sheet over the map. Peek at ~40%; drag up to ~80%. Top bar stays visible; bottom nav is covered.
- **Entry:** tap a province on S-04; tap a province from a list/alert.
- **Exit:** drag down, tap the map, tap X, or choose an action.
- **Layout:** drag handle; owner header; 2×2 stat grid; primary action; secondary row; details accordion; queue strip for owned provinces.
- **Components:** owner emblem/name, controller pill, province name, resource icon, level pips (1–5), troop count (exact or band), fortification, capital star, protection shield, primary action, secondary actions, details accordion, garrison list, queue status.
- **Actions:** by province state:
  - **Own:** Upgrade (or Train when level 5 or the build queue is full), Train (unit picker), Move/Reinforce (map target mode; valid adjacent owned provinces highlighted), Abilities (war only), Relocate capital (capital only; peace only; once per season; for a cost), Details.
  - **Ally:** Details only. Attack is disabled with “Allied province.” Exact troops are shown.
  - **Enemy:** Attack, Abilities (war only, if in range), Details.
  - **Neutral:** Attack, Abilities (war only, if allowed), Details.
  - **Rebel:** Attack, Abilities (war only), Details.
  - **Refugee:** no attack; “Reserved for respawn.”
  - **Protected:** attack disabled with shield timer.
  - **Incoming:** show a red strip at the top with countdown; “Defend” opens S-13.
- **Data / permissions:** own province shows production, upkeep, queue, and exact garrison. Allied province shows exact troops but not resources, queues, research, or missions. Enemy/neutral/rebel shows resource type, level, fortification, and troop band only. Support is faction-wide and shown in the top bar, not here.
- **States:** loading, own, ally, enemy, neutral, rebel, refugee, protected, incoming, eliminated/spectator, expanded.
- **Desktop:** right-side 380px panel; no drag; same content with a close X.
- **Acceptance:** the primary action always matches ownership/phase/protection; exact enemy troops never render; the map remains visible at peek; upgrade shows cost/time/refund before confirm; every action is reachable with one thumb.

**Wireframe — neutral target, peek 40%**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│            [ map remains ]           │
├──────────────────────────────────────┤
│                 ───                  │
│  WHEATFIELD            NEUTRAL · LV 1│
│  [F] FOOD · TROOPS ~25 · FORT +0%    │
│  ┌────────────────────────────────┐  │
│  │ [          ATTACK            ] │  │
│  └────────────────────────────────┘  │
│  [ DETAILS ▾ ]   [ GARRISON ]        │
└──────────────────────────────────────┘
```

**Wireframe — expanded details, own province**

```text
┌──────────────────────────────────────┐
│                 ───                  │
│  ASH KEEP              YOUR CAPITAL  │
│  ★ CAPITAL · [M] MONEY · LV 2        │
│  TROOPS 50/200       FORT +10%       │
│  ┌────────────────────────────────┐  │
│  │ [          UPGRADE           ] │  │
│  └────────────────────────────────┘  │
│  [ TRAIN ] [ MOVE ] [ ABILITIES ]    │
│                                      │
│  PRODUCTION   +12 money/hr           │
│  UPKEEP       −3 food/hr             │
│  QUEUE        Build slot 1/2 · 42m   │
│  GARRISON     50 infantry            │
│  [ MANAGE GARRISON ]                 │
└──────────────────────────────────────┘
```

---

### S-06 — Research

- **Purpose:** spend resources on era techs and unlock units, doctrine, and economy upgrades.
- **Presentation:** full screen with the full HUD. Not a pan-and-zoom tree.
- **Entry:** bottom nav → Research; tech link from a unit/queue.
- **Exit:** back to map or any bottom-nav surface; tech detail sheet closes.
- **Layout:** header with gate progress; horizontal era strip; filter chips; two-column tech-card grid; detail sheet.
- **Components:** era nodes (day 1/8/16/24), lock labels, 3-of-5 gate meter, filter chips (All/Main/Doctrine/Economy), tech cards, cost, status, detail sheet with effect and Research button.
- **Actions:** filter, open tech, research (instant), close detail.
- **Data / permissions:** era calendar; main techs 5 per era; side branches; 3-of-5 previous-era gate; costs from config; no research timer; no queue. Only your own research is visible. Enemy/allied research is never shown.
- **States:** era locked, gate unmet, available, completed, insufficient resources, pending, error.
- **Desktop:** three-column card grid on the left; 380px detail rail on the right.
- **Acceptance:** no research timer or queue; the 3-of-5 gate is visible before a purchase; locked cards always say why; research is one confirmation; at 390px the grid is exactly two columns.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│  ← RESEARCH                MAIN 3/5  │
│                                      │
│  ERA 1   ERA 2   ERA 3   ERA 4       │
│  [WW1]   [DAY 8] [DAY 16] [DAY 24]   │
│   ▲                                  │
│                                      │
│  [ALL] [MAIN] [DOCTRINE] [ECO]       │
│                                      │
│  ┌──────────────┐ ┌──────────────┐   │
│  │ RIFLES  DONE │ │ ENTRENCH 250 │   │
│  │ main         │ │ main         │   │
│  └──────────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐   │
│  │ LIGHT TANK   │ │ BIPLANE      │   │
│  │ 300          │ │ LOCKED 3/5   │   │
│  └──────────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐   │
│  │ DEFENDER     │ │ RAIDER       │   │
│  │ 150          │ │ 150          │   │
│  └──────────────┘ └──────────────┘   │
│                                      │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

---

### S-07 — Market

- **Purpose:** trade food, water, and oil for gold, or use the state exchange backstop.
- **Presentation:** full screen with the full HUD; three tabs.
- **Entry:** bottom nav → Trade.
- **Exit:** back to map or any bottom-nav surface; create/detail sheets close.
- **Layout:** header with daily limits and reset; tabs; filter row; scrollable card list; sticky “Create listing” on Listings.
- **Components:** trade-limit chips, reset timer, tabs, filter chips, sort, listing cards, offer cards, exchange cards, create button, history link.
- **Actions:** buy listing, create listing, accept/decline/cancel offer, create offer, buy/sell exchange, filter/sort, open history.
- **Data / permissions:** gold is the only trade currency; food/water/oil are tradeable; money is not. 5% tax on non-ally trades, deducted from the seller; allies trade direct tax-free. State exchange trades have no tax; the spread is the fee and exchange trades count toward the daily limits. Daily limit 5 trades / 500 gold per faction per world day, reset at the world-day boundary. Minimum account age 24h. Storage overflow rejects the trade; the listing remains. Listings/offers freeze during war. Only your own offers and public listings are visible. Listing lifetime is server-provided; the exact lifetime is TBD in `03` §20.3 #10.
- **States:** loading, listings, offers, exchange, empty, war freeze, limit reached, insufficient storage, pending, error.
- **Desktop:** list on the left; 380px detail rail on the right; tabs remain.
- **Acceptance:** big gold price; tax shown before confirm; daily limits visible; money is never tradeable; no checkout; war freeze is explicit; a failed storage check keeps the listing open.

**Wireframe — Listings tab, 390×844**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│  ← MARKET       2/5 TRADES · 120/500G│
│  Resets in 6h 12m                    │
│                                      │
│  [ LISTINGS ] [ OFFERS ] [ EXCHANGE ]│
│                                      │
│  [ALL] [FOOD] [WATER] [OIL]   [SORT] │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ [EM] ASHEN COURT               │  │
│  │ Selling 500 [F] FOOD           │  │
│  │ 120 GOLD · seller gets 114     │  │
│  │ 2h 10m left           [ BUY ]  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ [EM] SALT LEAGUE               │  │
│  │ Selling 200 [O] OIL            │  │
│  │ 90 GOLD · seller gets 85       │  │
│  │ 5h left               [ BUY ]  │  │
│  └────────────────────────────────┘  │
│                                      │
│  [          + CREATE LISTING       ] │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

---

### S-08 — Alliance

- **Purpose:** make membership, invites, shared vision, and the war lock unmistakable without chat.
- **Presentation:** full screen with the full HUD; roster-first.
- **Entry:** bottom nav → Alliance; invite notification; ally row in a province panel.
- **Exit:** back to map or any bottom-nav surface; invite/leave confirm closes.
- **Layout:** header; status card; member roster; invite section; pending invites; leave/kick actions.
- **Components:** alliance name, member count `2/3`, shared-vision badge, war-lock countdown, member rows (leader/member, emblem, name, joined date, province count), invite button, pending rows, empty state, leave/kick.
- **Actions:** found alliance (DOC DEFAULT proposal), invite (opens a counterparty picker; open item 2), cancel invite, accept/decline, leave, kick. No chat, no pings, no emotes.
- **Data / permissions:** max 3; formed in peace; locked during war; leader invites/kicks; any member may leave in peace; eliminated members keep membership but cannot invite/kick/lead; shared vision shows exact allied troops but not resources, queues, research, or missions. Leaving costs −5 support and starts a 24h attack/join cooldown; kicking has no −5 support but starts both 24h cooldowns (DEFAULT). No stationing, joint attacks, shared commands, or alliance award.
- **States:** no alliance, member, leader, full, war locked, pending invite, eliminated member, dissolved.
- **Desktop:** roster on the left; 380px detail rail on the right; invite panel in the rail.
- **Acceptance:** no chat surface; war lock is obvious; leader-only controls are hidden for members; exact allied troops are allowed but no allied resources leak; leaving warns about −5 support and 24h cooldown.

**Wireframe — 390×844, leader view**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│  ← ALLIANCE            2/3 · PEACE   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ THE IRON PACT                  │  │
│  │ Shared vision: ON              │  │
│  │ War lock: open in 4h 12m       │  │
│  └────────────────────────────────┘  │
│                                      │
│  MEMBERS                             │
│  [EM] ASHEN COURT        LEADER      │
│  [EM] SALT LEAGUE        MEMBER      │
│                                      │
│  [          + INVITE             ]   │
│                                      │
│  PENDING INVITES                     │
│  [EM] GREY HILLS         waiting…    │
│  [ CANCEL ]                          │
│                                      │
│  [         LEAVE ALLIANCE        ]   │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

---

### S-09 — Army / Orders

- **Purpose:** see armies in motion, garrisons, the build queue, and the training queue; cancel or recall when allowed.
- **Presentation:** full screen with the full HUD; three tabs.
- **Entry:** bottom nav → Army; march/queue alert; province panel → queue strip.
- **Exit:** back to map; battle history; abilities; garrison manage.
- **Layout:** header with slot count; tabs; scrollable cards; empty states; bottom “Battle history” and “Abilities” links.
- **Components:** slot badge (`1/2`), tabs, march card, garrison row, queue card, timer, cancel/recall, progress bar, battle-history link, abilities button.
- **Actions:** recall, cancel build/training, open province, manage garrison (opens province panel expanded to Garrison), open battle history, open abilities (war only), create order via `+`.
- **Data / permissions:** one national build queue and one national training queue; 1–2 slots each; timers continue offline and during war; cancel refunds 50% (DEFAULT); capture cancels with 50%, elimination/season end with no refund; recall costs 10% of committed troops, rounded up, minimum 1. Only your own queues and armies are visible.
- **States:** empty, running, queued, completed, cancelled, fatigued, eliminated, pending, error.
- **Desktop:** tabs plus a table on the left; 380px detail rail on the right.
- **Acceptance:** every timer is visible; cancel shows the refund before confirm; recall shows the 10% penalty; slots `1/2` are readable; split/merge is reachable from a garrison row; no enemy queue data is ever shown.

**Wireframe — Armies tab, 390×844**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│  ← ARMY / ORDERS       SLOTS 1/2     │
│                                      │
│  [ ARMIES ] [ BUILD ] [ TRAINING ]   │
│                                      │
│  IN MOTION                           │
│  ┌────────────────────────────────┐  │
│  │ CAP → WHEAT      50 INF        │  │
│  │ Arrives in 04:12   [ RECALL ]  │  │
│  └────────────────────────────────┘  │
│                                      │
│  GARRISONS                           │
│  ┌────────────────────────────────┐  │
│  │ ASH KEEP      50 INF · 0 TANK  │  │
│  │ [ MANAGE ]                     │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ WHEATFIELD    0 INF            │  │
│  │ [ MANAGE ]                     │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ BATTLE HISTORY ]   [ ABILITIES ]  │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

### S-10 — Pass

- **Purpose:** progress and claim the account-wide, 30-day cosmetic pass; buy premium on mobile.
- **Presentation:** full screen with the full HUD; vertical reward track.
- **Entry:** bottom nav → Pass; nav badge; post-purchase return.
- **Exit:** back to map or any bottom-nav surface; purchase sheet closes.
- **Layout:** header with term end and XP; premium status; missions; scrollable track; sticky purchase/claim bar.
- **Components:** term end, XP bar, current tier, premium badge, daily/weekly mission cards, claim buttons, track rows with free and premium columns, lock/claimable/claimed states, “Claim all,” buy CTA, auto-claim note.
- **Actions:** claim, claim all, buy premium (only when no pass is active), restore purchases, inspect reward.
- **Data / permissions:** $5 per 30-day pass; rolling 30 days from purchase; account-wide; may cross a season boundary; progress earned in any world; premium rewards are retroactively claimable after a mid-term purchase; unclaimed rewards auto-claim at expiry (DEFAULT); no buying levels; no paid power; web is browsable but read-only; mobile IAP only. Repeat purchase/stacking while a pass is active is TBD; do not show a second buy CTA until it is decided.
- **States:** not purchased, active (no purchase CTA), expired, purchase pending, purchase failed, restored, all claimed, no missions, web read-only, guest (link first).
- **Desktop:** two columns: reward track left, missions and pass summary right.
- **Acceptance:** the term is shown as “30 days from purchase,” never “season ends”; an active pass never shows a second buy CTA; no level-skip purchase; retroactive premium claims are explained; web has no checkout; auto-claim is stated before expiry.

**Wireframe — 390×844, active premium**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│  ← SEASON PASS    ENDS NOV 22        │
│  TIER 12   XP ▓▓▓▓▓▓░░░░ 1,240/2,000 │
│  PREMIUM ACTIVE · 30D FROM PURCHASE  │
│                                      │
│  DAILY MISSIONS                      │
│  ┌────────────────────────────────┐  │
│  │ Capture 2 provinces   2/2 [CLAIM] │
│  └────────────────────────────────┘  │
│                                      │
│  WEEKLY MISSIONS                     │
│  ┌────────────────────────────────┐  │
│  │ Win 5 battles         3/5 ▓▓▓░░│  │
│  └────────────────────────────────┘  │
│                                      │
│  TRACK                               │
│  TIER 12  [FREE: PIN] [PREMIUM: FLAG]│
│  TIER 13  [FREE: TITLE] [PREMIUM: …] │
│  TIER 14  [FREE: BADGE] [PREMIUM: …] │
│  …                                   │
│                                      │
│  [ CLAIM ALL ]                       │
│  Unclaimed rewards auto-claim.       │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

---

### S-11 — Shop

- **Purpose:** browse and buy permanent identity cosmetics; never power.
- **Presentation:** full screen with the full HUD; featured row plus category grid.
- **Entry:** avatar menu → Shop; pass-reward “not in shop” note.
- **Exit:** back to map or any bottom-nav surface; detail/purchase sheet closes.
- **Layout:** header; featured row; category chips; two-column grid; detail sheet.
- **Components:** featured cards, category chips (All/Flags/Banners/Pins/Titles/Monuments), cosmetic cards, preview, price, owned/equipped state, buy/equip, guest link CTA, web “available on mobile” note.
- **Actions:** browse, filter, preview, buy, equip, link account, restore purchases.
- **Data / permissions:** identity cosmetics only: flags/emblems, banners, map pins, titles, capital monuments; account-wide and permanent; no premium currency; no loot boxes; no overlap with pass exclusives; prices from the store catalog (TBD); purchases require a linked Google/Apple identity; mobile IAP only; web is read-only.
- **States:** loading, owned, equipped, purchase pending, success, cancelled, failed, restored, guest, web read-only, catalog empty.
- **Desktop:** four-column grid on the left; 380px detail rail on the right.
- **Acceptance:** no web checkout; guest sees “Link to buy,” not a checkout; owned and equipped are visually distinct; no pass-exclusive item appears for sale; no randomized paid item; price always comes from the store, never a hardcoded string.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│  ← SHOP                COSMETICS ONLY│
│                                      │
│  FEATURED                            │
│  ┌────────────┐  ┌────────────┐      │
│  │  [FLAG]    │  │ [MONUMENT] │      │
│  │  $2.99     │  │  $4.99     │      │
│  └────────────┘  └────────────┘      │
│                                      │
│  [ALL] [FLAGS] [BANNERS] [PINS] …    │
│                                      │
│  ┌────────────┐  ┌────────────┐      │
│  │ [PREVIEW]  │  │ [PREVIEW]  │      │
│  │ ASH FLAG   │  │ IRON PIN   │      │
│  │ OWNED      │  │ $1.99      │      │
│  │ [ EQUIP ]  │  │ [ BUY ]    │      │
│  └────────────┘  └────────────┘      │
│  ┌────────────┐  ┌────────────┐      │
│  │ [PREVIEW]  │  │ [PREVIEW]  │      │
│  │ DUSK BANNER│  │ CROWN TITLE│      │
│  │ $2.99      │  │ OWNED      │      │
│  │ [ BUY ]    │  │ [ EQUIP ]  │      │
│  └────────────┘  └────────────┘      │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

---

### S-12 — Profile

- **Purpose:** identity, equipped cosmetics, season history, account linking, and settings.
- **Presentation:** full screen with the full HUD; identity header plus four tabs.
- **Entry:** avatar menu → Profile; guest badge; season recap → History.
- **Exit:** back to map or any bottom-nav surface; link/sign-out confirms close.
- **Layout:** identity header; tab bar; tab content.
- **Components:** emblem, display name, faction name, equipped title, guest/linked badge, tabs, cosmetic slots, history cards, account rows, settings toggles.
- **Actions:** equip cosmetic, open season history, link account, restore purchases, sign out (linked only), change sound/haptics/reduced motion/text size, open legal/privacy.
- **Data / permissions:** titles and history only if linked before the season freeze; an unlinked guest sees the recap but no title/history. Cosmetics are account-wide. No email field. Account deletion is TBD; do not ship a dead button. Support channel is TBD; show a support code, not a fake email.
- **States:** guest, linked, no history, restore pending, sign-out confirm, error, deleted/disabled account.
- **Desktop:** 280px identity card on the left; tab content on the right.
- **Acceptance:** guest vs linked is unmistakable; an unlinked season shows no title; restore purchases is mobile-only; no email input; no dead delete-account button.

**Wireframe — Cosmetics tab, 390×844**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ PEACE 2:14 │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│  ← PROFILE                           │
│                                      │
│  [EM]  ASHEN COURT                   │
│        GUEST WARLORD         [GUEST] │
│        Title: —                      │
│                                      │
│ [COSMETICS] [HISTORY] [ACCOUNT] [SET]│
│                                      │
│  EQUIPPED                            │
│  Flag       ASH BANNER               │
│  Banner     IRON DUSK                │
│  Map pin    RED STAR                 │
│  Title      —                        │
│  Monument   —                        │
│                                      │
│  [        CHANGE COSMETICS        ]  │
│                                      │
│ [LINK ACCOUNT TO KEEP THIS FACTION]  │
├──────────────────────────────────────┤
│ RESEARCH TRADE ALLIANCE ARMY PASS    │
└──────────────────────────────────────┘
```

---

### S-13 — Incoming Attack

- **Purpose:** warn the defender and offer reinforce, retreat, or hold without stopping the rest of the game.
- **Presentation:** bottom sheet over the map, persistent alert first. Never a forced modal. Top bar visible; nav covered.
- **Entry:** alert stack, province ring, Army badge, or province panel “Defend.”
- **Exit:** close, choose an action, or battle resolves into S-14.
- **Layout:** red header; countdown; attacker → target; strength band; your exact garrison; fortification/offline note; three actions.
- **Components:** countdown, attacker emblem/name, target, approximate strength, exact defender garrison, fortification, offline defense note, reinforce/retreat/hold, lock reasons, next-attack pager.
- **Actions:** reinforce (one per incoming attack; opens a source/unit picker in the same layer), retreat (adjacent owned province, not capital), hold, open next attack.
- **Data / permissions:** attacker name, approximate strength, your exact garrison, fortification, offline +15% if you do not return before arrival. No exact attacker troops. Retreat cedes the province, neutralizes it, and is blocked from a capital. One reinforcement per incoming attack (DEFAULT).
- **States:** loading, incoming, reinforced, retreated, resolved, too late, multiple attacks, capital retreat locked, eliminated.
- **Desktop:** right-side alert panel; no modal.
- **Acceptance:** no forced modal; countdown always visible; retreat is disabled on a capital with a reason; only one reinforcement per attack; exact defender data only; no exact attacker data.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│ [AV]  SUP ▓▓▓▓▓░░ 62    ◷ WAR 3:42   │
│ [M]1.2k [G]340 [F]2.1k [W]800 [O]120 │
├──────────────────────────────────────┤
│            [ map dimmed ]            │
├──────────────────────────────────────┤
│                 ───                  │
│  INCOMING ATTACK             03:12   │
│  SALT LEAGUE → ASH KEEP              │
│                                      │
│  Attacker strength   ~100–200        │
│  Your garrison       50 INF          │
│  Fortification       +10%            │
│  Offline defense     +15% if you do  │
│  not return before arrival.          │
│                                      │
│  [ REINFORCE ] [ RETREAT ] [ HOLD ]  │
│                                      │
│ Retreat is unavailable for a capital.│
└──────────────────────────────────────┘
```

---

### S-14 — Battle Report

- **Purpose:** explain exactly what happened and make the result feel earned.
- **Presentation:** full-screen, immersive. No HUD.
- **Entry:** battle resolves; battle history; reconnect “since you were away.”
- **Exit:** return to map; next report; battle history.
- **Layout:** result banner; province/date; power table; losses; capture/loot/support; actions.
- **Components:** victory/defeat/tie, province, timestamp, attacker/defender power rows, every multiplier, losses by unit, capture result, capital loot (if any), support delta, title mark, battle ID, return/next.
- **Actions:** return to map, next report, open history.
- **Data / permissions:** both powers; counter, skill, era, fortification/capital, offline multipliers; losses; capture; capital loot only; support changes. No hidden modifiers. The full report math is visible to the attacker and defender only (DOC DEFAULT); any future public summary must omit exact counts. Neutral defenders have no army IDs; show “Neutral garrison.” Tie shows “Exact tie — defender holds.”
- **States:** victory, defeat, tie, captured, held, neutral defender, rebel attacker, eliminated, no capture.
- **Desktop:** centered 640px report; no side rail.
- **Acceptance:** every multiplier that affected the result is shown; tie rule is correct (attacker loses all, defender loses 50%, defender holds); losses and capture match the server; exact report math is private to participants; one tap returns to the map.

**Wireframe — 390×844, victory**

```text
┌──────────────────────────────────────┐
│                                      │
│              VICTORY                 │
│        WHEATFIELD CAPTURED           │
│        Day 2 · 18:42 UTC             │
│                                      │
│  POWER                               │
│  You       500  ×1.0 ×1.0 ×1.0       │
│  Defender  250  ×1.0 ×1.0 ×1.0       │
│                                      │
│  LOSSES                              │
│  You        8 INF                    │
│  Defender  25 INF (all)              │
│                                      │
│  CAPTURE    +1 province              │
│  SUPPORT    +0.1                     │
│                                      │
│  [ RETURN TO MAP ]   [ NEXT REPORT ] │
│                                      │
│ Battle 7F3A-22                       │
└──────────────────────────────────────┘
```

---

### S-15 — Season Recap

- **Purpose:** deliver the 30-day payoff: personal result, title, stats, leaderboard, and next world.
- **Presentation:** full-screen, immersive.
- **Entry:** season freeze; world list → finished world → View recap; Profile → History.
- **Exit:** join next world, pre-register, return to world list.
- **Layout:** hero result/title; both award results; personal stats; leaderboard top 10 plus your row; award eligibility note; next-world CTA.
- **Components:** season dates, emblem, faction name, placement, personal title, Conqueror result, Best Nation result, stats (provinces, score, battles won, support peak), leaderboard with title marks, “you” row, eligibility note, next-world CTA.
- **Actions:** join next world, pre-register, return to worlds, open history.
- **Data / permissions:** Conqueror = most provinces; Best Nation = highest score; tie-break total troops, then earlier join, then lower faction ID; AI ineligible; unlinked guest gets the recap but no title or history; no alliance award. Scores/constants are config.
- **States:** winner, participant, guest-unlinked, AI-controlled, eliminated, spectator, no next world.
- **Desktop:** two columns: hero/stats left; leaderboard right.
- **Acceptance:** personal result appears before the leaderboard; both awards appear, and the player's own title is highlighted; the leaderboard shows each faction's title marks; an unlinked guest is told why no title was awarded; AI control is disclosed; no alliance award; next world is one tap.

**Wireframe — 390×844, winner**

```text
┌──────────────────────────────────────┐
│                                      │
│          SEASON COMPLETE             │
│              DAY 30                  │
│                                      │
│        [EMBLEM] ASHEN COURT          │
│        CONQUEROR · 1ST PLACE         │
│        “Warlord of the Ash”          │
│  BEST NATION  ASHEN COURT (YOU)      │
│                                      │
│  PROVINCES 34      SCORE 8,420       │
│  BATTLES WON 41    SUPPORT PEAK 88   │
│                                      │
│  LEADERBOARD                         │
│  1  ASHEN COURT (YOU) 34 · 8,420     │
│  2  SALT LEAGUE       29 · 7,980     │
│  3  GREY HILLS        24 · 6,740     │
│  …                                   │
│  18 RED MARSH         12 · 3,220     │
│                                      │
│  [       JOIN NEXT WORLD         ]   │
│  [       RETURN TO WORLDS        ]   │
└──────────────────────────────────────┘
```

---

### S-16 — War Planner

- **Purpose:** optional full-screen planning for multi-unit or timing-sensitive attacks.
- **Presentation:** full-screen, immersive. Reached from M-01 → Plan.
- **Entry:** M-01 → Plan.
- **Exit:** back to M-01; confirm sends the same attack command; return to map after send.
- **Layout:** header; source→target diagram; timeline; army builder; estimate; confirm.
- **Components:** source/target names, one-hop land diagram or air-range line, travel time, arrival time, window status, unit steppers with available counts, power estimate and visible multipliers, confirm.
- **Actions:** adjust units, back, confirm attack.
- **Data / permissions:** same command and validation as M-01. Land attacks are one adjacent hop; multi-hop requires successive orders. Aircraft/missiles show their range instead of a one-hop line. PvP must arrive inside the war window. Exact own troops; enemy band only. Fatigue, protection, range, and ally/refugee guards are server-validated.
- **States:** valid, invalid, out of window, protected, no troops, fatigued, pending, error.
- **Desktop:** map/route on the left; planner on the right.
- **Acceptance:** no tactical battle; no hidden multipliers; arrival window is explicit; Back preserves the army selection; Confirm is the same command as M-01, not a second path.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│  ← WAR PLANNER                [X]    │
│                                      │
│  TARGET  WHEATFIELD · NEUTRAL        │
│  ┌────────────────────────────────┐  │
│  │  [ASH KEEP] ──▶ [WHEATFIELD]   │  │
│  │      5 min · 1 hop             │  │
│  └────────────────────────────────┘  │
│                                      │
│  DEPART 18:37  →  ARRIVE 18:42       │
│  WINDOW  NEUTRAL — anytime           │
│                                      │
│  ARMY                                │
│  INFANTRY   [ −  50  + ]   50/50     │
│  TANK       [ −   0  + ]    0/0      │
│  AIRCRAFT   [ −   0  + ]    0/0      │
│  MISSILE    [ −   0  + ]    0/0      │
│                                      │
│  ESTIMATE                            │
│  Your power      500                 │
│  Enemy band      ~250                │
│  Counter ×1.0 · Fort ×1.0            │
│                                      │
│  [ BACK ]          [ CONFIRM ]       │
└──────────────────────────────────────┘
```

---

### S-17 — Account Link

- **Purpose:** optionally link the guest to Google or Apple so progress, titles, history, cross-device play, and purchases survive.
- **Presentation:** modal sheet over the current screen; map/panel dimmed behind. Never forced.
- **Entry:** after first capture prompt; Profile → Account; guest purchase attempt; guest season reward prompt.
- **Exit:** linked success; continue as guest; conflict confirm; error retry.
- **Layout:** emblem; “Save your faction”; guest-since line; benefit list; Google and Apple buttons; continue as guest; privacy/terms.
- **Components:** provider buttons, guest button, benefit list, conflict dialog, pending/error states.
- **Actions:** link Google, link Apple, continue as guest, confirm conflict, retry.
- **Data / permissions:** only Supabase anonymous guest + Google/Apple identities; no email. Linking is required for purchases, titles, season history, and cross-device. A conflicting guest faction is abandoned and marked AI-controlled; the existing social account survives. Non-conflicting guest factions may be reassigned.
- **States:** prompt, linking, success, conflict, error, already linked, banned/disabled.
- **Desktop:** centered 480px modal; provider redirect opens in the system browser.
- **Acceptance:** never blocks play; “Continue as guest” is always available; conflict dialog names the world and warns that the guest faction will be abandoned; no email field; success/failure is explicit; no duplicate link.

**Wireframe — 390×844, prompt**

```text
┌──────────────────────────────────────┐
│            [ map dimmed ]            │
│  ┌────────────────────────────────┐  │
│  │        SAVE YOUR FACTION       │  │
│  │                                │  │
│  │  [EM]  ASHEN COURT             │  │
│  │  Guest since Day 2             │  │
│  │                                │  │
│  │  Link to keep your faction on  │  │
│  │  every device, earn season     │  │
│  │  titles, and restore purchases.│  │
│  │                                │  │
│  │  [ G  CONTINUE WITH GOOGLE ]   │  │
│  │  [ A  CONTINUE WITH APPLE  ]   │  │
│  │                                │  │
│  │  [     CONTINUE AS GUEST   ]   │  │
│  │  Privacy · Terms               │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

### S-18 — Reconnect / Error

- **Purpose:** explain connection loss, retry safely, and reconcile state without losing intent.
- **Presentation:** full-screen, immersive. Carved-ink panel.
- **Entry:** socket loss, HTTP failure, app resume, maintenance, session expiry.
- **Exit:** S-04 map after sync; S-03 world list on session/account failure; retry.
- **Layout:** centered ink panel; status icon; title; body; attempt countdown; retry; return; support code; optional “Since you were away.”
- **Components:** status icon, title, body, attempt count, retry button, return-to-worlds, support code, offline battle summary (up to 3 reports).
- **Actions:** retry now, return to worlds, open offline report.
- **Data / permissions:** no offline play; server state on return; war continues while disconnected; session-expired guests are warned about identity risk; no push/email; no fake recovery code.
- **States:** offline, server unavailable, maintenance, session expired, reconnecting, synced, offline battles.
- **Desktop:** centered 480px panel.
- **Acceptance:** no offline play; retry works without duplicate commands; state reconciles on return; support code is copyable; offline battle reports are capped at 3 and link to S-14; no promise of a recovery code that does not exist.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│                                      │
│              [ UNPLUGGED ]           │
│                                      │
│          CONNECTION LOST             │
│                                      │
│   Your faction is safe. We are       │
│   reconnecting to the war room.      │
│                                      │
│   Attempt 3 · retrying in 0:08       │
│                                      │
│   [          RETRY NOW           ]   │
│   [      RETURN TO WORLD LIST    ]   │
│                                      │
│   Support code: NET-7F3A             │
│                                      │
│   While you were away:               │
│   [ Battle report · Wheatfield ]     │
└──────────────────────────────────────┘
```

---

### M-01 — Attack Confirm

- **Purpose:** commit an attack with the minimum information needed to make a good decision.
- **Presentation:** modal sheet over the map. Replaces the province sheet content; never stacked on it.
- **Entry:** S-05 → Attack, or a valid target action from a battle/ability list.
- **Exit:** Send; Plan → S-16; Cancel.
- **Layout:** target header; source row with Change; four unit steppers; travel/arrival; window status; power estimate; Plan/Send.
- **Components:** target name/owner/level, source province, available counts, unit steppers, travel time, arrival time, window check, own power, enemy band, inline error, Plan, Send.
- **Actions:** adjust units, change source (opens a source picker in the same layer), plan, send, cancel.
- **Data / permissions:** source must be an owned province with troops; land targets must be adjacent, while aircraft/missiles use their era range. Exact own counts; enemy band; PvP must arrive inside the war window; neutral/AI anytime; protection, ally, refugee, fatigue, and range are server-validated. No hidden modifiers in the estimate.
- **States:** valid, no source, no troops, out of window, protected, ally, refugee, fatigued, pending, error.
- **Desktop:** centered 480px modal.
- **Acceptance:** compact by default; Plan is optional; Send is disabled with a reason when invalid; no exact enemy count; the same command is used by S-16; one modal layer.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│  SEND ARMY                     [X]   │
│                                      │
│  Target  WHEATFIELD · NEUTRAL        │
│  From    ASH KEEP             CHANGE │
│                                      │
│  INFANTRY   [ −  50  + ]   50/50     │
│  TANK       [ −   0  + ]    0/0      │
│  AIRCRAFT   [ −   0  + ]    0/0      │
│  MISSILE    [ −   0  + ]    0/0      │
│                                      │
│  Travel 5 min · Arrives 18:42        │
│  Window: NEUTRAL — anytime           │
│  Your power 500 · Enemy ~250         │
│                                      │
│  [ PLAN ]          [ SEND 50 INF ]   │
└──────────────────────────────────────┘
```

---

### M-02 — Abilities

- **Purpose:** use the three war-only faction abilities without turning the HUD into a spellbook.
- **Presentation:** sheet over the current screen; choosing an ability closes the sheet and enters map target mode with a banner.
- **Entry:** S-05 → Abilities; S-09 → Abilities.
- **Exit:** choose ability → target mode; close.
- **Layout:** three ability rows with icon, name, effect, cooldown, cost, status; target instruction.
- **Components:** ability row, cooldown timer, cost, era lock, ready/cooldown/locked, target-mode banner, cancel target.
- **Actions:** choose ability, cancel target, confirm target.
- **Data / permissions:** Mobilization (+30% infantry growth, 1h, 12h cooldown, Era 1+, money+food); Airstrike (15% garrison damage, 6h cooldown, Era 1+, money+oil); Missile Strike (heavy garrison + province level damage, 12h cooldown, Era 2+, money+oil+gold). All abilities are war-only in v1 (DEFAULT), target provinces, and use faction-wide cooldowns that persist through respawn and clear at season end. Mobilization targets an owned province; Airstrike/Missile target valid non-allied provinces in range (DOC DEFAULT). Exact balance values are config/TBD.
- **States:** ready, cooldown, era locked, insufficient resources, target mode, pending, error.
- **Desktop:** 480px sheet or right-panel section.
- **Acceptance:** war-only; cooldown and cost always visible; no targeting a marching army; one ability at a time; target mode is cancellable; server validates range/phase.

**Wireframe — 390×844**

```text
┌──────────────────────────────────────┐
│  ABILITIES                 WAR ONLY  │
│                                      │
│  [M] MOBILIZATION      12h   READY   │
│      +30% infantry growth for 1h     │
│      Cost: money + food              │
│                                      │
│  [A] AIRSTRIKE          6h   READY   │
│      15% garrison damage             │
│      Cost: money + oil               │
│                                      │
│  [X] MISSILE STRIKE    12h   LOCKED  │
│      Heavy damage + level damage     │
│      Era 2 · Day 8                   │
│                                      │
│  Choose an ability, then tap a       │
│  valid province on the map.          │
│                                      │
│  [ CLOSE ]                           │
└──────────────────────────────────────┘
```

### M-03 to M-10 — Other overlays

| ID | Overlay | Content | Rules |
|---|---|---|---|
| M-03 | Resource Breakdown | Stockpile/cap, income/hr, upkeep/hr, net, next shortage. | Own faction only; no enemy economics. |
| M-04 | War Clock Detail | Phase, next transition, war beats, local time, “arrive by” note. | Server UTC authority; local display. |
| M-05 | Avatar Menu | Profile, Shop, Map Key, Change World, Settings, Link (guest). | No chat, no help email. |
| M-06 | Purchase Confirm | Item, price, store, pending, restore. | Native store sheet; app never fakes a receipt. |
| M-07 | Create Listing / Offer | Resource, amount, price, tax preview, escrow, duration from server. | Money not tradeable; storage check. |
| M-08 | Destructive Confirm | Action-specific copy, consequence, confirm/cancel. | Replaces current sheet; no stacking. |
| M-09 | Map Key | Owner colors, alliance fills, patterns, icons, troop bands, shields, stars. | Always available; colorblind aid. |
| M-10 | Battle History | List of battles with result/province/date. | Participant view; any public summary omits exact counts. Retention policy from `05`. |

---

## 7. Key flows

### 7.1 First session — target 5–10 minutes to first capture

```text
Boot
  → Splash (session restore)
  → Onboarding step 1: names
  → Onboarding step 2: banner
  → Onboarding step 3: enter the one open world
  → Map + tutorial card 1 (capital)
  → Tap adjacent neutral
  → Province peek
  → Attack
  → Attack Confirm: 50 infantry, 5 min
  → Send
  → March dot/arrow
  → Tutorial card 4 (watch the march)
  → Battle Report: capture
  → Map flips ownership
  → Tutorial card 5 (war clock)
  → Link prompt (dismissible)
```

The player must be able to complete this without opening Research, Market, Alliance, Army, Pass, or Shop.

### 7.2 Returning session

```text
Boot
  → Splash
  → Map (last world)
  → If season ended: S-15 recap
  → If offline battles: “Since you were away” (max 3)
  → If incoming attack: persistent alert, no forced modal
  → Map
```

### 7.3 Attack flow

```text
Tap province
  → S-05 peek
  → Attack
  → M-01 compact confirm
      → Plan → S-16 → confirm
      → Send
  → pending
  → server ack
  → march appears
  → arrival
  → S-14 battle report
  → map update
```

### 7.4 Defense flow

```text
Incoming attack
  → alert stack + province ring (no modal)
  → tap alert
  → S-13 sheet
      → Reinforce (one per attack) → picker
      → Retreat (not capital) → confirm
      → Hold
  → arrival
  → S-14 battle report
```

### 7.5 Season end

```text
T0 + 30d
  → freeze
  → calculate titles
  → S-15 recap
      → winner / participant / guest / AI / eliminated / spectator
      → Join next world or pre-register
```

### 7.6 Purchase flow

```text
Shop/Pass
  → item/term
  → if web: “Available on mobile” (no checkout)
  → if guest: Link account
  → if mobile + linked: native store sheet
  → pending
  → server receipt validation / RevenueCat
  → entitlement
  → owned/equipped or premium active
```

### 7.7 Link flow

```text
Prompt or Profile
  → Google / Apple
  → server preview
      → no conflict: link + merge
      → conflict: name the world, warn guest faction will be abandoned
          → confirm: link; guest faction becomes AI-controlled
          → cancel: keep guest
  → success
```

---

## 8. Component inventory

| Component | Spec |
|---|---|
| `TopBar` | Two rows on phone; one row at ≥768px; safe-area aware. |
| `AvatarButton` | 32×32, emblem, 1px ink border; opens M-05. |
| `SupportMeter` | Continuous 10px bar, ticks at 15/25/40/60, exact number; 5 band colors. |
| `WarClock` | 24px ring + phase/time; olive peace, oxblood war; pulse final 15m. |
| `ResourceChip` | 16px icon, 12px abbreviated value, 2px storage fill; 44px tap height. |
| `BottomNav` | 5 items, 64px, 24px icon, 10px label, active oxblood line, badge. |
| `AlertCard` | 1px ink, 4px radius, icon + title + body + action; max 2 visible. |
| `Sheet` | 8px top radius, drag handle, 40%/80% snap, one at a time. |
| `Modal` | Centered, 360/480px, 8px radius, hard lift shadow. |
| `ButtonPrimary` | 48px, ink fill, paper text, 1px ink, hard shadow. |
| `ButtonDanger` | 48px, oxblood fill, white text, 1px oxblood. |
| `ButtonSecondary` | 44px, paper fill, ink text, 1px ink. |
| `TextButton` | Underline on focus/hover; 44px tap area. |
| `IconButton` | 44×44, 24px icon, accessible label. |
| `Card` | Paper, 1px ink, 4px radius, hard shadow; no nested cards. |
| `TabBar` | 44px, 2px oxblood active underline. |
| `FilterChip` | 28px height, 1px ink, active ink fill/paper text. |
| `ProgressBar` | 8px track, paper-dark, ink/mustard/olive fill. |
| `Timer` | Inter tabular; `h:mm:ss` under 1h, `2h 14m` above. |
| `UnitStepper` | `−` 44px, value 20px, `+` 44px; max from source. |
| `EmptyState` | 32px icon, one sentence, one primary action. |
| `Skeleton` | Paper-dark blocks, static; no shimmer under reduced motion. |
| `Toast` | Bottom above nav, 4s, paper/ink, one action max. |
| `Emblem` | 32×32 curated preset, 1px ink outline. |
| `FactionSwatch` | 24×24 color + pattern sample. |

---

## 9. Global acceptance

### 9.1 Phone

- [ ] At 390×844, no horizontal scroll and no clipped primary action.
- [ ] Top bar shows avatar, support, war clock, and all five resources.
- [ ] Bottom nav shows exactly five items on map/meta screens.
- [ ] Every touch target is at least 44px; primary buttons are 48px.
- [ ] The map remains visible behind the province and incoming sheets at peek.
- [ ] Safe areas are respected on notched devices.
- [ ] At 200% text, the layout reflows and all values remain readable.

### 9.2 Information

- [ ] Own and allied troop counts are exact.
- [ ] Enemy troop counts are bands only; no exact enemy count exists in the shared client state.
- [ ] Enemy resources, queues, research, and missions are never shown.
- [ ] Support is exact and public.
- [ ] Every battle report shows every multiplier that affected the result.
- [ ] Battle reports are participant-only (DOC DEFAULT); any public summary omits exact counts.

### 9.3 Interaction

- [ ] One modal layer at a time.
- [ ] Destructive actions use action-specific confirmation.
- [ ] The war clock is always visible on map/meta screens.
- [ ] War is visually louder than peace.
- [ ] Incoming attacks are persistent alerts, not forced modals.
- [ ] There is no chat, inventory, campaign, tactical battle, or base screen.
- [ ] No hover-only action exists.
- [ ] No dead TBD button ships.

### 9.4 Accessibility

- [ ] WCAG AA contrast for text and UI.
- [ ] Color + pattern/emblem redundancy for factions; allied territories share the alliance fill while keeping personal patterns/emblems.
- [ ] Status uses icon/text, not color alone.
- [ ] Reduced-motion mode removes pulse/slide/scale.
- [ ] Visible focus ring on every control.
- [ ] Screen-reader labels for icon-only controls and map provinces.
- [ ] Keyboard: Tab through HUD/panels, arrows move province selection, Enter opens, Esc closes.
- [ ] Timers announce at 5 minutes, 1 minute, and arrival, not every second.

### 9.5 Monetization

- [ ] Web shop/pass is browsable, with no checkout.
- [ ] Mobile is the only purchase path.
- [ ] Guest purchase attempts route to link, not checkout.
- [ ] No premium currency, loot box, paid power, or paid pass level.
- [ ] Pass is account-wide and 30 days from purchase.
- [ ] Shop items are permanent and cosmetic only.

---

## 10. Open items

These are deliberately not invented. They must be closed before the related implementation is considered done.

| # | Open item | Why it matters | Suggested closure |
|---:|---|---|---|
| 1 | **Alliance creation rule** | `03` defines invitation acceptance but not how the first alliance is founded. | Decide at G0. DOC DEFAULT proposal: any unallied player in peace can found a named alliance, no cost, becomes leader. |
| 2 | **Counterparty selection** | Direct offers and alliance invites need a recipient, but there is no chat or global search. | DOC DEFAULT proposal: a picker of allies, recent opponents, and the current world leaderboard; confirm at G0. |
| 3 | **Listing/offer lifetime display** | Lifetime is TBD in `03` §20.3 #10. | Show server-provided time; do not hardcode a duration. |
| 4 | **Pass mission count, XP curve, reward list** | TBD in `09` §20. | Config-driven; UI uses server totals. |
| 5 | **Shop catalog and prices** | TBD in `09` §20. | Store catalog; UI renders only server products. |
| 6 | **Account deletion, sign-out, recovery** | Required before public launch; not fully specified. | Do not ship dead buttons; add after policy. |
| 7 | **Support channel** | No email reminders; support flow is undefined. | Show a support code; add a real channel before launch. |
| 8 | **Emblem/icon art** | 24 emblems and 29 icons are planned, not drawn. | Art pass after G0. |
| 9 | **Alliance shared fill mapping** | `09` requires a shared map color; this doc uses the leader's color family as the shared fill. | Confirm the leader-color mapping at G0 before map art lock. |
| 10 | **Analytics** | PC-04 is open; no analytics service is chosen. | Keep UI-only; instrument after the decision. |
| 11 | **Map keyboard traversal details** | Directional adjacency selection needs a deterministic rule. | Prototype in the first map slice; test with keyboard/screen reader. |
| 12 | **Haptics/audio cue map** | Audio is minimal/DEFAULT; haptics optional. | Add during polish, not before the war loop. |
| 13 | **Guest recovery** | `09` requires recovery before public launch; no code exists. | Do not promise a recovery code in the UI until implemented. |
| 14 | **Desktop left rail** | This doc keeps the bottom nav on desktop. | Revisit only if playtests show it is awkward. |
| 15 | **Pass repeat purchase/stacking** | An active pass must not invite a second purchase until the rule is decided. | Hide the buy CTA while active; decide stacking at G0. |
| 16 | **Battle-report visibility** | `09` specifies report contents, not who may see them. This doc defaults to participant-only. | Confirm at G0; if a public summary is added, omit exact counts and battle math. |

---

## 11. Traceability

| This doc | `09` / `02` source | UI slice |
|---|---|---|
| S-01, S-18 | `09` §13.3 loading/error/offline; `02` §15.7 | U0 |
| S-02, S-17 | `09` §13.1, §15.5; `02` §15.6 | U0-U1 |
| S-03 | `09` §5.1, §13.2 | U0 |
| S-04, S-05 | `09` §6.1, §13.2–13.4; `02` §15.2–15.4 | U0 |
| M-01, S-16 | `09` §9.4–9.6; `02` §10.2, §15.4 | U0-U1 |
| S-06 | `09` §10 | U3 |
| S-07 | `09` §7.7 | U4 |
| S-08 | `09` §11 | U4 |
| S-09 | `09` §7.4–7.5, §9.5 | U1 |
| M-02 | `09` §9.7 | U2 |
| S-10 | `09` §14.2 | U6 |
| S-11 | `09` §14.3–14.4 | U6 |
| S-12 | `09` §13.2, §14.1 | U5 |
| S-13 | `09` §9.6 | U2 |
| S-14 | `09` §9.4, §9.6 | U0 |
| S-15 | `09` §5.2, §16 | U7 |

---

## 12. Final rule

If a screen needs a rule that is not in `09`, the rule is not invented in the UI. The screen shows the closest safe state, the missing decision is logged, and the feature waits for G0.

The map is the menu. The war clock is the pulse. The report tells the truth.

