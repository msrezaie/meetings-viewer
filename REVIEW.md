# Review log

Each entry records only the context, decision, rationale, tradeoff, and follow-up needed to understand a change later.

## Instructions for future entries

- Review only the requested component and its immediate consumers unless a branch-wide review is explicitly requested.
- Compare the final implementation with the requested comparison branch; treat intermediate commits and commit messages as development history, not review scope.
- Summarize decisions, not every changed line or routine diff.
- Use this order: scope, context, decision, rationale, ownership boundary, tradeoff, follow-up, and verification.
- Mention only the shared constants, direct callers, and dependencies needed to explain the decision.
- Organize headings from parent context to child context using the repository tree; group related reviews instead of keeping one flat list.
- Within each context, keep entries in the order their final decisions were reviewed, without using intermediate commit history as the ordering system.
- End with a clear verdict and one or two actionable follow-ups when needed.
- Keep each entry short enough to scale across a large branch.
