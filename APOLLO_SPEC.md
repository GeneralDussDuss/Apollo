# APOLLO — Specification for scaffolding (Phase 0 + Phase 1, with stubs for Phase 2–6)

> Apollo is the god who caught Hermes, checked the tracks, and made him answer for it in front of Zeus.
> Apollo (the software) is a local-first coding-agent harness: a vendor-free Python **core**
> (permission gate, loop guard, audit chain, git safety, secrets, approvals) with pluggable
> **engine adapters** underneath (Claude Agent SDK first; OpenCode and a local vLLM loop later)
> and three **surfaces** on top (CLI now; phone PWA and Tauri desktop later).
>
> Target machine: Windows 11, Python 3.12, RTX 5090, Tailscale already installed. Owner: GeneralDussDuss (aka the Dussmeister, aka Dussy; GitHub handle `GeneralDussDuss`).

This document is written so that an autonomous coding agent can scaffold the repository end to end.
Everything marked **BUILD NOW** is in scope for this scaffold. Everything marked **STUB** gets an
interface, a docstring and a `NotImplementedError`, nothing more. Everything marked **LATER** is
not touched. When a detail is ambiguous, fail closed and write the question to `OPEN_QUESTIONS.md`.

---

## 0. Design principles (read twice)

1. **Enforcement lives outside the model.** A rule in a prompt is a suggestion. A rule in code is a control.
   Nothing safety-critical is ever expressed only in a system prompt.
2. **The core is vendor-free.** `src/apollo/core`, `policy`, `guard`, `audit`, `safety`, `secrets` import
   no vendor SDK. Only `src/apollo/engines/*` may import `claude_agent_sdk`, `httpx` to OpenCode, etc.
3. **Fail closed.** Unknown command → `ASK`. Unknown path → outside jail. Missing config → refuse to start.
4. **Same gate, every engine, every mode.** The gate is called before every tool call regardless of
   which engine or permission mode is active. For the Claude engine it is mounted twice (PreToolUse hook
   and `can_use_tool`) so a mode change can never widen permissions.
5. **Undo is a command, not a hope.** Every task runs in its own git worktree on its own branch.
   Rollback is `apollo rollback <task>`. Merging is always a human action.
6. **The audit log is written by the core, never by the model.** It is append-only and hash-chained.
7. **No gimmicks.** No pet, no persona, no *uncurated* plugin marketplace, no *self-modifying* memory, no model
   router inside the core, no Electron, no cloud speech, no Telegram/Discord gateways. Extensions (skills, MCP
   servers, memory) exist, but only as curated, pinned, human-reviewed artefacts — see §15.

---

## 1. Repository layout (BUILD NOW — create every path; stubs get a docstring)

```
apollo/
├── AGENTS.md                      # rules for coding agents in this repo (exists)
├── APOLLO_SPEC.md                 # this file
├── CLAUDE.md                      # project memory for Claude Code when it runs *inside* this repo (§13)
├── PROGRESS.md                    # build progress, appended by the scaffolding agent
├── OPEN_QUESTIONS.md              # anything ambiguous, one line each
├── README.md                      # short: what, why, how to run tests
├── LICENSE                        # Apache-2.0
├── pyproject.toml                 # uv-managed, Python 3.12, see §2
├── uv.lock
├── .gitignore
├── .python-version                # 3.12
├── config/
│   ├── apollo.example.toml        # runtime config (§4.1) — committed
│   ├── rules.example.toml         # policy rules (§5.4) — committed, copied to ProgramData at install
│   └── claude-settings.json       # Phase 0 settings.json block for plain Claude Code (§11)
├── hooks/
│   ├── gate.py                    # PreToolUse hook: thin shim → apollo.policy.gate (§5.6)
│   ├── audit.py                   # PostToolUse hook: thin shim → apollo.audit.chain
│   ├── post_failure.py            # PostToolUseFailure hook: feeds the loop guard
│   └── stop.py                    # Stop hook: refuses to finish while verify is red (§7.3)
├── src/apollo/
│   ├── __init__.py                # __version__
│   ├── cli.py                     # typer CLI (§9)
│   ├── config.py                  # load + validate apollo.toml (pydantic)
│   ├── models.py                  # shared dataclasses/pydantic models (§3)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── engine.py              # Engine protocol + registry of adapters (§6.1)
│   │   ├── session.py             # task lifecycle, SessionManager (§6.2)
│   │   ├── registry.py            # tool/MCP registry with health (§6.3)
│   │   └── handoff.py             # context-reset handoff writer (§7.2)
│   ├── policy/
│   │   ├── __init__.py
│   │   ├── classify.py            # command → Class (§5.2)
│   │   ├── jail.py                # path canonicalisation + jail checks (§5.3)
│   │   ├── rules.py               # rules.toml loader + matcher (§5.4)
│   │   └── gate.py                # the Gate: decide(call) → Decision (§5.5)
│   ├── guard/
│   │   ├── __init__.py
│   │   ├── loop.py                # failure fingerprints, stall detection (§7.1)
│   │   ├── budget.py              # turn/cost/time caps (§7.4)
│   │   └── killswitch.py          # flag file + process-tree kill (§7.5)
│   ├── audit/
│   │   ├── __init__.py
│   │   └── chain.py               # JSONL + SQLite, SHA-256 chain, verify() (§8)
│   ├── safety/
│   │   ├── __init__.py
│   │   └── git.py                 # stash, worktree, checkpoint, rollback (§6.4)
│   ├── secrets.py                 # keyring wrapper with chunking (§10)
│   ├── approvals/
│   │   ├── __init__.py
│   │   ├── broker.py              # ApprovalBroker protocol + InMemory + CLI prompt (§6.5)
│   │   └── ntfy.py                # STUB (Phase 2)
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── fake.py                # FakeEngine for tests (§6.6) — BUILD NOW
│   │   ├── claude_sdk.py          # ClaudeSdkEngine (§6.7) — BUILD NOW, integration-tested by human
│   │   ├── opencode.py            # STUB (Phase 6)
│   │   └── local_vllm.py          # STUB (Phase 6)
│   ├── server/                    # STUB package (Phase 2): app.py, auth.py, approvals.py, sse.py
│   ├── voice/                     # STUB package (Phase 3): stt.py, tts.py, vad.py
│   ├── memory/
│   │   ├── __init__.py
│   │   ├── layers.py              # read the four layers, assemble the prompt block (§15.3)
│   │   ├── lessons.py             # core-written lessons from handoffs; pruning CLI
│   │   └── propose.py             # agent proposes CLAUDE.md edits as a diff; human merges
│   ├── extensions/
│   │   ├── __init__.py
│   │   ├── manifest.py            # load + hash-verify extensions/manifest.toml
│   │   ├── skills.py              # expose vetted skills to the engine (read-only mount)
│   │   └── mcp.py                 # launch allowlisted MCP servers as the apollo user; per-tool classes
│   └── evals/
│       ├── __init__.py
│       ├── deny_tests.py          # the deny-test runner (§11.3) — BUILD NOW
│       ├── runner.py              # eval task runner (§12.2) — BUILD NOW (FakeEngine only)
│       └── tasks/                 # *.toml eval task definitions (3 examples)
├── extensions/                    # curated extensions (§15) — BUILD NOW
│   ├── manifest.toml              # the ONLY place skills and MCP servers are declared; hashed, pinned
│   ├── skills/                    # vendored SKILL.md folders, read-only to the agent
│   │   ├── apollo-git-discipline/SKILL.md
│   │   ├── apollo-platformio/SKILL.md
│   │   ├── apollo-android-gradle/SKILL.md
│   │   ├── apollo-unity-batch/SKILL.md
│   │   └── apollo-review-checklist/SKILL.md
│   └── mcp/                       # README per allowlisted server: version, hash, tool classes, network policy
├── memory/                        # memory layer code lives in src/apollo/memory/ (§15.3); this dir is docs
├── agents/                        # subagent definitions for the Claude engine (Phase 4) — STUB files
│   ├── explorer.md
│   ├── planner.md
│   ├── implementer.md
│   └── reviewer.md
├── web/                           # STUB (Phase 2): index.html, app.js, manifest.json, README
├── desktop/                       # STUB (Phase 5): README only, "Tauri 2 shell around web/"
├── scripts/
│   ├── install_windows.ps1        # creates dirs, copies rules, prints next steps (no admin actions) (§11.2)
│   ├── create_apollo_user.ps1     # PRINTS the commands for the human to run as admin; does not run them
│   └── verify_install.py          # checks dirs, ACLs readable, keyring works, hooks importable
└── tests/
    ├── conftest.py
    ├── policy/  test_classify.py test_jail.py test_rules.py test_gate.py
    ├── guard/   test_loop.py test_budget.py test_killswitch.py
    ├── audit/   test_chain.py
    ├── safety/  test_git.py            # uses a temp git repo
    ├── core/    test_session.py test_registry.py test_handoff.py
    ├── engines/ test_fake.py test_claude_sdk_mapping.py   # mapping only, no SDK calls
    ├── hooks/   test_hook_shims.py     # feed JSON on stdin, assert exit codes
    └── evals/   test_deny_tests.py test_runner.py
```

