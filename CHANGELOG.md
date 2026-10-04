# Changelog

All notable changes to o1-code are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Scrolling the conversation responds in the same frame: the first wheel tick or key of a burst
  moves the view at once and the rest of the burst is applied once per frame, for the mouse wheel
  and for Shift+↑/↓, PgUp/PgDn and the bare arrows on an empty prompt alike. The scrollbar shows
  only when you scroll, not while a response grows at the bottom.
- The repository now lives at `github.com/organizaone/o1-code`. Links in the interface
  (documentation, "report an issue", release notes), in the package metadata and in the
  documentation point there; the old address redirects.

## [0.5.1] - 2026-10-03

### Changed

- The terminal interface redraws only the lines that changed between frames instead of erasing and
  rewriting the whole screen on every spinner tick and streamed chunk. Terminals without
  synchronized output (GNOME Terminal, Ptyxis, Terminal.app) no longer flicker while a response
  streams, and the interface sends about a tenth of the data to the terminal. Resizing the terminal
  repaints the whole screen once, so no row is left behind. New setting `ui.incrementalRendering`
  (default `true`) and `O1CODE_INCREMENTAL_RENDERING=0` turn the previous behavior back on.

## [0.5.0] - 2026-10-02

### Changed

- A shell command or monitor whose `directory` is outside the workspace is no longer refused: it
  asks for approval, with a warning naming the directory (and where it really points, when it is
  a link). The question is asked even for a read-only command and in every mode but YOLO, which
  runs it; in Auto it goes to manual approval, never to the classifier. A `permissions.allow`
  rule that matches the command still auto-allows it.
- A daemon session remembers its approval mode: a change made in the session (`/session/:id/approval-mode`,
  ACP `session/set_mode`, or the mode given at creation) is recorded in its transcript and comes
  back on `/load` and `/resume` when the request names no mode; in Plan, the execution mode chosen
  for leaving it comes back too. A rewind keeps the mode of the branch it keeps.
- A subagent's frontmatter `hooks` fire only for that invocation of the subagent: its own tool
  calls and events, not the parent session's, a sibling's or a nested agent's, and two invocations
  of the same agent keep their hooks apart. `SubagentStart` and `SubagentStop`, fired by the parent,
  go to the hooks of the agent type they name. Hooks from settings, extensions and skills are not
  scoped and behave as before.

### Fixed

- A Claude session on the Anthropic protocol no longer fails with "Invalid signature in thinking
  block" after a tool call, turn after turn: signed thinking is kept byte for byte instead of
  having its surrounding whitespace trimmed.
- The startup cleanup of stale agent worktrees no longer deletes what git does not track: an
  untracked file, or an ignored one such as `.env`, keeps the worktree; dependency and build output
  (`node_modules`, `dist`, `coverage`, at any depth) and symlinked directories do not. The daemon's
  cleanup of deleted sessions follows the same rule.
- With several `PreToolUse` hooks, the most restrictive permission wins (deny, then ask, then
  allow) whatever their order and whichever field they used; a later hook's allow no longer
  overrides an earlier hook's deny.
- Command output that is not UTF-8 is decoded with the console's own code page (`chcp 866`, `1252`,
  `936`, …) before any statistical guess, which misread Cyrillic as Western text. A code page
  with no decoder (`437`, `850`, `852`) or a locale such as `C` falls back to the guess instead
  of failing the shell command.
- On Windows, the relaunch after an automatic update through npm's `o1-code.cmd` no longer fails
  with `'\"\"C:\...\o1-code.cmd\"\"' is not recognized`: the command line reaches `cmd.exe`
  verbatim. A launcher path holding cmd metacharacters skips the relaunch and keeps the update.
- The automatic update no longer fails when npm refuses to print its global configuration path
  (a UUID in the global prefix is enough): the path is read from npm's own child environment.
- When the automatic update fails, the message names the cause instead of only "try updating
  manually".
