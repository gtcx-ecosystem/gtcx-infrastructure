# ADR-006: Package Boundaries and Dependencies

## Status

Accepted

## Date

2026-01-19

## Context

As [Organization Name] grows, clear boundaries are essential to prevent:

1. **Circular dependencies**: Module A imports B which imports A
2. **Platform leakage**: Server code in shared modules
3. **Tight coupling**: Changes to one module break many others
4. **Import confusion**: Unclear which module provides what

## Decision

We establish strict **Package Boundaries** with the following rules:

### 1. Dependency Direction

Dependencies flow in one direction only:

```
intelligence/
    ↓
publishing/
    ↓
platforms/
```

**Rule**: A module can only import from modules above it or peer shared modules.

### 2. Module Categories

| Category         | Location        | Can Import               |
| ---------------- | --------------- | ------------------------ |
| **Intelligence** | `intelligence/` | Nothing (foundation)     |
| **Publishing**   | `publishing/`   | Intelligence             |
| **Platforms**    | `platforms/`    | Intelligence, Publishing |
| **Organization** | `organization/` | Reference only           |
| **Technology**   | `technology/`   | Schemas, configs         |
| **Business**     | `business/`     | Reference only           |

### 3. Shared Resources

Cross-cutting concerns live in designated locations:

| Resource            | Location                |
| ------------------- | ----------------------- |
| Type definitions    | `technology/schemas/`   |
| Editorial standards | `publishing/editorial/` |
| Agent configs       | `publishing/agentic/`   |
| Index methodologies | `intelligence/indices/` |

### 4. No Deep Imports

Import from module root only:

```typescript
// ✅ CORRECT
import { methodology } from '@gtx/intelligence/ctii';

// ❌ INCORRECT
import { methodology } from '@gtx/intelligence/indices/ctii/src/methodology';
```

## Consequences

### Benefits

1. **Clear ownership**: Each module has defined responsibility
2. **Independent evolution**: Modules can change without breaking others
3. **Easier onboarding**: New team members understand the hierarchy
4. **Build optimization**: Unchanged modules skip rebuild

### Drawbacks

1. **Initial complexity**: More modules to understand
2. **Cross-cutting features**: May need changes in multiple modules
3. **Import verbosity**: More explicit imports required

## Module Responsibility Matrix

| Module                   | Responsible For         | NOT Responsible For |
| ------------------------ | ----------------------- | ------------------- |
| `intelligence/indices/`  | Index data, methodology | Content production  |
| `intelligence/research/` | Deep research           | Daily publishing    |
| `publishing/editorial/`  | Standards, voice        | Platform delivery   |
| `publishing/agentic/`    | AI workflows            | Business logic      |
| `platforms/*/`           | Audience experience     | Raw intelligence    |

## References

- Adapted from [Protocol Partner] ADR-006
- [Content-First Architecture](./ADR-007-content-first-architecture.md)
