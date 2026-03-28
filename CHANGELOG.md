# Changelog

All notable changes to Meta_Kim are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.2.0] - 2026-03-28

### Changed
- Rename private `meta/` directory to `docs/` and update all path references across 15+ files
- Sync README.md, README.zh-CN.md, CLAUDE.md, AGENTS.md to current project state
- Remove all `factory/` references from documentation (directory no longer exists)
- Add `contracts/` to directory trees in README files
- Fix duplicate step numbering in README.zh-CN.md
- Remove hardcoded global capability counts from CLAUDE.md
- Add `.claude/capability-index/` to `.gitignore`
- Sanitize local Windows path in `docs/runtime-capability-matrix.md`

## [1.1.0] - 2026-03-27

### Added
- Agent versioning system with per-agent `version` field in YAML frontmatter
- Improved CLI output UX for health reports and validation

### Fixed
- Enforce single-source meta workflow validation
- Enforce live agent registry checks in OpenClaw prompts
- Harden meta runtime discovery and OpenClaw agent registry guidance

## [1.0.0] - 2026-03-22

### Added
- Public open-source release surface
- 8 flagship specialist agent profiles (meta-warden through meta-scout)
- Cross-runtime sync tooling (`sync:runtimes`, `validate`, `eval:agents`)
- Global capability discovery (`discover:global`)
- OpenClaw workspace family (8 workspaces with full SOUL.md, BOOT.md, etc.)
- Codex agent mirrors (`.codex/agents/*.toml`)
- Shared skills mirror layer (`shared-skills/`)
- Agent health report script (`scripts/agent-health-report.mjs`)
- MIT license

### Changed
- Collapse release docs into root READMEs
- Streamline foundry outputs for open source
- Finalize public release surface

## [0.5.0] - 2026-03-21

### Added
- Cross-runtime coverage audit (`docs/runtime-coverage-audit.md`)
- Runtime capability matrix (`docs/runtime-capability-matrix.md`)
- Repo map documentation (`docs/repo-map.md`)
- Portable runtime packs for Claude Code, OpenClaw, and Codex
- OpenClaw bootstrap and local auth assets
- Runtime evaluation scripts
- Chinese translations for runtime guides
- Paper reference and DOI (`10.5281/zenodo.18957649`)

### Fixed
- Bootstrap OpenClaw local auth for meta agents
- Harden cross-runtime agent and skill portability

## [0.1.0] - 2026-03-17

### Added
- Initial project structure as Claude Code project
- Convert skills to agents, merge SPEC into agent definitions
- Baseline snapshot of meta-kim architecture