- The `<available_skills>` listing is sent only when the Skill tool is available: not when the
  tool is excluded from the session, and not to a subagent whose `disallowedTools` names it. The
  listing cost input tokens on every request for a tool the model could not call.
- The `additionalContext` a `PreToolUse` hook returns reaches the model with that call's result,
  whatever the decision: appended to the output of an allowed call, including one the user
  approved after an `ask`, and to the error of a denied one. Before, it was dropped.
- The endpoint stored with the vision and image model selectors is shown without its
  credentials: `/model --vision` and the daemon's provider status print `https://<redacted>@host`
  when the URL carries `user:password@`.
- `sed --quiet` and `sed --silent`, GNU's long forms of `-n`, are read as read-only like `-n`,
  so they run without a confirmation prompt; a script that writes a file is still a write.
- `web_fetch` falls back from its https upgrade to the http URL the caller gave when the https
  connection fails because the host or network is unreachable (`EHOSTUNREACH`, `ENETUNREACH`),
  and classifies a dual-stack host by any of its address attempts, not only the first one Node
  reports.
- An MCP server's OAuth discovery that advertises no client registration endpoint no longer
  discards the `registrationUrl` configured for that server; dynamic registration uses it.
- An ACP `session/update` snapshot too deep or too large for the channel's structure bound
  (available commands, current mode, session info) is dropped and logged without its payload,
  instead of closing the channel; the next snapshot of the same kind replaces it. Any other
  oversized notification still closes the channel.
- Pressing Enter while the completion dropdown is still loading ("Loading suggestions…" with an
  empty list) submits the typed prompt instead of being swallowed with nothing to accept.
- The `o1-code serve` daemon loads a workspace's settings for extensions without publishing that
  workspace's `.env` into the daemon's shared environment, without consuming the one-shot
  settings-corruption marker, and without parsing the settings of a workspace whose trust is not
  established.
- A process relaunched by the CLI's own supervisor (streaming, ACP and launches that need extra
  Node flags) exits at most two minutes after that supervisor is gone, instead of running on
  indefinitely when the host kills the supervisor and keeps the child's input open.
- ACP rewind no longer counts the turns the daemon adds when it delivers background
  notifications: they never produced a client-visible turn, and counting them shifted every rewind
  point after them.
- A session export stamps each text message with the uuid and timestamp of the record it came
  from. The message was written out only when the next message of another kind started, and by
  then the identity was read from that next record.

## [0.4.0] - 2026-09-30

### OrganizaOne

- The model list request to the proxy carries the same `X-Title: o1-code` and `O1Code/<version>`
  User-Agent as the model requests. The User-Agent's product name now comes from `brand.json`.
- A model is read as Claude's when the proxy's `owned_by` names Claude; a Claude model listed
  without `reasoning` still takes every level.
- On the Anthropic protocol, the effort stays within the levels the proxy listed for the model, and
  an effort switched off is sent as `thinking: {type: "disabled"}` (the proxy runs it at low)
  instead of being left out (the model's default). On the OpenAI protocol, a level the model does
  not list goes to the nearest one it does instead of being dropped.
- A 429 or 503 of the proxy's own (an account limit, a closed Claude window, a provider cooling
  down) whose wait is longer than 5 minutes stops the request with the reason and the time to try
  again, instead of waiting it out silently; shorter waits are retried as before. A 502
  `upstream_redirected` is no longer retried.
- On the Anthropic protocol, prompt usage through the proxy counts cache reads on top of the input,
  as the proxy reports them, so the context meter no longer under-counts.

### Changed

- `/auth` keeps one provider for conversation: connecting a provider replaces the conversation
  models of the others, so `/model` lists only the current provider. Image, voice and realtime
  routes stay, and so do saved keys.

### Fixed

- The first request after `/auth` no longer fails with 401 until a restart. The interactive process
  did not know which key variables it had exported from the credential store, so a newly saved key
  could not replace the old one.
- Copying a selection from the prompt input yields the typed text: no border or padding
  characters, soft-wrapped rows joined back, typed newlines kept. Selections elsewhere no longer
  copy cells past the edge of their region.

