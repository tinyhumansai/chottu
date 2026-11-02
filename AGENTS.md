# Repository Guidelines

This file is the single source of truth for how humans and coding agents work
in this repository. `CLAUDE.md` is a symlink to this file, so every agent reads
the same instructions.

## What This Repository Is

The Chottu client apps: one React Native (Expo) app for iOS, Android and web,
and a Tauri 2 shell that ships that app's web build to macOS, Windows and
Linux. The chat bot itself lives in `chottu-core`; this repository is the
client only.

The repository is a submodule of the `workflow-chottu` umbrella. Cross-repo
plans belong at the umbrella root, not here.

## Project Structure

```text
package.json               # root pnpm package: workspace scripts + Tauri CLI
pnpm-workspace.yaml        # workspace members: src-native
.npmrc                     # node-linker=hoisted (Expo and Metro need it)
Cargo.toml                 # Cargo workspace: the desktop crate, shared deps
src-native/                # the app, pnpm package `chottu-native` (Expo)
├── app/                   # Expo Router: _layout.tsx (providers), index.tsx
│                          # (app shell: screens + floating nav + call)
├── screens/               # one file per nav tab
├── store/                 # zustand stores (chat, theme, ui, wallet, ideas,
│                          # call); chat and theme persist via lib/storage.ts
├── backend/               # the reply source behind `ChatBackend` (mock today)
├── voice-notes/           # record (expo-audio), play, waveform, data part
├── mini-apps/registry.ts  # the mini-apps list
├── hooks/                 # app hooks; `.web.ts` files are the web variants
├── lib/                   # id, time, storage, ask-chottu, `cn()`
├── components/            # our components: app-nav, top-bar, page,
│                          # chat-wallpaper, chottu-avatar, call-screen, layout
├── components/ui/         # gluestack-ui components (vendored by its CLI),
│                          # plus icon.tsx from the assistant-ui registry
├── components/assistant-ui/ # assistant-ui native elements (vendored)
├── global.css             # Tailwind v4 + Uniwind entry and every colour token
├── app.json               # Expo config: ids, permissions, plugins
└── metro.config.js        # Metro wrapped in Uniwind
src-tauri-desktop/         # crate `chottu-desktop`, binary `chottu`
├── src/main.rs            # plugins, tray icon, single-instance, deep links
├── capabilities/          # desktop permissions
└── tauri.conf.json        # loads src-native/dist; dev loads localhost:1420
```

### One app, every platform

- Everything a user sees lives in `src-native`. iOS and Android run it
  natively; web and desktop run its web export (react-native-web).
- The desktop shell stays thin: tray, single-instance, window-state, global
  shortcuts, autostart and deep links. Do not put UI in it.
- Code must run on native and on web. When a platform needs different code,
  use a platform file (`thing.web.ts` next to `thing.ts`) or `Platform.OS`,
  not runtime feature sniffing.
- Desktop-only APIs (`@tauri-apps/*`) are imported only from `.web.ts` files,
  behind `isTauri()`, and `invoke` failures are caught: the same web build also
  runs in a plain browser.

### Frontend rules

- State lives in zustand stores under `store/`. Components read from stores
  and call their actions; they do not hold conversation state. Persisted
  stores use `appStorage` from `lib/storage.ts` (AsyncStorage on native,
  localStorage on web).
- Anything that adds a message to the chat (backend, deep link, notification,
  a future feature) goes through `useChatStore.getState().register(...)`.
  Messages hold assistant-ui parts, so text, images, files, reasoning, tool
  calls and `data-*` parts all fit. Voice notes are `data-voice-note` parts
  (`voice-notes/types.ts`).
- If you change the persisted message shape, bump the store's persist
  `version` and add a `migrate` step so existing chats keep loading.
- Hermes has no `crypto` and no `Intl.RelativeTimeFormat`, and plain-http web
  pages have no `crypto.randomUUID`. Use `newId()` from `lib/id.ts` and
  `timeAgo()` from `lib/time.ts`.
