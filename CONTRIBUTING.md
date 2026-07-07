# Contributing to Wouaff

Thank you for your interest in contributing! Here's how you can help.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/your-username/wouaff/issues)
2. If not, open a new issue with:
   - A clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, browser, version)

### Suggesting Features

Open an issue with the label `enhancement` describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Pull Requests

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run the linter: `cd client && npx tsc --noEmit`
5. Commit with a descriptive message
6. Push and open a Pull Request

#### PR Guidelines

- Keep PRs focused on a single concern
- Update documentation if needed
- Add tests when possible
- Follow existing code style (TypeScript strict mode)
- Ensure the build passes: `cd client && npm run build`

## Development Setup

See [README.md](README.md#getting-started) for setup instructions.

## Project Structure

- `client/` — React frontend (Vite + TypeScript)
- `server/` — Express backend (TypeScript)
- `server/src/migrations/` — SQL migrations (run automatically on server start)

## Commit Conventions

We use conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `refactor:` — Code change without feature/fix
- `docs:` — Documentation
- `chore:` — Maintenance
- `security:` — Security fix
