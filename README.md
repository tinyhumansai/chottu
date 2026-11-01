# chottu

Chottu desktop and mobile apps, built with [Tauri 2](https://tauri.app) + React 19 + TypeScript + Vite.

## Layout

| Path                 | What                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `src-react/`         | Shared frontend (React, Vite config, tsconfig, static assets)         |
| `src-tauri-desktop/` | Tauri app for macOS, Windows, Linux (`chottu-desktop` crate)          |
| `src-tauri-mobile/`  | Tauri app for Android and iOS (`chottu-mobile` crate)                 |
| `Cargo.toml`         | Cargo workspace for both crates; shared dependency versions live here |

Both Tauri apps load the same `src-react` frontend. The `desktop` and `mobile` scripts point the
Tauri CLI at the right crate through `TAURI_APP_PATH`.

## Develop

```bash
pnpm install
pnpm desktop:dev       # desktop app with hot reload
pnpm desktop:build     # release bundles (deb/rpm/AppImage, dmg, msi…)

pnpm android:init      # once; needs Android SDK + NDK and Java
pnpm android:dev
pnpm ios:init          # once; macOS + Xcode only
pnpm ios:dev
```

`pnpm desktop <cmd>` and `pnpm mobile <cmd>` pass any other Tauri CLI command through, for example
`pnpm desktop add <plugin>` or `pnpm mobile icon`.

Linux needs the WebKitGTK 4.1 system deps; see <https://tauri.app/start/prerequisites/>.

## What's wired in

Both apps:

- Plugins: log, store, notification, dialog, fs, os, clipboard-manager, opener, process, deep-link
- `chottu://` deep links, received in the frontend through `onOpenUrl`
- A strict CSP in each `tauri.conf.json`

Desktop only:

- Tray icon with Show and Quit (`src-tauri-desktop/src/main.rs`)
- Plugins: single-instance (a second launch focuses the open window), window-state,
  global-shortcut, autostart

Not yet enabled: the updater plugin (needs a signing key and update endpoint).