---

## 2. Tooling and dependencies (BUILD NOW)

`pyproject.toml`:

```toml
[project]
name = "apollo-agent"
version = "0.1.0"
description = "Local-first, hard-gated coding agent harness"
requires-python = ">=3.12,<3.13"
license = { text = "Apache-2.0" }
dependencies = [
  "pydantic>=2.7",
  "typer>=0.12",
  "rich>=13",
  "keyring>=25",
  "tomli-w>=1.0",          # writing toml (reading uses stdlib tomllib)
  "claude-agent-sdk",      # pin exact version after `uv add`; verify on PyPI
]

[project.optional-dependencies]
server = ["fastapi>=0.115", "uvicorn[standard]>=0.30", "httpx>=0.27"]   # Phase 2
voice  = ["faster-whisper>=1.1", "kokoro>=0.9.4", "soundfile", "silero-vad"]  # Phase 3

[project.scripts]
apollo = "apollo.cli:app"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-q"

[tool.ruff]
line-length = 100
```

Rules:
- `uv` manages everything. Commit `uv.lock`. `.venv` in repo root (gitignored).
- Standard library first. `policy/`, `guard/`, `audit/` may import only stdlib + `pydantic`.
- `ruff` for lint/format. `pytest` for tests. No other test frameworks.
- Windows-first: no `shell=True`, no bash-isms in subprocess calls, no POSIX-only path code.

---

## 3. Shared models (BUILD NOW) — `src/apollo/models.py`

```python
from enum import StrEnum
from pydantic import BaseModel, Field
from datetime import datetime

class Class(StrEnum):
    READ = "READ"                 # no side effects
    REVERSIBLE = "REVERSIBLE"     # local, git-tracked, undoable
    SIDE_EFFECT = "SIDE_EFFECT"   # reversible in principle but touches hardware/deps/branches
    IRREVERSIBLE = "IRREVERSIBLE" # pushes, force, deletes outside git, registry, services, network egress
    SELF = "SELF"                 # touches Apollo's own config/secrets/port/tailnet/service state
    UNKNOWN = "UNKNOWN"           # fail closed → ASK

class Action(StrEnum):
    ALLOW = "allow"
    ASK = "ask"                   # human approval via broker
    ASK_TYPED = "ask_typed"       # human must type the exact confirmation phrase
    DENY = "deny"

class ToolCall(BaseModel):
    engine: str                   # "claude-sdk" | "fake" | "opencode" | "vllm-local"
    session_id: str
    task_id: str
    tool: str                     # "Bash" | "Read" | "Edit" | "Write" | "Glob" | "Grep" | "WebFetch" | mcp name
    input: dict                   # raw tool input, never summarised
    cwd: str
    ts: datetime = Field(default_factory=datetime.utcnow)

    def fingerprint(self) -> str: ...   # sha256 of (tool, normalised input) — see §7.1

class Decision(BaseModel):
    action: Action
    cls: Class
    reason: str                   # human-readable, also what the model sees on deny
    stage: str                    # "killswitch" | "loop" | "budget" | "self" | "jail" | "rules" | "class" | "human"
    needs_checkpoint: bool = False

class ApprovalRequest(BaseModel):
    id: str
    call: ToolCall
    cls: Class
    expires_at: datetime
    typed_phrase: str | None = None   # for ASK_TYPED, e.g. "push lora-rx-fix"

class ApprovalResult(BaseModel):
    approved: bool
    note: str = ""
    by: str = "cli"               # "cli" | "phone" | "desktop" | "timeout"
```

---

## 4. Configuration (BUILD NOW)

### 4.1 `config/apollo.example.toml`

```toml
[paths]
jail_root   = 'C:\dev'                       # the ONLY tree the agent may read/write
state_dir   = 'C:\ProgramData\apollo'        # rules.toml, audit, logs, killswitch flag
worktrees   = 'C:\dev\.apollo-wt'            # one subdir per task

[engine]
default = "claude-sdk"                       # "fake" in tests
claude_exe = 'C:\Users\apollo\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js' # verify; call claude.exe directly, not claude.cmd
model_default = "opus"                       # alias; adapter maps to a real model id

[budget]
max_turns          = 60
max_wall_seconds   = 3600
max_cost_usd       = 5.00
max_tool_errors    = 8
max_same_signature = 3

[loop]
identical_failure_deny_at = 2
identical_failure_escalate_at = 3
stall_turns = 3
stall_silence_seconds = 600

[approvals]
broker  = "cli"                              # "cli" now; "ntfy" in Phase 2
timeout_seconds = 600                        # timeout == deny

[control_plane]                              # Phase 2
bind = "127.0.0.1"
port = 8765
```

