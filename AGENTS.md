# Repository Guidelines

This file is the single source of truth for how humans and coding agents work
in this repository. `CLAUDE.md` is a symlink to this file, so every agent reads
the same instructions.

## What This Repository Is

The Chottu client apps: one React chat frontend shipped through two Tauri 2
shells, one for desktop (macOS, Windows, Linux) and one for mobile (Android,
iOS). The chat bot itself lives in `chottu-core`; this repository is the
client only.

The repository is a submodule of the `workflow-chottu` umbrella. Cross-repo
plans belong at the umbrella root, not here.

## Project Structure

```text
Cargo.toml                 # virtual Cargo workspace: both Tauri crates, shared
                           # [workspace.package] and [workspace.dependencies],
                           # release profile
package.json               # root pnpm package: Tauri CLI + the desktop/mobile
                           # scripts; no frontend code
pnpm-workspace.yaml        # workspace members: src-react
src-react/                 # the frontend, pnpm package `chottu-react`
├── src/
│   ├── App.tsx            # app shell: screens + floating bottom bar
│   ├── screens/           # one file per bottom-bar tab (chat, settings)
│   ├── store/chat.ts      # zustand store: messages of any part type,
│   │                      # register, send, regenerate, cancel, clear;
│   │                      # persisted to localStorage (versioned)
│   ├── store/theme.ts     # zustand store: system/light/dark preference
│   ├── backend/           # the reply source behind `ChatBackend`
│   │                      # (mock today; swap for a real model client)
│   ├── components/ui/     # shadcn components (vendored by the shadcn CLI)
│   ├── components/assistant-ui/ # assistant-ui registry components (vendored)
│   ├── components/        # our own components (bottom-bar, top-bar, app-menu,
│   │                      # chottu-avatar)
│   ├── hooks/             # app hooks + hooks pulled in by registry components
│   ├── lib/utils.ts       # `cn()` helper
│   ├── lib/id.ts          # `newId()`; use it, never `crypto.randomUUID`
│   └── index.css          # Tailwind v4 entry + shadcn theme tokens
├── components.json        # shadcn CLI config (radix base, Nova preset)
└── vite.config.ts         # Vite + Tailwind; `@/` alias to src/
src-tauri-desktop/         # crate `chottu-desktop`, binary `chottu`
├── src/main.rs            # plugins, tray icon, single-instance, deep links
├── capabilities/          # desktop permissions
└── tauri.conf.json
src-tauri-mobile/          # crate `chottu-mobile`, lib `chottu_mobile_lib`
├── src/lib.rs             # mobile entry point and plugins
├── src/main.rs            # host-only binary for quick desktop checks
├── capabilities/          # mobile permissions
└── tauri.conf.json
```

### Two shells, one frontend

- Both shells load the same `src-react` build. Anything a user sees belongs in
  `src-react`, never in a shell.
- Desktop-only behavior (tray, single-instance, window-state, global
  shortcuts, autostart) lives only in `src-tauri-desktop`. Do not add
  `cfg(desktop)` branches to the mobile crate, or `cfg(mobile)` branches to the
  desktop crate; put the code in the crate that owns the platform.
- A plugin used by both shells is declared once in the root
  `[workspace.dependencies]` and taken with `{ workspace = true }` in each
  crate. Register it in both `src/` entry points and grant it in both
  `capabilities/` folders.
- The frontend must work in both shells and in a plain browser (`pnpm dev`).
  Guard calls into desktop-only plugins, and catch `invoke` failures rather
  than assuming a Tauri host.

### Frontend rules

- State lives in zustand stores under `src/store/`. Components read from
  stores and call their actions; they do not hold conversation state.
- Anything that adds a message to the chat (backend, deep link, notification,
  a future feature) goes through `useChatStore.getState().register(...)`.
  Messages hold assistant-ui parts, so text, images, files, reasoning,
  tool calls and `data-*` parts all fit. Image URLs must be `https:`,
  `blob:` or `data:image/…`; assistant-ui drops anything else.
- If you change the persisted message shape, bump the store's persist
  `version` and add a `migrate` step so existing chats keep loading.
- The app is also served over plain http (LAN, phone testing), which is not a
  secure context. Do not use secure-context-only APIs such as
  `crypto.randomUUID` or `navigator.clipboard` without a fallback.
