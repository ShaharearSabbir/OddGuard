Act as an expert Chrome Extension Developer specializing in React, TypeScript, and modern build tools. I want you to completely write the source code and configuration files for a distraction-blocking extension built on Manifest V3 using React and TypeScript. 

The extension is named "OddGuard". Its core purpose is to intercept automatic, muscle-memory browsing loops when "Focus Mode" is active, routing the user to a comprehensive React Single Page Application (SPA) that acts as a focus mirror workspace.

Please provide a complete project structure using Vite, React, and TypeScript. Ensure all files are complete, highly typed, contain no placeholders or truncated code sections, and conform to standard Manifest V3 specifications.

### 1. Configuration & Build Files

`package.json`
- Set up scripts for "dev" and "build" (vite build).
- Include dependencies: react, react-dom, typescript, vite, @types/react, @types/react-dom, and @types/chrome.

`vite.config.ts`
- Configure Vite to build the extension. It must compile the React source for popup.html and intercept.html, while outputting src/background.ts as a separate, un-bundled service worker file directly into the root of the output 'dist' folder.

### 2. Extension Blueprint

`manifest.json`
- Name the extension "OddGuard".
- Version 3 manifest pointing to the compiled JS chunks in the dist folder.
- Permissions: "declarativeNetRequest", "storage".
- Host permissions matching: "<all_urls>".
- Background service worker pointing to background.js.
- Action popup pointing to popup.html.
- Declare intercept.html under web_accessible_resources.

### 3. TypeScript State Definitions (`src/types.ts`)

Define explicit TypeScript interfaces for the application state saved in chrome.storage.local:
- `Task`: { id: string; text: string; completed: boolean; }
- `Project`: { id: string; name: string; goal: string; tasks: Task[]; }
- `AppState`: 
  * `isFocusModeActive`: boolean (Global toggle between Interception and Regular mode)
  * `defaultTimerDuration`: number (Configurable friction timer in seconds, defaults to 10)
  * `projects`: Project[]
  * `activeProjectId`: string | null
  * `blocklist`: string[]

### 4. Background Guard Worker (`src/background.ts`)

- Maintain an initial default blocklist: ["youtube.com", "twitter.com", "x.com", "facebook.com"].
- On install, check if state keys exist in chrome.storage.local; if not, initialize default values (isFocusModeActive: false, defaultTimerDuration: 10, default blocklist).
- Write a helper function that reads `isFocusModeActive` and the `blocklist`. If `isFocusModeActive` is false, it must clear all declarativeNetRequest session rules entirely. If true, it must register dynamic declarativeNetRequest redirection rules mapping each blocklist domain to a unique rule ID targeting `/intercept.html?target=DOMAIN`.
- Listen for updates using `chrome.storage.onChanged` to dynamically sync and refresh declarativeNetRequest rules the exact millisecond the user toggles focus modes or updates their blocklist.
- Implement a typed message listener for "allowBypass". Temporarily drop the blocking rule ID for that specific domain, and use a setTimeout to restore the rule exactly 15 minutes later.

### 5. Toolbar Controller (`src/popup.html` & `src/popup.tsx`)

A dark-themed (#0f172a), clean UI that acts as the OddGuard command panel:
- Toggle Button (Focus Mode vs Regular Mode): Switches the global `isFocusModeActive` state. Highlight visually with an alert color when Focus Mode is armed.
- Timer Configuration Input: Allows changing the `defaultTimerDuration` number field, updating chrome.storage.local.
- Domain Blocklist Manager: Input and list with delete mechanisms to add/remove custom domains on the fly.

### 6. OddGuard Workspace SPA (`src/intercept.html` & `src/intercept.tsx`)

A full-screen React Single Page Application utilizing a sleek, modern dark-mode interface:
- URL Parser: Grab the blocked target domain from the search params to show: "OddGuard Shield: Auto-pilot Intercepted for [target]".
- Component A: The Friction Timer
  * Reads `defaultTimerDuration` from storage.
  * Runs a countdown state from that value down to 0 immediately on mount.
  * Keeps the bypass button disabled, showing: "Pondering life choices... (Xs)".
  * Once 0 hits, enable the button and change text to: "Bypass Shield & Proceed to [Target]". Clicking it triggers the background bypass message and updates window.location.href.
- Component B: Project & Goal Switcher
  * Displays a selector dropdown or tab array of all `projects`.
  * Allows the user to select their current active working project. Switching projects syncs the `activeProjectId` immediately to storage.
  * Displays the selected project's main focus Goal statement prominently in large typography.
- Component C: Interactive Kanban/Task Grid
  * For the active project, render two distinct lists: "Pending Tasks" and "Completed Tasks".
  * Implement an inline Input form + "Add Task" action to push a new task to the selected project.
  * Provide checkboxes next to each task to switch its status between pending/done seamlessly.
  * Provide a delete icon next to each task to remove it from the array.
  * Every single mutation (add, delete, toggle complete) must immutably update the projects array in chrome.storage.local so the workspace data persists permanently.

Please write out these components cleanly with complete TypeScript types and state handlers so I can compile and load OddGuard into Chrome immediately.