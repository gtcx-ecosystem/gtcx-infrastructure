# Agent Safety Rules

Critical rules for protecting the codebase and its collaborators.

## Prime Directive: Do No Harm

Before any action, verify:

1. Will this break existing functionality?
2. Am I deleting code someone else depends on?
3. Have I understood the full context?
4. Should I ask for clarification first?

**When in doubt, ask. Do not assume. Do not delete. Do not experiment in production.**

---

## Absolute Prohibitions

```yaml
NEVER:
  Code_Destruction:
    - DELETE files without explicit permission
    - REMOVE functions that might be used elsewhere
    - DROP database tables or columns
    - DELETE git branches (especially main/master/develop)
    - FORCE PUSH to shared branches

  Unauthorized_Changes:
    - Modify .env files with production credentials
    - Change CI/CD pipelines without approval
    - Alter security configurations
    - Update package versions without testing
    - Modify database migrations that have run

  Dangerous_Patterns:
    - Commit sensitive data (keys, passwords, tokens)
    - Use 'any' type in TypeScript without comment justification
    - Disable linting rules globally
    - Comment out tests instead of fixing them
    - Use console.log in production code

  Breaking_Conventions:
    - Create new patterns without documentation
    - Ignore established project structure
    - Mix tabs and spaces (follow .editorconfig)
    - Create files in wrong directories
    - Use different naming conventions
```

---

## Git Commit Discipline

### Commit message format

```bash
# Format
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Scope: component or module affected
# Description: imperative mood, lowercase, no period

# Good examples
feat(auth): add oauth2 integration with google
fix(transactions): resolve decimal precision error
docs(api): update endpoint documentation for v2
refactor(core): extract validation logic to shared module
test(payments): add edge case for negative amounts

# Bad examples
"Fixed stuff"
"WIP"
"made changes"
```

### Pre-commit checklist

```typescript
const preCommitChecklist = {
  tests: 'Do all tests pass?',
  linting: 'No linting errors?',
  build: 'Does the project build successfully?',
  sensitive: 'No sensitive data included?',
  scope: 'Is the change focused and atomic?',
  message: 'Is the commit message descriptive?',
};
```

### Branch management

```yaml
Branch_Rules:
  Protected_Branches:
    - NEVER commit directly to: main, master, production, develop
    - ALWAYS create feature branches
    - NEVER force push to shared branches
    - NEVER rebase published branches

  Naming_Convention:
    pattern: 'type/description-or-ticket'
    examples:
      - 'feat/user-authentication'
      - 'fix/transaction-decimal-bug'
      - 'chore/update-dependencies'
      - 'hotfix/critical-payment-issue'

  Lifecycle: 1. Create from latest develop/main
    2. Make focused changes
    3. Push regularly (backup)
    4. Create PR when ready
    5. Delete after merge
```

---

## Safe Development Practices

### Before modifying any file

```typescript
// ALWAYS follow this sequence:

// 1. Understand the context
'What does this file/function do?';
'Who else might be using it?';
'Are there tests I should check?';

// 2. Check for dependencies
'Search entire codebase for references';
'Check import statements';
'Look for dynamic calls';

// 3. Preserve existing functionality
'Can I extend instead of replace?';
'Should I deprecate instead of delete?';
'Can I make this backward compatible?';

// 4. Document your changes
'Add comments explaining WHY, not just what';
'Update related documentation';
'Note any breaking changes';
```

### The safe modification pattern

```typescript
// INSTEAD OF DELETING, follow this pattern:

// WRONG: Deleting potentially used code
// [DELETE ENTIRE FUNCTION]

// RIGHT: Deprecate first, delete later
/**
 * @deprecated Since version 2.1.0. Use newBetterFunction() instead.
 * Will be removed in version 3.0.0
 */
export function oldFunction() {
  console.warn('oldFunction is deprecated. Use newBetterFunction()');
  return newBetterFunction();
}

// WRONG: Changing function signature
function processData(amount) {
  /* new logic */
}

// RIGHT: Maintain compatibility
function processData(amount, options = {}) {
  if (typeof amount === 'object' && !options) {
    return processDataV2(amount);
  }
  return processDataLegacy(amount, options);
}
```

---

## Security Protocols

### Handling sensitive data

```yaml
NEVER_Commit:
  Files:
    - .env.local
    - .env.production
    - "*.key"
    - "*.pem"
    - "*.p12"
    - secrets.json
    - config/production.json

  Patterns:
    - API keys: "sk_live_*", "pk_live_*"
    - AWS credentials: "AKIA*"
    - Private keys: "-----BEGIN RSA PRIVATE KEY-----"
    - Passwords: "password:", "pwd:", "pass:"
    - Tokens: "token:", "auth:", "bearer:"

If_Accidentally_Committed:
  1. DO NOT try to delete and recommit
  2. IMMEDIATELY notify team
  3. Rotate the exposed credentials
  4. Use git-filter-branch or BFG Repo-Cleaner
  5. Force all team members to re-clone
```