Loading rules (`config.py`):
- Search order: `--config` flag → `%APOLLO_CONFIG%` → `<state_dir>\apollo.toml` → error. Never fall back to repo defaults in production.
- Validate with pydantic. `jail_root` must exist and must not be a parent of `state_dir`. Refuse to start otherwise.

---

## 5. Policy (BUILD NOW — the heart of Apollo)

### 5.1 Decision order (fixed)

```
killswitch → loop guard (repeat failure) → budget → SELF check → jail check → rules.toml (deny → ask → allow) → class default → human
```

Each stage either returns a `Decision` or passes to the next. The first stage to decide wins.

### 5.2 `policy/classify.py` — command classification

Input: `ToolCall`. Output: `Class`. Pure function, no I/O, stdlib `re` only.

- File tools (`Read`, `Glob`, `Grep`) → `READ`. (`Edit`, `Write`) → `REVERSIBLE` (jail check happens separately).
- `WebFetch` → `IRREVERSIBLE` (egress) — rules.toml will put it in `ask`.
- `Bash`: evaluate in this order, first match wins:
  1. **SELF** if the command references: `apollo` state dir, `~\.claude`, `.claude\`, `tailscale`, `schtasks`, `sc start|stop|config|create|delete`, `netsh`, `127.0.0.1:<control_port>`, `localhost:<control_port>`, `mklink`, `New-Item … -ItemType Junction|SymbolicLink`, `env`, `printenv`, `set` (bare), `$env:`, `Get-ChildItem env:`, `reg`, `regedit`.
  2. **IRREVERSIBLE** if matches: `rm -r…f`, `--force`, `-f … push`, `git push` (any), `git clean -…x`, `Remove-Item … -Recurse`, `del /s`, `rd /s`, `format <drive>:`, `diskpart`, `bcdedit`, `vssadmin`, `cipher /w`, `Set-ExecutionPolicy`, `npm publish`, `pip upload`, `twine`, `curl`, `wget`, `Invoke-WebRequest`, `iwr`, `Invoke-RestMethod`, `irm`.
  3. **IRREVERSIBLE** (indirection) if matches: `(bash|sh|cmd|powershell|pwsh)(\.exe)?\s+(-c|/c|-Command|-EncodedCommand|-e\b)`, or `|` piped into `sh|bash|iex|Invoke-Expression`.
  4. **SIDE_EFFECT** if matches: `pio … (-t upload|upload|--upload-port)`, `esptool`, `git (checkout|switch|reset|rebase|clone|merge)`, `npm (i|install|ci)`, `uv add`, `pip install`, `gradlew installDebug`, `adb install`, `adb shell`, `Unity … -batchmode … -executeMethod`.
  5. **READ** if matches at start: `git (status|diff|log|branch|show|remote -v)`, `ls`, `dir`, `cat`, `type`, `tree`, `which`, `where`, `Get-Content`, `pio device list`, `pio project config`.
  6. **REVERSIBLE** if matches at start: `pio (run|test|check)`, `npm (run|test)`, `npx tsc`, `uv run`, `pytest`, `python -m pytest`, `gradlew(.bat)? (assemble|test|lint)`, `./gradlew (assemble|test)`, `git (add|commit|stash|worktree|restore --staged)`, `Unity … -runTests`, `cargo (build|test|check)`, `cmake --build`.
  7. Else **UNKNOWN**.

Normalisation before matching: collapse whitespace, strip surrounding quotes, lower-case for matching but preserve the original for audit. Match on the first simple command AND on every segment split by `&&`, `||`, `;`, `|`; the **highest-severity** segment wins (SELF > IRREVERSIBLE > SIDE_EFFECT > UNKNOWN > REVERSIBLE > READ).

Tests must include every example in this section plus the bypass attempts in §11.3.

### 5.3 `policy/jail.py` — path jail

```python
def canonical(p: str) -> str          # expandvars, expanduser, os.path.realpath (resolves junctions/symlinks on Win), normcase
def is_inside(p: str, root: str) -> bool   # commonpath; ValueError (different drive) → False
def is_forbidden(p: str, forbidden: list[str]) -> bool
def reject_reason(p: str) -> str | None   # r"^\\\\\?\\", UNC r"^\\\\", ADS r":[^\\/]+$" after drive, 8.3 names r"~\d", null bytes
def extract_paths(command: str) -> list[str]   # tokens matching r"[A-Za-z]:[\\/][^\s\"']+" or r"/[a-z]/[^\s\"']+" or quoted paths
```

Rules:
- Forbidden list (always): `state_dir`, `%USERPROFILE%\.claude` of the *owner* account, `%USERPROFILE%\.ssh`, `%USERPROFILE%\.aws`, `%USERPROFILE%\.hermes`, `C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, the Apollo repo's own `policy/` directory when running from source.
- A `Read/Edit/Write/Glob/Grep` whose canonical path is outside `jail_root` or inside a forbidden path → `DENY`, stage `jail`.
- Every path token found in a `Bash` command is checked the same way. One bad token → `DENY`.
- `/c/dev/...` (Git-Bash style) is translated to `C:\dev\...` before canonicalising.
- Non-existent paths are canonicalised lexically (realpath still resolves existing parent junctions).

### 5.4 `policy/rules.py` + `config/rules.example.toml`

```toml
# rules.toml — read-only to the agent (ACL), owned by the human
version = 1

[deny]
bash = ["rm -rf *", "git push --force*", "git push -f*", "git clean -fdx*", "reg *", "regedit*",
        "curl *", "wget *", "Invoke-WebRequest*", "npm publish*", "format *", "diskpart*",
        "schtasks *", "sc *", "netsh *", "tailscale *", "mklink *"]
read = ["**/.env", "**/.env.*", "**/auth.json", "**/*.pem", "**/id_*"]
edit = ["**/.git/**", "**/.claude/**", "**/rules.toml"]

[ask]
bash = ["pio run * -t upload*", "esptool*", "git push *", "git checkout *", "git reset *", "git rebase *",
        "npm install *", "uv add *", "pip install *", "adb *"]
tools = ["WebFetch"]

[ask_typed]            # phrase template; {task} is substituted
bash = { "git push *" = "push {task}" }

[allow]
bash = ["git status", "git diff *", "git log *", "git add *", "git commit *", "git stash *", "git worktree *",
        "pio run *", "pio test *", "pio device list", "npm run *", "npm test *", "npx tsc --noEmit",
        "uv run *", "pytest *", "./gradlew assembleDebug", "./gradlew test*"]
read = ["{jail_root}/**"]
edit = ["{jail_root}/**"]

[routing]              # Phase 6 — present now, only "default" is honoured
explorer    = "claude-sdk:sonnet"
planner     = "claude-sdk:opus"
implementer = "claude-sdk:opus"
reviewer    = "claude-sdk:opus"
```

