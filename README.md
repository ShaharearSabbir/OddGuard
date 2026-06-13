# OddGuard

> Intercept distraction loops and refocus on your goals.

OddGuard is a Manifest V3 Chrome extension that blocks distracting websites when Focus Mode is active. Instead of letting you mindlessly browse, it redirects you to a focused workspace with a friction timer, project goals, deadline countdown, and a task board.

## Features

- **Focus Mode Toggle** — One-click toggle from the popup to arm/disarm distraction blocking
- **Friction Timer** — Configurable countdown before you can bypass a blocked site. Use the pause to reconsider your intention
- **Per-Tab Bypass** — After the timer expires, you can bypass the block for a single tab. The rule is automatically re-added after 3 seconds
- **Project Management** — Create projects with a focus goal and deadline
- **Kanban Task Board** — Add, complete, and delete tasks for your active project. View pending and completed tasks side by side
- **Live Deadline Countdown** — See how much time remains before your project deadline (or how overdue you are)
- **Blocked Domains** — Default blocklist included (YouTube, Twitter, Reddit, Netflix, etc.) plus you can add/remove any domain
- **30+ Default Blocked Sites** — Covers social media, forums, streaming, and messaging platforms
- **Dark Theme** — Sleek dark UI with amber accents
- **Works Offline** — All logic runs locally; no data leaves your browser

## Installation

1. Download the latest release or clone this repo
2. Run `npm run build`
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. Click **Load unpacked**
6. Select the `dist/` folder

## Development

```bash
npm install
npm run build
```

Load `dist/` unpacked in Chrome. Iterate by rebuilding and reloading the extension.

## Usage

1. Click the OddGuard icon in the Chrome toolbar to open the popup
2. Toggle **Focus Mode** ON
3. Try visiting a blocked site — you'll be redirected to the OddGuard workspace
4. Wait for the friction timer, review your current project/goal, then either bypass or go back
5. Use the popup to add projects, set deadlines, and manage blocked domains

## Author

**Shaharear Sabbir**

- GitHub: [@ShaharearSabbir](https://github.com/ShaharearSabbir)
- LinkedIn: [in/shaharearrahmansabbir](https://www.linkedin.com/in/shaharearrahmansabbir/)