- New tabs are a screen in `src/screens/` plus an entry in `TABS` in
  `App.tsx`. The bottom bar floats; screens get bottom padding from
  `BOTTOM_BAR_SPACE` so nothing sits under it.
- The UI never calls a model or network API directly. Replies come through
  the `ChatBackend` interface in `src/backend/`, so the store and UI do not
  change when the backend does.
- Add UI primitives with the shadcn CLI from `src-react/`
  (`pnpm dlx shadcn@latest add <component>`), not by hand. assistant-ui
  components come from its registry the same way
  (`https://r.assistant-ui.com/<name>.json`).
- Vendored components are ours to edit, but keep edits small and leave a
  one-line comment saying why, so a later registry update can be merged.
- Import through the `@/` alias, not long relative paths.
- Style with Tailwind classes and the theme tokens in `index.css`. Do not add
  hard-coded colours; light and dark both come from the tokens (add a token,
  with a value in both themes, as was done for `bubble-user`,
  `bubble-assistant` and `chat-bg`). The chat wallpaper is the `.chat-wallpaper`
  class in `index.css`; its doodle tile is an inline SVG data URL, so use
  single quotes inside it.
- Dark mode is the `dark` class on `<html>`, set by `useApplyTheme` from the
  theme store. Do not read `prefers-color-scheme` anywhere else.
- There is no header bar. The chat screen has a floating `TopBar` (Chottu's
  avatar and name, the `AppMenu` hamburger); app-level actions go in that menu.

## Build And Test

Run commands from the repository root unless noted.

```bash
pnpm install

pnpm dev                 # frontend only, in a browser at http://localhost:1420
pnpm build               # type-check + production build into src-react/dist
pnpm test                # Vitest suite (src-react)

pnpm desktop:dev         # desktop app with hot reload
pnpm desktop:build       # release bundles for the host platform

pnpm android:init        # once per checkout; needs Android SDK, NDK and Java
pnpm android:dev
pnpm ios:init            # once; macOS + Xcode only
pnpm ios:dev

cargo fmt --all
cargo clippy --workspace --all-targets
```

`pnpm desktop <cmd>` and `pnpm mobile <cmd>` forward any Tauri CLI command to
the right crate by setting `TAURI_APP_PATH`, for example
`pnpm desktop add <plugin>`. Avoid plain `pnpm tauri` unless you set
`TAURI_APP_PATH` yourself; with two Tauri crates in the tree it can pick the
wrong one.

Before reporting work done, run at least `pnpm build`, `pnpm test` and
`cargo clippy --workspace --all-targets` and read their output. For UI
changes, also launch the app (`pnpm dev` or `pnpm desktop:dev`) and check the
change on screen.

Never send build output to a temp directory and never export
`CARGO_TARGET_DIR`; the shared target directory is configured for you.

## Coding Style

TypeScript:

- Strict mode is on. Do not use `any`, `@ts-ignore` or non-null assertions to
  get past the compiler; fix the type.
- Function components and hooks only. Keep components small; move logic that
  is not rendering into the store or a hook.
- Prefer files under roughly 300 lines and split by responsibility. Vendored
  registry components are exempt.

Rust:

- Standard `rustfmt` output and Rust 2024 idioms.
- Keep the shells thin. A Tauri command does one small job and returns typed
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

## Testing

- Frontend tests use Vitest (`pnpm test`), colocated as `*.test.ts` / `*.test.tsx` next to
  the code they cover. Test the store and the backend behind their interfaces,
  not component internals. `src/store/chat.test.ts` shows the pattern:
  stub globals with `vi.stubGlobal`, `vi.resetModules()`, then import the
  store fresh.
- There are no Rust tests yet. When you add them, they go in `<module>_tests.rs` beside the module, not in an inline
  `#[cfg(test)] mod tests` block.
- Tests never call real model APIs or other third-party services; use the
  mock backend or a fake `ChatBackend`.
- Every bug fix ships with a regression test that fails before the fix.

## Configuration and Security

- Keep each `tauri.conf.json` CSP strict. Loosen it only for a named origin
  the app really needs, and say why in the PR.
- Grant the narrowest capability that works. Prefer a plugin's specific
  permissions over `:default` when you add a new one.
- Never commit secrets, API keys or `.env` files. When environment variables
  arrive, document them in `.env.example` with placeholder values.
- The deep-link scheme is `chottu://`. Treat everything that arrives through
  it as untrusted input.

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
