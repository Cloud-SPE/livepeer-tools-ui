# PLANS.md

Index of execution plans. Active plans steer current work. Completed plans are kept for context — they're the "what shipped and why" log.

## Active

_(none)_

## Completed

| ID  | Title                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------- |
| 000 | [Phase 0 scaffold](exec-plans/completed/000-phase-0-scaffold.md)                                              |
| 001 | [Domain: orchestrators (reference template)](exec-plans/completed/001-domain-orchestrators.md)                |
| 002 | [Domain: governance](exec-plans/completed/002-domain-governance.md)                                           |
| 003 | [Domain: payouts](exec-plans/completed/003-domain-payouts.md)                                                 |
| 004 | [Domain: gateways](exec-plans/completed/004-domain-gateways.md)                                               |
| 005 | [Domain: rewards](exec-plans/completed/005-domain-rewards.md)                                                 |
| 006 | [Domain: tickets](exec-plans/completed/006-domain-tickets.md)                                                 |
| 007 | [Domain: network](exec-plans/completed/007-domain-network.md)                                                 |
| 008 | [Domain: performance (first multi-provider)](exec-plans/completed/008-domain-performance.md)                  |
| 009 | [Domain: ai-generator (shell + settings + capabilities)](exec-plans/completed/009-domain-ai-shell.md)         |
| 010 | [AI image inference (text-to-image, image-to-image, upscale)](exec-plans/completed/010-ai-image-inference.md) |
| 011 | [AI media inference (i2v, i2t, a2t, tts)](exec-plans/completed/011-ai-media-inference.md)                     |
| 012 | [AI LLM (streaming chat)](exec-plans/completed/012-ai-llm.md)                                                 |
| 013 | [AI BYOC OpenAI](exec-plans/completed/013-ai-byoc-openai.md)                                                  |
| 014 | [AI SAM-2 (Segment Anything 2)](exec-plans/completed/014-ai-sam2.md)                                          |
| 015 | [Full dependency migration to latest](exec-plans/completed/015-dependency-migration.md)                       |

## Conventions

- One plan per significant change. "Significant" = more than a couple of files, or any cross-domain refactor.
- Plans live as `NNN-<kebab-title>.md` under `exec-plans/active/`. When done, move (don't copy) to `exec-plans/completed/`.
- Each plan has: Intent, Acceptance criteria, Steps, Decisions log, Test plan.
- Trivial changes (typo fixes, small bug fixes, doc edits) do not need a plan.
