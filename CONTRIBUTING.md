# Contributing to RacePlans (pfitzPlans)

Thank you for your interest in contributing to RacePlans! We want to make it as easy as possible to contribute changes, features, and new training plans.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or newer recommended)
- `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/obrienjoey/pfitzPlans.git
   cd pfitzPlans
   ```

2. Install dependencies:
   ```bash
   cd app
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

## Development Guidelines

### Code Quality Gates

Before submitting a Pull Request, please verify your changes pass the quality checks:

1. **Linting**: Run the linter to ensure style compliance:
   ```bash
   npm run lint
   ```

2. **TypeScript**: Perform a compile-time type check:
   ```bash
   npx tsc -b
   ```

3. **Testing**: Run unit and component tests:
   ```bash
   npm run test
   ```

### Adding New Plans

All training plans are defined as YAML files under `app/public/plans/`.

1. Create your new plan file matching the schema in `app/src/data/plan-schema.json`.
2. Add your plan to the list in `app/src/config.ts`.
3. Verify your plan loads and parses correctly by running the application.

## Pull Request Process

1. Create a branch for your feature or fix (e.g. `feature/my-new-plan` or `fix/pace-bug`).
2. Make your changes and write tests if applicable.
3. Verify all checks pass locally.
4. Push your branch to GitHub and open a Pull Request using the provided PR template.