- New tabs are a screen in `screens/` plus an entry in `SCREENS` and `tabs` in
  `app/index.tsx`. Navigation is `AppNav`: a floating bottom tab bar on phones
  and a floating left sidebar from 768px up. Screens run underneath it and pad
  themselves with `useNavInsets()` from `components/layout.ts`; change the
  constants there when the nav's size changes.
- The UI never calls a model or network API directly. Replies come through the
  `ChatBackend` interface in `backend/`, so the store and UI do not change when
  the backend does.
- UI primitives come from gluestack-ui: add them with its CLI from
  `src-native/` (`npx gluestack-ui@latest add <component>`), not by hand.
  assistant-ui elements come from its native registry
  (`npx assistant-ui@latest add <element>`, which reads `components.json`).
  Use React Native's own `View`, `Text` and `Pressable` for layout.
- Vendored components (`components/ui/`, `components/assistant-ui/`) are ours
  to edit, but keep edits small and mark each with a `Chottu:` comment saying
  why, so a later registry update can be merged. The thread
  (`thread.aui.tsx`) takes Chottu's `insets` prop and `ComposerExtra` /
  `ComposerOverlay` slots that way, and its message actions (copy, retry,
  edit) sit beside the bubble, shown on hover or long press, never under
  every message.
- Pages are `Page` from `components/page.tsx`. A page that switches between
  views passes `TopTabs` as its `toolbar`, which stays pinned under the title
  while the content scrolls (see the Ideas screen).
- Import through the `@/` alias, not long relative paths.
- Style with Tailwind classes (Uniwind). Every colour is a token in
  `global.css`, declared directly as `--color-*` under `@layer theme` with a
  light and a dark value; Uniwind only resolves that form on native. Do not
  hard-code colours in components; when JS needs a token's value (SVG strokes,
  placeholder colours), read it with `useCSSVariable`.
- The theme preference lives in `store/theme.ts` and reaches the app through
  `GluestackUIProvider mode`, which switches Uniwind's theme. Nothing else
  reads the colour scheme.
- There is no header bar. The chat screen has a floating `TopBar` with
  Chottu's avatar, name and the call button.

## Build And Test

Run commands from the repository root unless noted.

```bash
pnpm install

pnpm dev                 # web at http://localhost:1420
pnpm start               # Expo dev server for devices (Expo Go / dev build)
pnpm ios                 # native iOS build; macOS + Xcode only
pnpm android             # native Android build; needs the Android SDK
pnpm test                # Vitest suite (src-native)
pnpm typecheck           # tsc
pnpm build               # web export into src-native/dist

pnpm desktop:dev         # desktop app around the web dev server
pnpm desktop:build       # desktop bundles for the host platform

cargo fmt --all
cargo clippy --workspace --all-targets
```

`pnpm desktop <cmd>` forwards any Tauri CLI command to the desktop crate by
setting `TAURI_APP_PATH`, for example `pnpm desktop add <plugin>`.

Before reporting work done, run at least `pnpm test`, `pnpm typecheck`,
`pnpm build` and `cargo clippy --workspace --all-targets` and read their
output. For UI changes, also run the app (`pnpm dev`, a device, or
`pnpm desktop:dev`) and check the change on screen, in light and dark.

Do not start the Expo dev server with `CI=1`: CI mode turns off Metro's file
watching, so edits never reach the page.

Never send build output to a temp directory and never export
`CARGO_TARGET_DIR`; the shared target directory is configured for you.

## Coding Style

TypeScript:

- Strict mode is on. Do not use `any`, `@ts-ignore` or non-null assertions to
  get past the compiler; fix the type.
- Function components and hooks only. Keep components small; move logic that
  is not rendering into the store or a hook.
- Give every control an accessibility role and label; screen readers are a
  first-class way to use a voice-first app.
- Prefer files under roughly 300 lines and split by responsibility. Vendored
  registry components are exempt.

Rust:

