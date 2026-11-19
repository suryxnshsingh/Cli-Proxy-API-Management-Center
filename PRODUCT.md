# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary:** the hub owner (a developer). They run CLIProxyAPI on an always-on home Mac that pools several Claude and Codex subscription accounts, their own and some friends', and they open this panel over Tailscale from a laptop, sometimes a phone.
- **Their jobs, by frequency:**
  1. Glance at whether the pool is healthy: which accounts are serving, which are rate-limited or cooling down, and when each one resets.
  2. Sign a new or signed-out account in through the OAuth flow, including pasting the failed `localhost` callback URL.
  3. Check usage and requests.
  4. Occasionally edit config, providers or plugins, or read logs.
- **Secondary:** friends who contribute accounts may be walked through the sign-in step, but they do not operate the panel. *(inferred)*

## Product Purpose
The panel is the management console for a CLIProxyAPI hub. It makes the hub's state legible and fixable without SSH: account and credential health, quota windows and reset times, usage, OAuth sign-in, config and logs. Success means the owner can tell in a few seconds whether anything needs them, and can fix it from the same screen.

## Positioning
This hub routes reset-first: it drains whichever account's weekly window resets soonest (the user's fork adds a `reset-first` strategy). So the clock is the product: when each account resets, and how much of each window is left, is the most decision-relevant information here. A generic API-gateway dashboard does not centre that.

## Operating Context
- Opened on demand, not watched all day.
- Alerts arrive elsewhere: a T3 thread opens when an account needs signing in again. The panel is where the fix happens.
- Desktop browser over Tailscale. Light and dark themes both matter: the theme follows the system.
- Shipped as one self-contained `management.html` served by the proxy.

## Capabilities and Constraints
- **Pages:** Dashboard, Quick Start, AI Providers, Auth Files, OAuth Login, Quota Management, Usage Statistics, Logs Viewer, Config Panel, Plugins, Plugin Store, System.
- **Backend:** the v8 Management API is the source of truth (`docs/management-v8.md`).
- **Build constraints:**
  - single-file build (`vite-plugin-singlefile`)
  - hash routing
  - no runtime network fetches for fonts or assets
  - 4 locales (en, zh-CN, zh-TW, ru)
  - every visual value comes from `src/design-system/tokens.ts`, enforced by tests
- **Mergeability:** this is a fork of BumpyClock's fork of router-for-me's panel. Changes should stay mergeable with that upstream where possible.

## Brand Commitments
- The name is CPAMC (CLI Proxy API Management Center), and the existing logo stays.
- The user's own references for the look: ObsidianUI's analytics-dashboard and dashboard-shell (obsidianui.dev).
- The user wants a subtle, colourful border-beam accent, via the `border-beam` package, not a plain grey UI.

## Evidence on Hand
- The hub has live real data: 3 Claude accounts, request and usage counts, quota and reset headers, and provider health.
- No fabricated data, accounts or metrics in shipped UI. Mocks must be labelled as synthetic.

## Product Principles
1. **Resets and remaining quota first.** Time-to-reset and window usage per account are the headline, not an afterthought.
2. **Anything wrong is obvious and one click from its fix,** for example sign-in needed → OAuth Login with that provider preselected.
3. **Glanceable over exhaustive** on the dashboard. Detail lives one level down.
4. **Stay a precise tool:** personality in detail, never at the cost of scanability.

## Accessibility & Inclusion
Keep the existing standard: keyboard paths, accessible names, reduced-motion handling, 12px type floor, and WCAG contrast checks on tokens.
