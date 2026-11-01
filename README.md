# chottu

Chottu desktop app, built with [Tauri 2](https://tauri.app) + React 19 + TypeScript + Vite.

## Develop

```bash
pnpm install
pnpm tauri dev        # desktop app with hot reload
pnpm tauri build      # release bundles (deb/rpm/AppImage, dmg, msi…)
pnpm tauri android init && pnpm tauri android dev   # mobile
```

Linux needs the WebKitGTK 4.1 system deps; see <https://tauri.app/start/prerequisites/>.

## What's wired in

- **Tray icon** with Show/Quit menu (`src-tauri/src/lib.rs`)
- **Deep links**: `chottu://` scheme, received in the frontend via `onOpenUrl`
- **Single instance**: a second launch focuses the existing window
- **Plugins**: log, store, notification, dialog, fs, os, clipboard-manager, opener, process,
  deep-link; desktop-only: single-instance, window-state, global-shortcut, autostart
- **Capabilities** in `src-tauri/capabilities/` (`default.json` for all platforms,
  `desktop.json` for desktop-only plugins), plus a strict CSP in `tauri.conf.json`

Not yet enabled: the updater plugin (needs a signing key and update endpoint).
