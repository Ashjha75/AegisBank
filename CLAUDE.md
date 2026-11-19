# CLAUDE.md

All project instructions live in AGENTS.md so every coding agent shares one source of truth:

@AGENTS.md

Claude Code specifics:

- Never call `EnterWorktree`, including in background sessions. Edit `dev_v1` directly in the main
  checkout. Background worktree isolation is switched off for this repo in `.claude/settings.json`
  (`"worktree": {"bgIsolation": "none"}`) - keep that setting.