## [0.3.0] - 2026-09-29

### Agent

- Five new bundled skills: `tdd` (a test that fails first, for the stated reason, then passes),
  `debugging` (trace the cause before changing anything), `design` (settle the shape of a feature
  before its plan), `write-plan` (a plan with one verifiable task per step) and `execute-plan`
  (work the plan task by task, each committed on its own). `new-app` opens with `design`.
- The system prompt asks the agent to consult its skills before acting, to claim a result only
  from output seen after its last edit, and to treat a test that passes without the change as no
  proof; it enters plan mode when asked, when the request says to plan, or when the gaps are large.
  Every bundled skill's description says when to use it, so the listing reads as a menu.
- A headless run (`-p`) no longer ends with an empty result when the last turn was a tool call or
  a Goal update: the last report the agent wrote is kept, followed by the ended Goal's state.

## [0.2.2] - 2026-09-28

### Terminal interface

- An update of O1-Code stands out: a framed notice says it was installed and applies on the next
  run, or why it failed, instead of a plain status line. The first run of a new version shows
  what is new in it, with a link to the full release notes.
- The input keeps its borders aligned in GNOME Terminal and Ptyxis: the right border no longer
  moves one column in when the cursor is at the end of the line, and a session name set with
  `/rename` no longer breaks the top border.

## [0.2.1] - 2026-09-28

### Terminal interface

- A message you sent now stands apart from the reply and the tool rows: a brand-coloured bar runs
  down every line of it and its text is brand soft, instead of the same colour as everything else.
- `/model` sets the reasoning effort along with the model: ←/→ move along `default` and the
  tiers the highlighted model takes, and Enter applies both.
- `/effort` offers `default` first, which clears the saved tier so the model/provider decides;
  `/effort default` does the same. The effort picker is translated to Portuguese.
- The text in the input can be selected by dragging over it, like the conversation, and is copied
  on release. A click without a drag still places the cursor.
- While monitors run, the activity line shows `● monitoring (N)` next to `info`, `reading` and the
  others. While background work runs, the first ↑ from an empty input focuses it, with
  `enter open · ↑ history · esc back`; Enter opens the dialog, and ↑ goes on into history. ↓ no
  longer goes up to them. `/tasks` opens the same dialog instead of printing a list.

### Fixed

- Search works again after installing from npm. 0.2.0 shipped its bundled ripgrep without the
  execute permission, so every start warned "Ripgrep not available … EACCES" and fell back to the
  slower built-in grep. The package ships the binary executable again, the release refuses a
  tarball where it is not, and an install of 0.2.0 repairs itself on the next start.
- Connecting a provider: when checking the key timed out or hit a network error, the model step
  opened with no list and only going back to the key brought it. The model step now asks the
  provider again on its own, `ctrl+r` reloads the list at any time (the models already checked
  stay checked), and a list that cannot be read says so at the top of the step.

### OrganizaOne

- Requests to the OrganizaOne proxy name the agent: `X-Title: o1-code` and an `O1Code/<version>`
  User-Agent, instead of presenting as another client on the Anthropic protocol.
- The reasoning effort reaches the proxy on the OpenAI protocol as well: it is sent as
  `reasoning_effort`, the field the proxy reads, instead of a nested field it ignored.
- Connecting a provider keeps the reasoning efforts each model declares in the model list
  (`reasoning.efforts` and `reasoning.default`; a Claude model of the proxy takes every level),
  which is what sends the effort in the field the proxy reads. Providers connected before this
  release get it by connecting again with `/auth`.
- The footer shows `reasoning default` for a model that takes an effort when none was chosen.

### Documentation

- Every install instruction uses `@organizaone/o1-code@latest`, and the troubleshooting FAQ
  explains the automatic update and `/update` instead of rebuilding a clone.
- The npm package declares its Apache-2.0 license, and the README drops the badges a private
  repository cannot serve.

## [0.2.0] - 2026-09-28

