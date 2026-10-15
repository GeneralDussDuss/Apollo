# AGENTS.md — rules for any coding agent working in this repo

You are scaffolding **Apollo**, a local-first, hard-gated coding agent harness.
The full specification is in `APOLLO_SPEC.md`. Read it completely before writing a file.

## Non-negotiables for the agent working in this repo

1. **Stay inside this repository.** Never read, write or run anything outside the repo root.
   Never touch `~/.claude`, `%APPDATA%`, `C:\ProgramData`, the registry, services, firewall,
   Tailscale, scheduled tasks, or any file under another user's profile.
2. **Never create, store or print secrets.** No API keys, tokens or passwords in any file,
   test fixture, log line or commit message. Use placeholders like `<APOLLO_API_KEY>`.
3. **Never run the harness against a real engine during scaffolding.** All tests use the
   `FakeEngine` adapter. Do not install or invoke `claude`, `opencode` or `vllm`.
4. **No network calls** except package installation via `uv`.
5. **Policy code is reviewed by a human line by line.** Files under `src/apollo/policy/`,
   `src/apollo/guard/`, `src/apollo/audit/` and `hooks/` must be small, boring, dependency-free
   (standard library + `pydantic` only) and fully covered by tests. Mark every PR touching them
   with `[POLICY]` in the title.
6. **Fail closed.** When unsure how to classify a command or path, the answer is `ASK`, never `ALLOW`.
7. **Build in the order the spec gives.** Do not start Phase 2+ code except the interfaces the spec
   marks as "stub now".
8. **Every deliverable has a test.** `uv run pytest` must pass before you report a step done.
   `uv run python -m apollo.evals.deny_tests` must pass before any step in `policy/` is done.
9. **Windows is the target.** Paths, subprocess handling and tests must work on Windows 11 with
   Python 3.12. Use `pathlib`, `os.path.realpath`, `subprocess` with lists (never `shell=True`).
10. **Do not add features that are not in the spec.** Skills, MCP servers and memory exist only in the
    curated, hash-pinned, human-reviewed form of §15 — no marketplaces, no auto-generated skills, no
    model-writable memory, no persona, no model routers. If something seems missing, write it into
    `OPEN_QUESTIONS.md` and move on.

## Commit discipline

- Conventional commits: `feat(policy): …`, `test(guard): …`, `chore(scaffold): …`.
- One logical change per commit. Run tests before each commit.
- Never force-push. Never rewrite history.

## Reporting

When you finish a step from `APOLLO_SPEC.md §12 Build order`, append a line to `PROGRESS.md`:
`- [x] Step N — <what> — tests: <count passing>`.