### Safe secret management

```typescript
// WRONG: Hardcoded values
const API_KEY = 'sk_live_1234567890';
const DB_PASSWORD = 'mysecretpassword';

// RIGHT: Environment variables
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is required');
}
```

---

## Testing Discipline

### Never break the test suite

```typescript
// WRONG: Commenting out failing tests
// it('should process refunds', () => {
//   expect(processRefund()).toBe(true);
// });

// RIGHT: Fix or mark as skip with explanation
it.skip('should process refunds - TICKET-123: Waiting for API update', () => {
  expect(processRefund()).toBe(true);
});

// WRONG: Changing tests to match broken code
expect(calculateTax(100)).toBe(10); // Changed from 8.5

// RIGHT: Fix the code, not the test
```

### Test coverage rules

```yaml
Required_Tests:
  New_Features:
    - Unit tests for all public methods
    - Integration tests for API endpoints
    - Edge cases and error conditions

  Bug_Fixes:
    - Test that reproduces the bug
    - Test that verifies the fix
    - Related edge cases

  Refactoring:
    - All existing tests must still pass
    - No reduction in coverage percentage
    - Performance tests if optimization claimed
```

---

## Project Structure Discipline

### File naming conventions

```typescript
// Enforce consistent naming:
feature.module.ts; // Modules
feature.controller.ts; // Controllers
feature.service.ts; // Services
feature.repository.ts; // Repositories
feature.entity.ts; // Entities
feature.dto.ts; // Data Transfer Objects
feature.interface.ts; // Interfaces
feature.spec.ts; // Tests
feature.e2e - spec.ts; // E2E Tests

// WRONG:
FeatureModule.ts;
feature - module.ts;
feature_module.ts;

// RIGHT:
feature.module.ts;
```

---

## Database Safety

### Migration discipline

```typescript
// NEVER: Modify migrations that have run in production

// ALWAYS: Create new migrations for changes
export async function up(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('email').nullable(); // Start nullable
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('email');
  });
}
```

### Safe schema changes

```yaml
NEVER_Do_Directly:
  - DROP TABLE
  - DROP COLUMN
  - RENAME COLUMN (breaks queries)
  - Change column types (may lose data)
  - Add NOT NULL without default

ALWAYS_Safe_Pattern: 1. Add new column (nullable)
  2. Backfill data via script
  3. Add constraints in separate migration
  4. Update code to use new schema
  5. Deprecate old column
  6. Remove old column (after safe period)
```

---

## Deployment Safety

### Environment awareness

```typescript
if (process.env.NODE_ENV === 'production') {
  logger.warn('Running in PRODUCTION environment');

  // Disable dangerous operations
  config.allowDatabaseDrop = false;
  config.allowForceOverwrite = false;
  config.verboseLogging = false;
}

if (isProduction()) {
  // DON'T allow:
  // - Database resets
  // - Force synchronization
  // - Debug endpoints
  // - Test data generation
}
```

---

## Collaboration Rules

### Code review readiness

```yaml
Before_Creating_PR:
  Code_Quality:
    - All tests pass locally
    - No linting warnings
    - No console.logs (unless intentional)
    - No commented-out code
    - No TODO comments without ticket numbers

  Documentation:
    - README updated if needed
    - API docs updated for new endpoints
    - Complex logic has comments
    - Breaking changes noted

  PR_Description_Must_Include:
    - What: Clear description of changes
    - Why: Business/technical justification
    - How: Technical approach taken
    - Testing: How it was tested
    - Screenshots: For UI changes
    - Breaking: Any breaking changes
```

---

## Emergency Procedures

### If you break something

1. **Don't panic** — Don't make it worse
2. **Stop** — Don't try to fix without understanding
3. **Communicate** — Tell the team immediately
4. **Revert** — Git revert if necessary
5. **Learn** — Document what happened

### Recovery commands

```bash
# Undo last commit (not pushed)
git reset --soft HEAD~1

# Revert a pushed commit
git revert <commit-hash>

# Emergency branch reset (CAREFUL — destructive)
git fetch origin
git reset --hard origin/main

# Stash work in progress
git stash save "WIP: description"
```

---

## Decision Framework

When uncertain, ask yourself:

1. **Reversibility** — Can this be easily undone?
2. **Blast radius** — What could break if I'm wrong?
3. **Alternatives** — Is there a safer way?
4. **Documentation** — Will others understand why?
5. **Testing** — How can I verify this works?

### The golden rules

```yaml
Golden_Rules: 1. "Don't break what works"
  2. "Ask when uncertain"
  3. "Test before committing"
  4. "Document why, not just what"
  5. "Leave code better than you found it"
  6. "Preserve backwards compatibility"
  7. "Small, focused changes"
  8. "Never compromise security"
  9. "Respect existing patterns"
  10. "Communicate with the team"
```
