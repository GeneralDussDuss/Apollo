<p align="center">
  <a href="https://generaldussduss.github.io/Apollo/"><img src="https://img.shields.io/badge/%E2%98%89-APOLLO-d4a84b?style=for-the-badge&labelColor=070608" alt="Apollo"></a>
</p>

<h1 align="center">Apollo</h1>
<p align="center"><b>An AI that can finish your project and can't wreck your computer.</b></p>
<p align="center">
  <a href="https://generaldussduss.github.io/Apollo/">🌐 Read the story at generaldussduss.github.io/Apollo</a>
</p>
<p align="center">
  <a href="https://github.com/GeneralDussDuss/Apollo/stargazers"><img src="https://img.shields.io/github/stars/GeneralDussDuss/apollo?style=flat&color=d4a84b&labelColor=070608" alt="Stars"></a>
  <a href="https://github.com/GeneralDussDuss/Apollo/releases"><img src="https://img.shields.io/github/v/release/GeneralDussDuss/apollo?include_prereleases&style=flat&color=2ecc8f&labelColor=070608" alt="Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-bfb3a0?style=flat&labelColor=070608" alt="License"></a>
</p>

---

> In the myth, Hermes stole Apollo's cattle and walked them backwards so the tracks pointed the wrong way.
> Apollo tracked him down anyway and made him answer for it. We were running an agent called Hermes.
> It did Hermes things. So we built the god who checks the tracks.

**Apollo** is a local-first coding-agent harness. A vendor-free Python core (permission gate, loop guard,
hash-chained audit log, git worktree safety, phone approvals, local voice) with swappable engines underneath:
the Claude Agent SDK first, then OpenCode and a local vLLM loop so nobody needs a particular subscription to run it.

**The one idea:** a rule in a prompt is a suggestion. A rule in code is a wall.

👉 **Start here:** [the landing page](https://generaldussduss.github.io/Apollo/) explains it in plain English, with the same bug run two ways side by side.

**This repo is the showcase.** The code lives elsewhere until it's ready, and it'll land here as releases, not as a trickle of commits. Watch → Releases and you'll know the moment it does.

## Status

🟢 **Stage 1 · the walls** — permission gate, sandbox folder, loop catcher, logbook, kill switch. Being built right now.

| Stage | What | State |
|---|---|---|
| 0 | Lock down plain Claude Code with deny rules + a PreToolUse hook | ✅ |
| 1 | Core + Claude adapter (gate, loop guard, audit chain, git safety, secrets, CLI) | 🔨 in progress |
| 2 | Phone approvals over Tailscale (FastAPI + ntfy + PWA) | ⏳ |
| 3 | Local voice (faster-whisper + Kokoro) | ⏳ |
| 4 | Subagents, nightly evals, hardening | ⏳ |
| 5 | Desktop app (Tauri 2, signed) | ⏳ |
| 6 | Engines: OpenCode + local vLLM, role routing | ⏳ |

## Stay updated

- ⭐ **Star this repo** — it's the vote, and it's what makes GitHub show Apollo to more people.
- 👁 **Watch → Custom → Releases** — a notification only when a real version ships. Zero noise.
- 💬 **[Discussions](https://github.com/GeneralDussDuss/Apollo/discussions)** — questions, which AI brain to plug in next, show what you built.
- 📡 **RSS:** `https://github.com/GeneralDussDuss/Apollo/releases.atom`

## Honest limits

- Native Windows has no Claude Code OS sandbox. The real jail is a dedicated low-privilege Windows user, NTFS ACLs and git recovery. String matching is a layer, not the wall.
- Secrets reach the engine subprocess environment; Phase 4's credential proxy removes that.
- Other engines won't have the Claude SDK's hooks; the gate runs in-process before each call instead, with its own deny-test run.

## License

Apache-2.0 — see [LICENSE](LICENSE).
