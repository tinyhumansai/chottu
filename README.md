# chottu

The Chottu client apps: one React Native codebase for iOS, Android, web, and (through a Tauri 2
shell) macOS, Windows and Linux.

| Path                 | What                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| `src-native/`        | The app: Expo (React Native), pnpm package `chottu-native`                   |
| `src-tauri-desktop/` | Tauri 2 desktop shell that loads the Expo web build (`chottu-desktop` crate) |
| `Cargo.toml`         | Cargo workspace for the desktop crate                                        |

Stack:

- **Expo SDK 58** (React Native 0.88, Expo Router)
- **[assistant-ui native](https://www.assistant-ui.com/native)** for the chat thread, composer and messages
- **[gluestack-ui v5](https://gluestack.io)** for UI primitives (buttons, switches, dialogs, toasts)
- **[Uniwind](https://uniwind.dev)** (Tailwind v4) styling, shared by assistant-ui and gluestack
- **[zustand](https://zustand.docs.pmnd.rs)** stores
- **expo-audio** for voice notes

## Develop

```bash
pnpm install

pnpm dev               # web, at http://localhost:1420 (and on your LAN)
pnpm start             # Expo dev server: scan the QR code with Expo Go or a dev build
pnpm ios               # native iOS build (macOS + Xcode)
pnpm android           # native Android build (Android SDK)

pnpm desktop:dev       # desktop app around the web dev server
pnpm desktop:build     # desktop bundles (deb/rpm/AppImage, dmg, msi…)

pnpm test              # Vitest: stores, backend, helpers
pnpm typecheck
pnpm build             # web export into src-native/dist (the desktop app ships this)
```

`pnpm desktop <cmd>` passes any other Tauri CLI command through, for example
`pnpm desktop add <plugin>`. Linux desktop builds need the WebKitGTK 4.1 system deps; see
<https://tauri.app/start/prerequisites/>.

## The app

- **Chat:** assistant-ui's native thread over the chat store (`useExternalStoreRuntime`), on a
  WhatsApp-style wallpaper, with a floating top bar (Chottu, plus a call button) and a one-line
  composer. With nothing typed, the composer's action is the mic: voice notes record, play with a
  seekable waveform, and persist.
- **Wallet:** balance and transactions (sample data).
- **Ideas:** suggestions, schedules (crons) and notifications (sample data).
- **Mini-apps:** shortcuts that ask Chottu.
- **Settings:** system, light or dark theme, and clearing the chat history.
- **Call:** a full-screen call with Chottu. The connection is mocked; the state machine is real.

Navigation is a floating bottom tab bar on phones and a floating left sidebar from 768px up.

Replies come from `src-native/backend/`, a mock that echoes word by word. Plug a real model in
there; nothing else changes.

## What's wired in

- `chottu://` deep links: Expo Linking on mobile, the Tauri deep-link plugin on desktop. Each link
  lands in the chat as a system message.
- Microphone permission on iOS and Android (`app.json`), and a strict CSP on desktop.
- The desktop shell: tray icon, single-instance, window-state, global-shortcut, autostart, plus the
  log, store, notification, dialog, fs, os, clipboard, opener, process and deep-link plugins.