- Standard `rustfmt` output and Rust 2024 idioms.
- Keep the desktop shell thin. A Tauri command does one small job and returns typed
  data; anything bigger belongs in a library crate, not in `main.rs` or
  `lib.rs`.
- Every Tauri command is listed in `generate_handler!` and needs a matching
  capability; check both when you add or remove one.
- Log through the `log` facade (`log::info!` and friends), which
  `tauri-plugin-log` collects. Never log credentials, tokens or message text.

Dependencies:

- Add a dependency only when it earns its weight; this app is meant to stay
  small. Say why in the PR.
- Tauri crates and npm packages stay on the same major version (Tauri 2).
  Use `pnpm desktop add <plugin>` so both sides are added together.
- Add Expo modules with `npx expo install <module>` from `src-native/` so the
  version matches the SDK, and run `npx expo install --fix` after upgrades.
- Use one copy of each assistant-ui package; install only
  `@assistant-ui/react-native`, never `@assistant-ui/react`.

## Testing

- Tests use Vitest (`pnpm test`), colocated as `*.test.ts` next to the code
  they cover. Test the stores, backend and helpers behind their interfaces,
  not component internals. `store/chat.test.ts` shows the pattern: mock
  `@/lib/storage` (AsyncStorage is a native module), stub globals with
  `vi.stubGlobal`, `vi.resetModules()`, then import the store fresh.
- There are no Rust tests yet. When you add them, they go in `<module>_tests.rs` beside the module, not in an inline
  `#[cfg(test)] mod tests` block.
- Tests never call real model APIs or other third-party services; use the
  mock backend or a fake `ChatBackend`.
- Every bug fix ships with a regression test that fails before the fix.

## Configuration and Security

- Keep the desktop `tauri.conf.json` CSP strict. Loosen it only for a named origin
  the app really needs, and say why in the PR.
- Grant the narrowest capability that works. Prefer a plugin's specific
  permissions over `:default` when you add a new one.
- Never commit secrets, API keys or `.env` files. When environment variables
  arrive, document them in `.env.example` with placeholder values.
- The deep-link scheme is `chottu://`. Treat everything that arrives through
  it as untrusted input.
- Ask for a native permission (microphone, notifications, …) only in
  `app.json` and only when a feature needs it, with a usage string that says
  why.

## Git Workflow

- Never commit directly to `main`. Do new work on a branch in a worktree,
  created from the umbrella with `worktree <slug>`.
- Commit subjects are concise and imperative, in conventional form:
  `feat(chat): add regenerate action`.
- Make small, focused commits, and never squash them.
- Never force-push a shared branch, rewrite published history, or bypass
  hooks with `--no-verify`.
- After a change lands here, bump the `chottu` gitlink in the umbrella.

## Pull Requests

Open PRs against `tinyhumansai/chottu`, ready for review rather than drafts,
unless the work genuinely must not merge yet. A PR should:

- summarize what changed and why;
- call out behavior changes, or state "None";
- list the validation commands actually run, with their outcome;
- include screenshots for UI changes;
- link each issue it closes with `Closes #<n>`.

Address review feedback by fixing it, and reply on each thread with what
changed. Do not resolve a thread you have not addressed or explicitly declined
with a reason.

## Agent Working Agreement

1. **Read before writing.** Match the surrounding code's conventions.
2. **Verify, do not assume.** Run the checks above and read the output before
   saying a task is done. Report failures with the output.
3. **Stay in scope.** Do what was asked; raise unrelated problems instead of
   fixing them on the side.
4. **No placeholders in delivered code.** No stubs, `todo!()` or
   commented-out alternatives. If something cannot be finished, say so.
5. **Do not weaken the guardrails.** No blanket lint allows, skipped tests,
   loosened CSP or widened capabilities just to get a green run.
6. **Keep the app light.** Question every new dependency, plugin and
   permission.
7. **Ask only when blocked.** Make routine calls yourself; escalate
   irreversible decisions or real forks with no clear default.