### Terminal interface

- The message that started a turn shows the turn's state in its prefix column: a spinner while
  the agent has shown nothing yet, `❯` with `…` after the text once something appears, and `✓`
  when the turn ends. A cancelled or failed turn leaves `❯`.

### Documentation

- The README opens on what o1-code is and how to install it from npm, with a screenshot of the
  start screen and links to the feature documentation; building from source moved to
  `docs/developers/build-from-source.md`.
- The npm package ships its own README (`packages/cli/README.md`), written for the registry page.
- The Quickstart, the overview, the troubleshooting page and the uninstall page install from npm
  instead of a clone.

## [0.1.0] - 2026-09-27

The first release of o1-code, a coding agent for the terminal.

### Terminal interface

- A layout with a header (logo and shortcuts), the conversation, and an input and footer fixed at
  the bottom. The footer shows the approval mode, model and reasoning level, the git branch and
  diff, context use, turn tokens and turn time, and the request status.
- Adapts to the terminal width, down to under 80 columns, and falls back to plain symbols where the
  terminal cannot draw them. One cursor at the insertion point, Windows included.
- Tool calls, approvals, lists, dialogs, the start screen, provider retries and errors share one
  design. Queued messages show inside the conversation.
- Dark and light themes, a pixel logo, and an icon: the "O1" symbol at small sizes and "O1" over
  "CODE" from 48 px up. The logo animates once on the start screen (eight animations,
  `ui.logoAnimation` picks one, `random` by default, `off` disables).
- The interface follows the system language: English, Portuguese, Chinese, Traditional Chinese,
  German, French, Japanese, Russian and Catalan.

### Connect a provider

- Four entries: OrganizaOne, API key (one alphabetical list: Alibaba Cloud, Anthropic, DeepSeek,
  Google Gemini, Kimi, MiniMax, ModelScope, OpenAI, xAI, Z.AI), Local (Ollama and LM Studio
  detected on their ports, or another local server) and Custom (any URL, OpenAI-compatible or
  Anthropic). The Web Shell offers the same.
- API keys live in `~/.o1-code/credentials/`, one file per provider, never in `settings.json`;
  `o1-code auth logout <provider-id>` forgets a saved key.
- The API key is checked with the provider before moving on. A refused key stays on its step with
  the reason; pressing enter again on it moves on anyway, for keys that can chat but cannot list
  models.
- The models step lists what the provider serves (Gemini included), with search, checkboxes and a
  field for other IDs; ctrl+r asks again when the list cannot be read and keeps what was chosen.

### Agent

- Reads and edits files, runs commands, searches the web, and asks for approval according to the
  approval mode.
- Skills, hooks, MCP servers, subagents, extensions and custom commands. Installs extensions from
  Claude Code, Gemini, Qoder, Codex and Grok Build plugins and their marketplaces.
- `/commit` turns the working tree into one commit per logical change, in the repository's own
  message style, and asks before each commit; it never pushes. `/finish` closes a change: build,
  lint, scoped tests, a docs check and the version step when the project declares one; it reports
  what ran and what did not, and hands over to `/commit`.
- Goals stop repeating a failed fix (a rethink after the second failure, a new strategy on the
  fourth, then a block report with options and one closed question), commit per verifiable slice
  and never push unless allowed, name a scope change instead of absorbing it, and an approved plan
  can be run as a Goal from the plan dialog.
- The system prompt carries eight working-discipline rules: stop and rethink after a second failed
  fix, search every reference form on a rename, check references before deleting, watch long
  operations, sub-agent hygiene, edit with the editing tools, leave shared stateful resources
  alone, and scope test runs to the change.
- `o1-code -p` runs one prompt headless, for scripts and CI.
- `o1-code serve` runs a local daemon with a REST API and the Web Shell, a browser interface.
- Editor companions for VS Code and Zed.

[Unreleased]: https://github.com/organizaone/o1-code/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/organizaone/o1-code/releases/tag/v0.1.0
