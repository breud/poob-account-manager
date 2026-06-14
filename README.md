# Poob Roblox Account Manager

A polished Windows desktop application for managing multiple Roblox accounts. Launch accounts into games simultaneously, monitor their live presence, organize them with tags, and track session history — all from a single sleek interface. 
Built Completely With Claude Code.

Built with Electron + React + TypeScript. No installation required — just download and run the portable `.exe`.

---

## Features

### Account Management
- **Add accounts** via the Roblox login window or by pasting a `.ROBLOSECURITY` cookie directly
- **Status labels** — mark each account as Active, Expired, Disabled, or Banned
- **Avatar & stats** — profile pictures, Robux balance, friend count, follower count, and join date pulled from the Roblox API
- **Custom images** — upload your own image for any account
- **Rich descriptions** — give each account a full description with embedded images, viewable in an expanded panel
- **Favorites** — star accounts to pin them to the top
- **Bulk operations** — multi-select to launch, kill, or delete accounts at once
- **Import / Export** — back up and restore your account list as JSON

### Launching
- **Multi-instance support** — bypass Roblox's single-instance mutex to run multiple accounts at the same time
- **Place ID + Job ID** — launch into any game or a specific server
- **Last place memory** — the app remembers the last place you launched each account into
- **One-click open Roblox home** — launch an account to the Roblox website without entering a place ID

### Live Presence & Smart Sorting
- **Live presence polling** — the app polls the Roblox Presence API every 30 seconds to show each account's real-time status
- **In-Game** — shows the current game name, place ID, and a live session timer
- **Online / Offline** — reflects actual Roblox presence, not just cookie validity
- **Smart sort** — the dashboard automatically floats in-game accounts to the top, then online, then favorites, then most recently used

### Session History & Statistics
- Every game launch is recorded with username, game, timestamp, and in-game duration
- The Sessions page shows active and past sessions in a collapsible history list
- The Statistics page tracks total playtime, most-used accounts, and recent sessions
- The sidebar live badge shows how many accounts are currently in-game

### Organization & Filtering
- **Tags** — create color-coded tags and apply them to accounts
- **Filter by tag** and **sort by name (A–Z / Z–A)**, recent activity, or a custom drag-and-drop order
- **Search** — filter accounts by username, display name, description, or user ID in real time
- **Command Palette** (Ctrl+K) — spotlight-style search across accounts, tags, and navigation

### Dashboard
- At-a-glance stat cards: total accounts, in-game count, favorites, and active accounts
- Per-account cards with live presence, stats, quick launch/kill, and a details view
- Drag-and-drop reordering

### Privacy & Customization
- **Password lock** — optionally require a password when the app opens
- **Hide usernames / descriptions** — mask sensitive text across the whole UI
- **Themes** — accent + background color pickers, 60+ fonts, light effects, and presets
- **Compact mode** — tighter layout for more accounts per screen
- **Multi-instance toggle** — enable or disable running multiple Roblox clients
- **Log viewer** — open the app's log file directly from Settings

### UX
- Collapsible sidebar with icon-only mode
- Keyboard shortcuts: Ctrl+K (command palette), Ctrl+1–6 (jump to page), Escape (close modals)
- Toast notifications for all actions
- Smooth Framer Motion animations throughout
- Fully dark theme

---

## Why Antivirus Flags This

**Short answer: it's a false positive.** The source code is fully public — you can read and build it yourself.

Several legitimate things this app does happen to match patterns that antivirus heuristics look for:

- **Unsigned portable exe** — The `.exe` is not code-signed with a purchased certificate. Windows SmartScreen and most AV engines treat unsigned executables downloaded from the internet as suspicious by default, regardless of what the code actually does. A code-signing certificate costs hundreds of dollars per year, which is not worth it for a free personal tool.
- **Electron packaging** — Electron bundles an entire Chromium runtime into a single binary. A lot of actual malware uses Electron for the same reason (easy UI, hard to inspect), so AV engines flag the pattern even when the app is completely benign.
- **Mutex manipulation** — To run multiple Roblox clients at the same time, the app releases Roblox's single-instance mutex. Manipulating OS mutexes is a common technique in game cheats and injectors, so heuristic scanners flag it even when the purpose is harmless.
- **`.ROBLOSECURITY` cookie handling** — The app stores Roblox session tokens so you stay logged in. Account-stealing malware does the same thing, and some signature-based scanners flag any executable that reads or writes `.ROBLOSECURITY` strings regardless of intent.

If you don't trust the binary, build it yourself — the output is identical to the release:

```bash
git clone https://github.com/breud/poob-roblox-account-manager
cd poob-roblox-account-manager
npm install
npm run electron:build
```

The built exe will appear in `release/PoobRobloxAccountManager-portable.exe`.

---

## Download

Go to the [Releases](../../releases) page and download `PoobRobloxAccountManager-portable.exe`. No installation needed — just run it.

---

## Development

**Requirements:** Node.js 18+, npm

```bash
# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run electron:dev

# Build portable exe
npm run electron:build
```

The built exe appears in `release/PoobRobloxAccountManager-portable.exe`.

Account data is stored in `%APPDATA%\RobloxAccountManager\` and is never bundled into the exe.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Electron 31 |
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS + inline styles |
| Animation | Framer Motion |
| Icons | Lucide React |
| Color picker | react-colorful |
| Packaging | electron-builder (portable) |

---

## Privacy & Security

- Cookies are stored **only** on your local machine in `%APPDATA%\RobloxAccountManager\`
- No data is ever sent to any server other than Roblox's own APIs
- The source code contains zero hardcoded credentials, cookies, or account data

---

## License

MIT — see [LICENSE](LICENSE)
