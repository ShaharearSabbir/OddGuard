# OddGuard — Agent Context

## Project Overview
Manifest V3 Chrome extension that intercepts distraction browsing loops when Focus Mode is active, routing the user to a React SPA workspace with a friction timer, project management, and Kanban task board.

## Stack
- **Build**: Vite 8, TypeScript 6, React 19
- **UI**: Tailwind CSS 3, shadcn/ui conventions (custom `src/components/ui/`), lucide-react icons
- **Chrome APIs**: `declarativeNetRequest`, `storage` (local + session), `runtime`, `tabs`
- **Key deps**: `@radix-ui/react-checkbox`, `@radix-ui/react-label`, `@radix-ui/react-select`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`

## Project Structure
```
oddguard/
├── AGENTS.md               # This file
├── README.md               # GitHub-facing readme
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── manifest.json           # MV3, permissions, host_permissions, icons
├── popup.html              # Vite entry — popup SPA
├── intercept.html          # Vite entry — intercept SPA
├── src/
│   ├── index.css           # Tailwind directives + shadcn dark HSL vars
│   ├── vite-env.d.ts       # Vite client types
│   ├── types.ts            # AppState, Project, Task, message interfaces
│   ├── background.ts       # Service worker: DNR sync, bypass handler
│   ├── popup.tsx           # Popup entry: hamburger nav, state management
│   ├── intercept.tsx       # Intercept entry: renders InterceptPage
│   ├── pages/
│   │   ├── FocusPage.tsx       # Big toggle with PNG icon knob
│   │   ├── ProjectsPage.tsx    # Project CRUD + DatePicker
│   │   ├── SettingsPage.tsx    # Timer config + blocked domains
│   │   └── InterceptPage.tsx   # Full-page workspace: timer, project, Kanban
│   ├── components/
│   │   └── ui/                 # shadcn-style primitives
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── select.tsx
│   ├── lib/
│   │   └── utils.ts            # cn(), generateId(), formatDeadlineRemaining()
│   └── assets/icons/           # icon16.png, icon32.png, icon48.png, icon128.png
└── dist/                       # Build output (gitignored)
```

## Build & Development
- `npm run build` — runs `vite build`, then copies `manifest.json` and `src/assets/icons/` to `dist/`
- Load in Chrome: `chrome://extensions` → Developer mode → Load unpacked → `dist/`
- No dev server; iterating requires `npm run build` + extension reload

## Architecture

### State
- All app state lives in `chrome.storage.local` keyed as `AppState`:
  ```ts
  interface AppState {
    isFocusModeActive: boolean
    defaultTimerDuration: number  // friction timer seconds
    projects: Project[]
    activeProjectId: string | null
    blocklist: string[]
  }
  ```
- Popup reads state via `chrome.storage.local.get(null)` on mount, writes patches directly with `chrome.storage.local.set()`
- Intercept page reads state on mount and listens to `chrome.storage.onChanged` for live updates

### DNR Rules (Session-scoped)
- One rule per blocked domain, `id: index + 1`
- `action.type: "redirect"` → `chrome.runtime.getURL("intercept.html?target=<domain>")`
- `condition.resourceTypes: ["main_frame"]`
- `syncRules()` tears down ALL existing rules then re-adds the full blocklist — ensures adding a domain while Focus Mode is ON takes effect immediately
- Called on `onInstalled`, `onStartup`, and whenever `isFocusModeActive` or `blocklist` changes in storage

### Per-Tab Bypass
1. Intercept page renders friction timer countdown
2. User clicks "Bypass" → `allowBypass` message sent to background
3. Background removes DNR rule for that domain, stores `bypass:${tabId}` → `{ domain, time, ruleIds }` in `chrome.storage.session`
4. Background calls `chrome.tabs.update(tabId, url)` to navigate
5. After 3s timeout, removes session key and re-adds the DNR rule
6. On mount, intercept page sends `checkBypass` message — if `bypass:${tabId}` still exists for matching domain, bypass is confirmed; otherwise user must wait out the timer

### Intercept Page
- Checks bypass on mount (redirects immediately if valid)
- Shows friction timer with progress bar
- Project selector dropdown (populated from storage)
- Inline project creation (name, goal, datetime-local deadline) via "Add" button
- Live deadline countdown (updates every second) — green if remaining, red if overdue
- Kanban task board: Pending / Completed columns with add, checkbox toggle, delete

### Popup
- 380px wide, fixed height with scroll
- Hamburger menu dropdown → Focus / Projects / Settings pages
- Focus: big toggle switch with PNG icon knob, "FOCUS ARMED" / "FOCUS DISARMED"
- Projects: list with checkbox selection, delete, inline add form with datetime-local deadline
- Settings: friction timer number input, blocked domains list (add/delete)
- Footer with developer name and GitHub/LinkedIn links (inline SVG icons)

### Styling
- Dark theme only (#0f172a base) via CSS custom properties in `src/index.css`
- shadcn HSL variable system (`--primary: 38 92% 50%` = amber)
- Tailwind `darkMode: 'class'` (class-based)
- Animations: `fade-in` and `scale-in` defined in config

## Default Blocklist
```ts
const DEFAULT_BLOCKLIST = [
  "youtube.com", "twitter.com", "x.com", "facebook.com",
  "instagram.com", "tiktok.com", "linkedin.com", "pinterest.com",
  "reddit.com", "quora.com", "news.ycombinator.com",
  "netflix.com", "twitch.tv", "disneyplus.com", "hulu.com",
  "amazon.com/primevideo",
  "discord.com", "whatsapp.com", "telegram.org",
]
```

## Known Patterns & Gotchas
- All `chrome.storage.local.get(null)` results are cast through `unknown` then to `AppState` to satisfy TS 6 strict checks
- `chrome.storage.session` is cleared on `onStartup` to avoid stale bypass keys
- PNG icons imported as modules in code (Vite handles bundling): `import toggleIcon from '../assets/icons/icon32.png'`
- Inline SVG icons used in footer (GitHub, LinkedIn) — lucide-react does not export brand icons
- `checkbox.tsx` uses `CheckboxPrimitive.Indicator` + `Check` icon with `strokeWidth={3}`
- `select.tsx` uses Radix icons (`CaretSortIcon`, `CheckIcon`) instead of lucide
- DNR rule IDs are 1-indexed, generated from `blocklist` index (so they shift when domains are added/removed — hence remove-all-then-re-add approach)
- Intercept page `setInterval` for deadline countdown: re-created when `activeProjectId` changes

## Console Message Types
- `AllowBypass`: `{ type: "allowBypass", domain: string }`
- `CheckBypass`: `{ type: "checkBypass", domain: string }`

## Future Considerations
- Could add `chrome.alarms` for persistent timers across SW idle
- Could add sync storage for cross-device project sync
- Could switch to `key`/`id` offsets for DNR rules to avoid full remove-all
- Could add on/off toggle per domain in blocklist
- Could persist friction timer state across page reloads
