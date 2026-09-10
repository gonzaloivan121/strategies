# Contributing

Thanks for considering a contribution.

This repository is a TypeScript sandbox used for pattern experiments and iterative design changes. The goal is clarity and learning, not production hardening.

## Ground Rules

- Keep changes small and focused.
- Prefer readable code over clever code.
- Add or update tests for behavior changes.
- Avoid unrelated refactors in the same pull request.

## Development Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Build once:

```bash
npm run build
```

4. Run tests:

```bash
npm test
```

## Suggested Workflow

1. Create a branch from `main`.
2. Implement your change.
3. Run `npm run build` and `npm test`.
4. Open a pull request with a clear summary and rationale.

## Pull Request Checklist

- Describe what changed and why.
- Link related issues where relevant.
- Include tests for new or modified behavior.
- Note any intentional limitations or follow-up work.

## Scope Reminder

This project is under active development and can change quickly. Backward compatibility is not guaranteed at this stage.