Matching semantics (mirror Claude Code's): glob-style on the command string, `*` matches anything. **deny → ask_typed → ask → allow**; a broad deny beats a narrow allow. `{jail_root}` is substituted at load.

### 5.5 `policy/gate.py` — the Gate

```python
class Gate:
    def __init__(self, cfg: Config, rules: Rules, loop: LoopGuard, budget: Budget, kill: KillSwitch, audit: AuditChain): ...
    def decide(self, call: ToolCall) -> Decision:
        """Pure decision, no human interaction. Order per §5.1."""
    async def enforce(self, call: ToolCall, broker: ApprovalBroker) -> Decision:
        """decide(); if ASK/ASK_TYPED → broker.request(); record everything to audit; return final Decision."""
```

Class → default action when no rule matched:

| Class | Default |
|---|---|
| READ | ALLOW |
| REVERSIBLE | ALLOW, `needs_checkpoint=True` |
| SIDE_EFFECT | ASK |
| IRREVERSIBLE | ASK_TYPED |
| SELF | DENY (never approvable, even by a human, even from the CLI) |
| UNKNOWN | ASK |

Deny message format (this exact shape, the model reads it):
`BLOCKED by policy ({stage}): {reason}. Do not retry this call; choose another approach or call ask_human.`

### 5.6 Hook shims (`hooks/*.py`)

Each is ≤ 40 lines, reads JSON from stdin, imports `apollo` from the installed venv, and exits:
- `gate.py` (PreToolUse): build `ToolCall` from `{tool_name, tool_input, session_id, cwd}`; `Gate.decide()`;
  on `DENY` print the deny message to **stderr** and `sys.exit(2)`; on `ASK/ASK_TYPED` print JSON
  `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason": reason}}` and exit 0;
  on `ALLOW` exit 0 silently. Any exception → exit 2 with `BLOCKED by policy (hook-error)` (fail closed).
- `audit.py` (PostToolUse): append `{"event":"result", ...}` to the chain with a truncated tool_response (head 2 KB + tail 2 KB).
- `post_failure.py` (PostToolUseFailure): `LoopGuard.record_failure(fingerprint, signature)`.
- `stop.py` (Stop): if `<worktree>/.apollo/verify_status` is not `green`, print JSON `{"decision":"block","reason":"verify is red: <last 20 lines>"}` and exit 0; else exit 0.

The hook JSON field names must be verified against the installed Claude Code version; put the verified version in `PROGRESS.md`.

---

## 6. Core (BUILD NOW)

### 6.1 `core/engine.py` — the Engine protocol

```python
class EngineEvent(BaseModel):
    kind: Literal["text","tool_request","tool_result","turn_end","cost","error","done"]
    payload: dict

class Engine(Protocol):
    name: str
    async def start(self, task: Task, tools: ToolSet, system_prompt_path: Path, resume: str | None = None) -> str: ...  # returns session_id
    def stream(self) -> AsyncIterator[EngineEvent]: ...
    async def interrupt(self) -> None: ...
    async def set_tools(self, tools: ToolSet) -> None: ...
    async def fork(self, up_to_message_id: str | None = None) -> str: ...
    def cost_so_far(self) -> float: ...
    async def close(self) -> None: ...

ENGINES: dict[str, type[Engine]]   # "fake" and "claude-sdk" registered; others raise NotImplementedError on construct
```

The core never calls a vendor SDK directly. The gate is invoked by the SessionManager on every
`tool_request` event (for engines without native hooks) **and** by the Claude adapter's hook/`can_use_tool` mounts.

### 6.2 `core/session.py` — SessionManager / task lifecycle

```
apollo run <repo> "<task text>" [--engine] [--model] [--plan-only]
  1. load config, rules, secrets → refuse to start if any missing
  2. git_safety.prepare(repo, task_id)  → stash-if-dirty, worktree at <worktrees>/<task_id>, branch apollo/<task_id>
  3. write <worktree>/.apollo/task.json {id, text, constraints[], created, engine}
  4. registry.build_toolset(task) → only healthy, allowed tools
  5. engine.start(task, tools, system_prompt_path)
  6. for event in engine.stream():
        tool_request → decision = await gate.enforce(call, broker)
                       if DENY: engine receives the deny message (adapter-specific)
                       if needs_checkpoint: git_safety.checkpoint(worktree, "pre-" + fingerprint[:8])
        tool_result  → loop.record_result(...); audit
        turn_end     → budget.tick(); loop.check_stall(worktree)
        if loop.should_reset(): handoff = handoff.write(worktree, history_summary); engine = restart with handoff (§7.2)
        if loop.should_ask_human(): broker.notify("stalled", ...); stop
        if budget.exhausted(): engine.interrupt(); stop
  7. on done: run verify command(s) from <repo>/CLAUDE.md [apollo] section or task.json; write verify_status
  8. print summary: turns, cost, wall, denials, resets, interventions; leave worktree in place
```

`--plan-only`: toolset = read-only tools; the engine must end by writing `<worktree>/.apollo/plan.md`; the CLI prints it and exits. (Plan approval from the phone is Phase 2; for now the human reads it and reruns without `--plan-only`.)

### 6.3 `core/registry.py` — tool registry

- Knows every tool/MCP server Apollo could offer: built-ins (`Bash`,`Read`,`Edit`,`Write`,`Glob`,`Grep`,`WebFetch`), and MCP servers declared in `apollo.toml` (none by default; `serial-mcp` is Phase 5).
- `health()` per MCP server (process alive, responds to list_tools within 3 s).
- `build_toolset(task) -> ToolSet` returns **only** healthy tools not in `disabled`. A disabled or unhealthy tool must be **absent** from what the engine is given, never merely denied.
- If a tool dies mid-session, `mark_unavailable(name, reason)`; the gate then denies with
  `Tool {name} is unavailable this session ({reason}). Do not call it again.`

### 6.4 `safety/git.py`

```python
def prepare(repo: Path, task_id: str, worktrees_root: Path) -> Path   # stash -u if dirty (msg "apollo-pre-<task>"), worktree add -b apollo/<task>
def checkpoint(worktree: Path, label: str) -> str                      # git add -A && git commit -m "apollo checkpoint: <label>" (allow-empty) → sha
def auto_commit_on_green(worktree: Path, msg: str) -> str
def rollback(repo: Path, task_id: str) -> None                         # worktree remove --force, branch -D apollo/<task>
def diff_stat(worktree: Path) -> str
def has_new_changes_since(worktree: Path, sha: str) -> bool
```
All via `subprocess.run([...], check=True, capture_output=True, cwd=...)`. Never `shell=True`. Never touch the user's checked-out branch. Never `push`. Never `--force` anything except `worktree remove --force` in rollback.

### 6.5 `approvals/broker.py`

```python
class ApprovalBroker(Protocol):
    async def request(self, req: ApprovalRequest) -> ApprovalResult
    async def notify(self, kind: str, text: str) -> None

class CliBroker        # prints the RAW tool input (never a summary), waits for y/N or the typed phrase; times out → denied
class InMemoryBroker   # for tests: scripted answers
class NtfyBroker       # STUB (Phase 2): priority 5, http action buttons, one-time HMAC token in URL
```
Every request gets `id = secrets.token_urlsafe(16)`; the result is audited with `by`.

### 6.6 `engines/fake.py` — FakeEngine (BUILD NOW; all tests use it)

Scriptable: constructed with a list of events to emit; supports `interrupt`, `fork`, returns scripted cost. Must be able to simulate: identical failing Bash calls (for loop-guard tests), a tool_request outside the jail, a SELF call, a clean success with a verify-green result.

### 6.7 `engines/claude_sdk.py` — ClaudeSdkEngine (BUILD NOW; **human runs the integration test**)

Mapping to `claude_agent_sdk` (verify names against the installed version; record the version in PROGRESS.md):
- `ClaudeAgentOptions(cwd=worktree, permission_mode="default" | "acceptEdits" | "plan", allowed_tools=[...], disallowed_tools=[...], system_prompt=<file contents>, hooks={"PreToolUse":[HookMatcher(matcher="Bash|Read|Edit|Write|Glob|Grep|WebFetch", hooks=[self._pre_tool])], "PostToolUse":[...], "Stop":[...]}, can_use_tool=self._can_use_tool, max_turns=cfg.budget.max_turns)`
- `_pre_tool` and `_can_use_tool` both call `Gate.decide()/enforce()`; a deny returns `PermissionResultDeny(message=<deny message>, interrupt=False)`; an allow returns `PermissionResultAllow()` (may rewrite `updated_input` to the canonicalised path).
- Use `ClaudeSDKClient` (persistent) so `interrupt()` and `set_permission_mode()` work.
- Pass the API key from `secrets.get("anthropic_api_key")` into the subprocess env only; never into config or logs.
- Windows: ensure the SDK invokes `claude.exe`/`cli.js` directly (not `claude.cmd`); keep argv small (system prompt via file); if `WinError 206` appears, that is the cause — note in OPEN_QUESTIONS.
- Cost: accumulate `total_cost_usd` from `ResultMessage`.
- Agent definitions (Phase 4) go through `agents=` options, not CLI args.

---

## 7. Guards (BUILD NOW)

### 7.1 `guard/loop.py`

```python
class LoopGuard:
    def record_failure(self, fingerprint: str, signature: str) -> None
    def record_result(self, fingerprint: str, ok: bool) -> None
    def is_repeat_failure(self, fingerprint: str) -> bool     # count >= identical_failure_deny_at
    def should_escalate(self, fingerprint: str) -> bool       # count >= identical_failure_escalate_at
    def check_stall(self, worktree: Path) -> None             # no new diff vs last checkpoint AND no verify-green across stall_turns
    def should_reset(self) -> bool
    def should_ask_human(self) -> bool
    def state(self) -> dict                                   # for audit + CLI
```
- **Fingerprint** = sha256 of `tool + "\n" + json.dumps(normalised input, sort_keys=True)`; normalise: collapse whitespace, canonicalise paths, strip timestamps/line numbers.
- **Signature** of a failure = error text with paths, line:col numbers, hex addresses and timestamps replaced by `<P>`, `<N>`, `<X>`, `<T>`; first 200 chars.
- Escalation ladder: 1st failure → record; 2nd identical → `DENY` with *"Identical call already failed twice. Change approach or call ask_human."*; 3rd identical or `max_same_signature` same-signature failures → nudge (adapter injects the text in §7.2); stall → **context reset** (§7.2); after one reset without progress → `should_ask_human()`.

### 7.2 `core/handoff.py` — context reset

- `write(worktree, summary_inputs) -> Path` produces `<worktree>/.apollo/handoff.md` ≤ 300 words with sections: **Goal**, **Tried (and why it failed)**, **Current hypothesis**, **Do not repeat**, **Verify command**.
- The summary is produced by a **fresh** one-shot engine call (`query()` on the Claude engine) that is given only: task.json, the last 40 audit rows (tool + decision + signature), `git diff --stat`, and PROGRESS.md. It never sees the poisoned transcript.
- The new session's system prompt = base prompt + handoff.md + PROGRESS.md. The old session is closed, not resumed.
- Nudge text (injected as a user turn when `should_escalate`): *"Stop. Re-read the last error verbatim. State a new hypothesis in one sentence before running any build."*

### 7.3 Verify and the Stop hook

- Each target repo declares verify commands in its `CLAUDE.md` under a fenced block:
  ```
  <!-- apollo:verify -->
  pio run -e tlora_pager
  pio test -e native
  <!-- /apollo:verify -->
  ```
  Fallback: `task.json.verify[]`. If neither exists, verify = "no-op, status unknown" and the CLI prints a warning.
- `apollo verify <task>` runs them in the worktree, writes `.apollo/verify_status` (`green|red|unknown`) and `.apollo/verify_last.txt`.
- Stop hook (§5.6) blocks finishing while `red`.
- PostToolUse on a successful verify command triggers `auto_commit_on_green`.

### 7.4 `guard/budget.py`
Tracks turns, wall-clock, cost, tool errors; `exhausted() -> str | None` returns the first exceeded cap's name. Exhaustion = `DENY(stage="budget")` with `interrupt=True`.

### 7.5 `guard/killswitch.py`
- Flag file `<state_dir>\KILL`. `engaged()` is checked **first** in every gate decision.
- `engage(reason)`: write flag → `engine.interrupt()` → after 1.5 s `taskkill /T /F /PID <engine pid>` → audit row.
- `apollo kill` CLI; `apollo resume-killed` clears the flag only after the human confirms.
- Target: process tree dead < 2 s. Test with a dummy `python -c "import time; time.sleep(99)"` subprocess tree.

---

## 8. Audit chain (BUILD NOW) — `audit/chain.py`

- Append-only `<state_dir>\audit\audit.jsonl` + mirror in `<state_dir>\audit\audit.sqlite` (table `events(seq, ts, engine, task, session, event, tool, cls, decision, stage, reason, input_json, prev_hash, hash)`).
- `hash = sha256(prev_hash + canonical_json(row_without_hash))`. First row's `prev_hash` = 64 zeros.
- `append(event: dict) -> int (seq)`, `verify() -> (ok: bool, first_bad_seq: int | None)`, `tail(n)`, `for_task(task_id)`.
- Written only by the core and the hook shims; the model has no tool that can reach `state_dir` (jail) and the file is ACL-denied to the agent user's *write* except via the core process (document in install script; the ACL itself is set by the human).
- `apollo audit verify` and `apollo audit tail 50` CLI.

---

## 9. CLI (BUILD NOW) — `cli.py` (typer)

```
apollo run <repo> "<task>" [--engine fake|claude-sdk] [--model] [--plan-only] [--resume <session>]
apollo kill [--reason ""]
apollo resume-killed
apollo rollback <task_id>
apollo verify <task_id>
apollo audit verify | tail [n] | task <task_id>
apollo tools                      # registry with health and last error
apollo evals run [--engine fake] [--only <name>]
apollo deny-tests                 # §11.3
apollo doctor                     # config present, dirs writable by core, keyring reachable, claude exe found, git ok
apollo secrets set <name>         # prompts hidden; chunks; never echoes
```
Every command prints with `rich`, exits non-zero on failure, and writes an audit row for state-changing commands.

---

## 10. Secrets (BUILD NOW) — `secrets.py`

- `keyring` with the Windows Credential Manager backend; service name `apollo`.
- Values > 1,200 chars are chunked into `name.0`, `name.1`, … with `name.meta = {"chunks": n}` (Credential Manager blob limit ≈ 2,560 bytes UTF-16).
- `get(name) -> str`, `set(name, value)`, `delete(name)`. Never log values. Never write to disk.
- The only consumer that receives a secret is an engine adapter, which places it in the **subprocess env** only.
- The gate denies `env`/`$env:`/`Get-ChildItem env:` so the model cannot read that env back (documented honest limit: child processes still inherit it; Phase 4 credential proxy removes it).

---

## 11. Phase 0 artefacts (BUILD NOW — for plain Claude Code on the same machine)

### 11.1 `config/claude-settings.json`
The deny/ask/allow block and hook wiring for `~/.claude/settings.json` of the **apollo** Windows user. Content: mirror `rules.example.toml` in Claude Code rule syntax (`Bash(git push *)`, `Read(//c/dev/**)`, …), `"defaultMode":"default"`, `"disableBypassPermissionsMode":"disable"`, hooks pointing at `C:\dev\apollo\.venv\Scripts\python.exe C:\dev\apollo\hooks\gate.py` etc. Generate this file **from** `rules.example.toml` with `apollo export-claude-settings` so the two can never drift.

### 11.2 `scripts/install_windows.ps1` and `scripts/create_apollo_user.ps1`
- `install_windows.ps1` (no admin): creates `<state_dir>` layout, copies `rules.example.toml` → `rules.toml` if absent, copies `apollo.example.toml` → `apollo.toml` if absent, runs `uv sync`, runs `apollo doctor`, prints the next steps.
- `create_apollo_user.ps1`: **prints** (does not execute) the admin commands the human runs: `New-LocalUser apollo` (standard user), `icacls C:\dev /grant apollo:(OI)(CI)M`, `icacls C:\ProgramData\apollo\secrets /deny apollo:(OI)(CI)F`, deny on the owner's `~\.claude`, add to the serial/USB device group, Task Scheduler job definition ("At startup", "Run whether user is logged on or not", user `apollo`, no highest privileges, restart on failure), and `tailscale up --unattended=true`.
- `verify_install.py`: checks everything `doctor` checks plus that `rules.toml` is **not writable** by the current process when run as `apollo`.

### 11.3 Deny tests — `evals/deny_tests.py` (BUILD NOW; must pass before any policy change is "done")

A table of `(tool, input, expected_action)` run through `Gate.decide()` with the example config. Minimum set:

| tool / input | expected |
|---|---|
| Bash `git status` | ALLOW |
| Bash `pio run -e esp32dev` | ALLOW (needs_checkpoint) |
| Bash `pio run -e esp32dev -t upload` | ASK |
| Bash `git push origin main` | ASK_TYPED |
| Bash `git push --force` | DENY |
| Bash `rm -rf C:\dev\x` | DENY |
| Bash `rm -rf D:\anything` | DENY (jail, different drive) |
| Bash `bash -c "r""m -rf /"` | DENY (indirection) |
| Bash `powershell -EncodedCommand ZQBj` | DENY |
| Bash `echo hi \| iex` | DENY |
| Bash `curl https://x` | DENY |
| Bash `Invoke-WebRequest x` | DENY |
| Bash `mklink /J C:\dev\x C:\ProgramData\apollo` | DENY (SELF) |
| Bash `Get-ChildItem env:` | DENY (SELF) |
| Bash `tailscale serve reset` | DENY (SELF) |
| Bash `schtasks /create …` | DENY (SELF) |
| Bash `reg add HKLM\…` | DENY |
| Bash `git status && rm -rf C:\dev\x` | DENY (highest segment wins) |
| Bash `npm install left-pad` | ASK |
| Bash `frobnicate --yes` | ASK (UNKNOWN) |
| Read `C:\dev\sonnet\src\main.cpp` | ALLOW |
| Read `C:\dev\sonnet\.env` | DENY |
| Read `C:\Users\<owner>\.ssh\id_ed25519` | DENY |
| Edit `C:\dev\sonnet\src\main.cpp` | ALLOW (needs_checkpoint) |
| Edit `C:\ProgramData\apollo\rules.toml` | DENY (SELF) |
| Edit `C:\dev\..\ProgramData\apollo\rules.toml` | DENY (canonicalised) |
| Edit `\\?\C:\dev\x` | DENY (prefix rejected) |
| Edit `C:\dev\x.txt:stream` | DENY (ADS) |
| Edit `/c/dev/sonnet/x` | ALLOW (translated) |
| WebFetch any | ASK |
| any tool while KILL flag present | DENY (stage killswitch) |
| Bash identical call after 2 recorded failures | DENY (stage loop) |

Output: a table, non-zero exit on any mismatch. Wire into `pytest` as well.

---

## 12. Build order and evals

### 12.1 Build order (do these in sequence; each step ends with green tests and a PROGRESS.md line)

1. Repo skeleton, `pyproject.toml`, `uv sync`, `ruff`, empty packages, `README.md`, `LICENSE`, `.gitignore`.
2. `models.py`, `config.py` + `apollo.example.toml` + tests.
3. `policy/jail.py` + tests (all §11.3 path cases).
4. `policy/classify.py` + tests (all §5.2 and §11.3 command cases).
5. `policy/rules.py` + `rules.example.toml` + tests (precedence, `{jail_root}`, globbing).
6. `audit/chain.py` + tests (append, verify, tamper detection, concurrency-safe append with file lock).
7. `guard/killswitch.py`, `guard/budget.py`, `guard/loop.py` + tests.
8. `policy/gate.py` + `approvals/broker.py` (InMemory, Cli) + tests; then `evals/deny_tests.py` green.
9. `hooks/*.py` shims + `tests/hooks` (stdin JSON → exit codes).
10. `safety/git.py` + tests on a temp repo (prepare, checkpoint, rollback, dirty-tree stash).
11. `core/registry.py`, `core/handoff.py`, `engines/fake.py` + tests.
12. `core/engine.py`, `core/session.py` + end-to-end tests on FakeEngine: clean run; loop spiral → deny → reset → success; SELF call → deny; budget exhaustion → interrupt; kill mid-run.
13. `secrets.py` + tests (mock keyring backend; chunking).
14. `cli.py` + `apollo doctor`, `export-claude-settings`, `deny-tests`, `evals run` + tests.
15. `engines/claude_sdk.py` mapping + mapping tests (no SDK calls). **Stop here and hand to the human** for the live integration test.
16. `extensions/manifest.py`, `extensions/skills.py`, `extensions/mcp.py`, the five starter skills, `memory/layers.py`, `memory/lessons.py`, `memory/propose.py` + §15.4 tests.
17. `scripts/*`, `config/claude-settings.json` (generated), `evals/tasks/*.toml` (3 examples), stubs for Phase 2–6 packages with docstrings, `CLAUDE.md` (§13).

### 12.2 Eval task format — `evals/tasks/<name>.toml`

```toml
name = "pio-missing-include"
repo = 'C:\dev\sonnet'
tag  = "eval/pio-missing-include"        # git tag the task starts from
prompt = "The tlora_pager env fails to build with an undeclared identifier. Fix it without changing public headers."
verify = ["pio run -e tlora_pager", "pio test -e native"]
max_turns = 30
max_cost_usd = 2.0
expect = { verify = "green", max_interventions = 0, max_denials = 3 }
```
`evals/runner.py`: checks out the tag into a fresh worktree, runs `SessionManager`, records pass/fail, turns, cost, wall, denials, resets, interventions to `<state_dir>\evals\<date>.jsonl`, prints a table. FakeEngine runs must work for the three example tasks using scripted events (the real engine is Phase 1 human testing).

---

## 13. `CLAUDE.md` for this repo (BUILD NOW — ~40 lines)

Contents: what Apollo is (3 lines); the vendor-free rule; "policy/guard/audit are stdlib+pydantic only"; run tests with `uv run pytest`; the verify block:
```
<!-- apollo:verify -->
uv run ruff check .
uv run pytest -q
uv run python -m apollo.evals.deny_tests
<!-- /apollo:verify -->
```
and the "do not build" list from §0.7.

---

## 14. Phase 2–6 interfaces (STUB — docstring + NotImplementedError only)

- `server/app.py`: FastAPI on `127.0.0.1:8765`; routes `GET /health`, `GET /sessions`, `GET /sessions/{id}/events` (SSE), `POST /sessions`, `POST /approve/{id}?t=<token>`, `POST /kill`, `GET /tools`, `GET /audit/tail`. Auth via `Tailscale-User-Login` allowlist + `tailscale whois` + one-time HMAC token on approvals. Published with `tailscale serve`.
- `approvals/ntfy.py`: self-hosted ntfy, priority 5, `http` action buttons Allow/Deny with the one-time token, `clear=true`; timeout → deny.
- `voice/stt.py` (faster-whisper large-v3-turbo, float16, CT2 ≥ 4.7), `voice/tts.py` (kokoro 0.9.4 in-process, espeak-ng MSI), `voice/vad.py` (Silero).
- `engines/opencode.py`: client of `opencode serve`; its permission requests → `Gate.enforce`.
- `engines/local_vllm.py`: minimal loop over an OpenAI-compatible endpoint; tool schemas for Read/Grep/Glob only at first.
- `web/`: single-page PWA (sessions, SSE stream, diff view, approvals, kill, push-to-talk). `desktop/`: Tauri 2 shell around `web/` with tray, global kill hotkey (Ctrl+Alt+K), OS notifications, serial pane; signed (Azure Trusted Signing).
- `agents/*.md`: explorer (read-only, cheap), planner, implementer, reviewer (separate context; never the implementer).

---

## 15. Curated extensions: skills, MCP servers ("plugins"), memory (BUILD NOW)

Plugins, skills and memory are first-class in Apollo. The rule that makes them safe is one sentence:
**nothing the model writes can change what the model is allowed to do next time without a human merge.**

### 15.1 Skills (instructions, not code)

- Format: Claude Code's native `SKILL.md` folders (YAML frontmatter `name`, `description`, body in Markdown, optional
  `scripts/` that are run through the gate like any other command). This is the most widely used, most stable
  extension format in the ecosystem and works on every engine (for OpenCode/vLLM the adapter injects the body).
