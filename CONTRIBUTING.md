# Contributing to Corto

Thanks for helping improve Corto. We welcome contributions to code, documentation, tests, and translations.

## The main rule: fork and keep PRs small

All contributions must start from a personal fork and arrive through a pull request to `main`. Do not open branches directly in the upstream repository.

Each PR must solve **one problem** and be easy to review. PRs that are too large, mix unrelated changes, or combine a broad refactor with a feature will be closed and must be split into smaller PRs.

## Workflow

1. Create a fork using the **Fork** button on GitHub.
2. Clone your fork and create a descriptive branch.

   ```bash
   git clone https://github.com/<your-username>/Corto.git
   cd Corto
   git checkout -b fix/short-description
   ```

3. Install dependencies and configure your local environment.

   ```bash
   cp .env.example .env
   bun install --frozen-lockfile
   ```

4. Make a focused change. Do not include unrelated formatting or cleanup.
5. Run the relevant checks before submitting the PR.

   ```bash
   bun run typecheck
   bun run --cwd apps/api test
   bun run build
   ```

6. Push the branch to your fork and open a pull request from `<your-username>:<branch>` to `logical-tech/Corto:main`.

## Pull requests

Use the title and description to clearly explain the problem and proposed change. State how you verified it and link the issue when there is one.

Before opening the PR, make sure it:

- contains one logical change;
- does not include generated files, secrets, or unrelated changes;
- has relevant tests, typecheck, and build checks passing;
- updates affected documentation and translations.

## AI-assisted code

Code written or assisted by AI is welcome. The PR author remains responsible for understanding, testing, and maintaining it: it must meet the same quality bar and, above all, stay in a small, focused PR.

## Questions and larger proposals

For significant new features or behavior changes, open an issue to discuss them first. This avoids wasted work and keeps pull requests reviewable.
