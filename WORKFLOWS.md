# Monorepo Workflows Guide

This guide covers the common development workflows for the Bookera Extension Hub monorepo powered by Turborepo.

## 📋 Available Commands

### Core Development Commands

```bash
# Start development servers for all apps
bun run dev

# Build all packages and apps
bun run build

# Run tests across all packages
bun run test

# Lint and fix issues
bun run lint

# Type-check all TypeScript
bun run type-check

# Format code with Prettier
bun run format

# Run all quality checks
bun run check-all
```

### Package Management

```bash
# Install dependencies
bun install

# Clean build artifacts
bun run clean

# Update dependencies
bun update
```

## 🚀 Common Workflows

### 1. Starting Development

```bash
# Clone and setup
git clone <repo-url>
cd bookera-extension-hub
bun install

# Start development
bun run dev
```

**What happens:**

- Installs all dependencies using Bun workspaces
- Starts development servers for all apps in parallel
- Enables hot reloading across the monorepo

### 2. Making Changes

```bash
# Create a feature branch
git checkout -b feature/my-feature

# Make your changes...

# Run quality checks
bun run check-all

# Commit changes
git add .
git commit -m "feat: add new feature"
```

**What `check-all` does:**

- Builds all packages to catch build errors
- Runs all tests to ensure nothing is broken
- Lints code and fixes auto-fixable issues
- Type-checks all TypeScript code

### 3. Working on Specific Packages

```bash
# Work on just the UI app
cd apps/ui
turbo build --filter=@serranolabs.io/bookera-ui

# Test a specific module
turbo test --filter=@serranolabs.io/bookera-themes

# Lint shared package
turbo lint --filter=@serranolabs.io/shared
```

### 4. Building for Production

```bash
# Build everything optimized for production
bun run build

# Build specific apps only
turbo build --filter=@serranolabs.io/bookera-ui --filter=@serranolabs.io/editor-backend
```

### 5. Running Tests

```bash
# Run all tests
bun run test

# Run tests with coverage
turbo test --filter="*" -- --coverage

# Run tests for changed packages only
turbo test --filter=[HEAD^1]
```

### Package Development Workflow

When developing a new package:

```bash
# 1. Create package directory
mkdir packages/my-new-package
cd packages/my-new-package

# 2. Initialize package.json
cat > package.json << EOF
{
  "name": "@serranolabs.io/my-new-package",
  "version": "0.0.1",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "test": "vitest",
    "type-check": "tsc --noEmit"
  }
}
EOF

# 3. Add to workspace (automatically detected)
# 4. Install dependencies
bun install

# 5. Start developing
turbo dev --filter=@serranolabs.io/my-new-package
```

### Dependency Management

```bash
# Add dependency to specific package
bun add lodash --filter=@serranolabs.io/shared

# Add dev dependency
bun add -D @types/lodash --filter=@serranolabs.io/shared

# Update specific dependency across workspace
bun update typescript

# Remove dependency
bun remove lodash --filter=@serranolabs.io/shared
```

## 🔧 Performance Optimizations

### Caching Strategies

```bash
# Check what would be cached
turbo build --dry

# Force rebuild (ignore cache)
turbo build --force

# See cache statistics
turbo build --summarize
```

### Parallel Execution

```bash
# Run multiple tasks in parallel
turbo build test lint type-check

# Limit concurrency for resource-constrained environments
turbo build --concurrency=2
```

## 🐛 Troubleshooting

### Cache Issues

```bash
# Clear local cache
rm -rf .turbo

# Check cache status
turbo build --dry-run

```

### Build Issues

```bash
# Clean and rebuild
bun run clean
bun install
bun run build

# Check specific package
turbo build --filter=@serranolabs.io/problematic-package --verbose
```

### Dependency Issues

```bash
# Check workspace dependencies
bun list --all

# Reinstall all dependencies
rm -rf node_modules bun.lockb
bun install
```

## 📊 Monitoring Performance

### Build Analysis

```bash
# Generate build summary
turbo build --summarize > build-summary.json

# Time builds
time bun run build

# Profile specific tasks
turbo build --profile=build-profile.json
```

### Cache Hit Rates

Monitor your cache effectiveness:

- Local cache hits indicate good development workflow
- Remote cache hits show team collaboration benefits
- Cache misses might indicate configuration issues

## 🔄 CI/CD Integration

For continuous integration:

```bash
# Install dependencies
bun install --frozen-lockfile

# Run all checks
bun run check-all

# Build for production
bun run build
```

## 📝 Best Practices

1. **Always run `check-all` before committing**
2. **Use filters to work on specific packages**
3. **Leverage caching for faster iterations**
4. **Keep dependencies in the packages that use them**
5. **Use conventional commit messages**
6. **Set up remote caching for team collaboration**