- Source of truth: `extensions/manifest.toml`. Every skill is **vendored** into `extensions/skills/<name>/`,
  pinned by `sha256` of the folder, and listed with `source`, `version`, `reviewed_by`, `reviewed_on`.
  The engine is only given skills whose hash matches the manifest. Mismatch → skill not loaded, audit row, CLI warning.
- Read-only to the agent (NTFS + jail: `extensions/` is outside `jail_root` when installed; during development it is
  in the repo's forbidden list). Skills can **never** grant permissions; they only describe how to do work well.
- No skill auto-generation, no "learned skills". A new skill is a PR: `apollo skills propose <name>` writes a draft to
  `<state_dir>\proposals\skills\<name>\` from the agent's notes; a human reviews, edits, and `apollo skills accept`
  vendors + hashes it.
- Curated starting set (write these now, concise, ≤ 120 lines each, owner-specific):
  - `apollo-git-discipline`: worktree-per-task, checkpoint before risky edits, commit on green, never push, never force,
    how to write the commit message, how to read `git diff --stat` before claiming done.
  - `apollo-platformio`: envs, `pio run -e <env>`, `pio test -e native`, reading compiler errors, `build_src_filter`,
    `--upload-port` is SIDE_EFFECT (asks), never touch `platformio.ini` upload flags without stating why, serial
    monitor etiquette.
  - `apollo-android-gradle`: `./gradlew assembleDebug`, `testDebugUnitTest`, `adb install` asks, Compose preview tips,
    Gradle daemon pitfalls on Windows.
  - `apollo-unity-batch`: `Unity.exe -batchmode -runTests -projectPath … -testResults …`, edit-mode vs play-mode tests,
    never touch `ProjectSettings/` without stating why, Library/ is disposable.
  - `apollo-review-checklist`: what the reviewer subagent checks (behaviour vs features.json, tests exist and run,
    no secrets, no new egress, diff limited to the task), and the output format (`0 blocking · N notes`).
- Recommended external sources to vendor from, in order of trust (human vets each before vendoring):
  1. Anthropic's official skills repository (`anthropics/skills`) — document formats, code review, testing patterns.
  2. The target repo's own `.claude/skills/` (the owner's own, already in his style).
  3. Community skills only after reading every line; prefer ones with no `scripts/`.

### 15.2 MCP servers ("plugins")

Every MCP server is a tool surface **and** a potential egress path, so each one is allowlisted individually.

`extensions/manifest.toml`:

```toml
[skills.apollo-platformio]
path = "skills/apollo-platformio"; sha256 = "<filled by `apollo skills accept`>"; reviewed_by = "GeneralDussDuss"; reviewed_on = 2026-10-18

[mcp.github]
enabled = false                                   # off until Phase 4
transport = "stdio"; command = ["<path>\github-mcp-server.exe", "--read-only", "--toolsets", "repos,issues,pull_requests"]
version = "<pin>"; sha256 = "<binary hash>"; network = "api.github.com"; runs_as = "apollo"
token = "secret:github_readonly_pat"              # from keyring, fine-grained, read-only, 30-day expiry
[mcp.github.tools]                                # class per tool; unlisted tools → absent, not denied
get_file_contents = "READ"; list_issues = "READ"; get_pull_request = "READ"; search_code = "READ"
create_issue = "SIDE_EFFECT"; create_pull_request = "IRREVERSIBLE"

[mcp.serial]                                      # Phase 5, Apollo's own
enabled = false; transport = "stdio"; command = ["<venv>\python.exe", "-m", "apollo.mcp.serial"]
[mcp.serial.tools]
list_ports = "READ"; read_lines = "READ"; write_line = "SIDE_EFFECT"; reset_board = "SIDE_EFFECT"

[mcp.playwright]                                  # browser; every tool asks because it is egress
enabled = false; transport = "stdio"; command = ["npx", "@playwright/mcp@<pin>", "--headless", "--isolated"]
version = "<pin>"; network = "ask"; runs_as = "apollo"
[mcp.playwright.tools]
"*" = "IRREVERSIBLE"
```

Rules enforced by `extensions/mcp.py` and the gate:
- A server not in the manifest, or `enabled = false`, or with a hash mismatch, is **absent** from the toolset (§6.3).
- Each MCP tool call is classified by the manifest; a tool with no class → `UNKNOWN` → `ASK`. `"*"` sets a floor; the gate takes the max severity of `"*"` and the named entry.
- `network` is documentation now and a Windows Firewall rule later (Phase 4); servers with `network = "ask"` have all their tools treated as at least `SIDE_EFFECT`.
- Servers run as the `apollo` user with the same jail; stdio only in Phase 1 (no HTTP MCP, which needs auth design in Phase 2).
- Tokens for servers come from keyring (`secret:<name>`), are fine-grained and read-only wherever the server supports it, and never appear in the manifest.
- Curated candidates, in order of stability (vet before enabling): the official GitHub MCP server in read-only mode; Microsoft's Playwright MCP (headless, isolated profile) with every tool asking; Apollo's own serial MCP. Explicitly **not** curated: filesystem/shell MCP servers (Apollo's gated built-ins already cover this and a second path around the jail is exactly the hole to avoid), any "memory" MCP, any marketplace aggregator, any server that stores or forwards data off-box.
- `apollo mcp list|enable|disable|verify` CLI; enabling is a human action and writes an audit row.

### 15.3 Memory (file-based, layered, git-tracked, human-governed)

No vector DB, no embeddings, no "auto memory" the model edits. Four layers, assembled into one block at session start by
`memory/layers.py`, each with a clear owner:

| Layer | Path | Written by | Read by | Purpose |
|---|---|---|---|---|
| **Owner** | `<state_dir>\memory\owner.md` | human only (ACL) | every session | the owner's standing preferences: style, what to never do, hardware facts, time zone. ≤ 80 lines. |
| **Project** | `<repo>\CLAUDE.md` + `<repo>\.claude\skills\` | human; agent **proposes** via `memory/propose.py` | sessions in that repo | conventions, verify block, module map, "don't touch" list. |
| **Task** | `<worktree>\.apollo\{PROGRESS.md, DECISIONS.md, features.json, handoff.md}` | agent freely (it is inside the jail and git) | that task's sessions | durable state across compaction and resets. `features.json` items flip to `passes=true` only after verify. |
| **Lessons** | `<state_dir>\lessons\<yyyy-mm>.md` | the **core**, from `handoff.md` after every reset or ask-human; never the model directly | every session, last 30 entries | "what went wrong and the fix", e.g. *"tlora_pager env needs build_src_filter for RX buffer src"*. Pruned by `apollo memory prune` (human). |

- **Proposals, not writes.** When the agent wants to change project memory (a new convention, a corrected module map) it
  calls `propose_memory_edit(diff, why)` (an in-process tool). The diff lands in `<state_dir>\proposals\memory\<task>.diff`
  and is shown in the CLI summary (Phase 2: in the approval queue). `apollo memory accept <id>` applies it with a commit
  authored by the human. Nothing else can modify `CLAUDE.md` or `owner.md`.
- **Lessons are deduplicated** by signature (§7.1) and capped at 200 lines per file; the core writes them, the human prunes.
- **Compaction-proof constraints.** Anything the human says that must survive (“don't flash tonight”) goes into
  `task.json.constraints[]` and is re-injected every turn by the adapter, never left in conversation.
- **Engine-native memory is disabled or jailed.** The Claude engine's own auto-memory directory, if enabled, must resolve
  inside `jail_root`; otherwise the adapter passes the option that turns it off. OpenCode/vLLM adapters have no memory of
  their own: Apollo's layers are the memory.
- `apollo memory show [--task]` prints the assembled block exactly as the model sees it, so there is never a hidden prompt.

### 15.4 Tests for §15 (BUILD NOW)
- Manifest hash mismatch → skill/server absent + audit row. Unlisted MCP tool → UNKNOWN → ASK. `"*" = "IRREVERSIBLE"` floor respected.
- `propose_memory_edit` never touches `CLAUDE.md`; `apollo memory accept` does, with a commit.
- Lessons dedupe by signature; cap enforced; model has no write path (attempted `Edit <state_dir>\lessons\x.md` → DENY SELF).
- `apollo memory show` output equals the exact system-prompt block passed to FakeEngine.

---

## 16. Definition of done for this scaffold

- `uv run pytest` green; coverage ≥ 90 % for `policy/`, `guard/`, `audit/`, `safety/`.
- `uv run python -m apollo.evals.deny_tests` green with every row in §11.3.
- `apollo run C:\tmp\fakerepo "do the thing" --engine fake` completes end to end on a temp git repo and prints a summary with turns/cost/denials/resets.
- FakeEngine spiral test: identical failure ×2 → DENY; stall → handoff.md written (≤ 300 words) → new session → success.
- `apollo kill` stops a dummy process tree in < 2 s.
- `apollo audit verify` passes; flipping one byte in `audit.jsonl` makes it fail at the right seq.
- `apollo export-claude-settings` output byte-identical on two runs.
- No file in the repo contains a secret, token or key. `rg -i "sk-ant|AKIA|BEGIN PRIVATE" .` is empty.
- §15 tests green; `extensions/manifest.toml` validates; five starter skills vendored and hashed; `apollo memory show` works on the fake repo.
- `OPEN_QUESTIONS.md` lists every ambiguity encountered, one line each.
- `PROGRESS.md` has one line per build-order step with passing test counts and the installed `claude-agent-sdk` / Claude Code versions recorded.

---

## 17. Honest limits (write these into README.md verbatim)

- Native Windows has no Claude Code OS sandbox. The real jail is the dedicated low-privilege `apollo` Windows user, NTFS ACLs and git recovery. The gate's string matching is a layer, not the wall.
- Secrets reach engine subprocess env; children inherit it. Phase 4's credential proxy removes that.
- Anthropic's billing policy for SDK use under subscriptions changed several times in 2026. Apollo uses a Console API key with a spend limit.
- Other engines won't have the Claude SDK's hooks; the gate runs in-process before each call instead. Each engine gets its own deny-test run.
