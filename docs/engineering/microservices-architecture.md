# Microservices Architecture — {Service Name}

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Service type:** Core / Support / Gateway / Integration
**Language:** {TypeScript / Python / Go / Rust}
**Container:** Docker / Kubernetes
**Communication:** REST / gRPC / Message Queue / Event-Driven
**Last updated:** {YYYY-MM-DD}

---

## Service Boundaries

```yaml
Service_Responsibility:
  Domain: '{specific business domain}'
  Capabilities:
    - '{core capability 1}'
    - '{core capability 2}'
    - '{core capability 3}'

  Data_Ownership:
    - '{entity 1}'
    - '{entity 2}'

  Dependencies:
    Internal:
      - service: '{service name}'
        purpose: '{why needed}'
        communication: 'REST / gRPC / Event'
    External:
      - service: '{external API}'
        purpose: '{why needed}'
        fallback: '{fallback strategy}'
```

### Service topology

```
┌──────────────────────────────────────────────────────┐
│                      API Gateway                     │
└──────────┬─────────────────┬──────────────┬──────────┘
           │                 │              │
    ┌──────▼──────┐   ┌──────▼──────┐  ┌───▼─────┐
    │  Service A  │◄──│  Service B  │  │Service C│
    └──────┬──────┘   └──────┬──────┘  └───┬─────┘
           │                 │              │
    ┌──────▼─────────────────▼──────────────▼──────┐
    │            Message Queue / Event Bus          │
    └──────┬─────────────────┬──────────────┬───────┘
           │                 │              │
    ┌──────▼──────┐   ┌──────▼──────┐  ┌───▼─────┐
    │  Database A │   │  Database B │  │Database C│
    └─────────────┘   └─────────────┘  └──────────┘
```

---

## Service Communication

### Synchronous (REST / gRPC)

```typescript
// Service discovery
interface ServiceRegistry {
  register(service: ServiceInfo): Promise<void>;
  discover(serviceName: string): Promise<ServiceEndpoint>;
  health(serviceName: string): Promise<HealthStatus>;
}

// Circuit breaker
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(baseDelay * Math.pow(2, i));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Asynchronous (Event-Driven)

```typescript
// Domain event schema
interface DomainEvent {
  id: string;
  type: string;
  version: string;
  timestamp: Date;
  correlationId: string;
  causationId?: string;
  metadata: Record<string, unknown>;
  payload: unknown;
}

// Event handler
@EventHandler('{EventType}')
class {EventType}Handler {
  async handle(event: {EventType}Event): Promise<void> {
    await this.updateProjection(event);
    await this.notifyDownstream(event);
    await this.auditLog(event);
  }
}

// Saga pattern for distributed transactions
class {WorkflowName}Saga {
  private steps = [
    'validateInput',
    'reserveResource',
    'processAction',
    'updateState',
    'sendConfirmation'
  ];

  async execute(context: SagaContext): Promise<void> {
    const compensations: Array<() => Promise<void>> = [];

    for (const step of this.steps) {
      try {
        await thisstep (`context`);
        compensations.push(this[`compensate_${step}`]);
      } catch (error) {
        for (const compensate of compensations.reverse()) {
          await compensate();
        }
        throw error;
      }
    }
  }
}
```

---

## Data Management

### Database per service

```yaml
Service_Database:
  Type: '{PostgreSQL / MongoDB / DynamoDB}'
  Schema_Management: 'Migrations / Versioned'
  Backup_Strategy: 'Daily / Continuous'

  Data_Consistency:
    Pattern: 'Event Sourcing / CQRS / Eventual Consistency'
    Sync_Method: 'CDC / Polling / Events'

  Shared_Data_Access:
    Method: 'API / Events / Read Replica'
    Cache: 'Redis / Memcached'
    TTL: '{cache duration}'
```

### CQRS pattern

```typescript
// Command side
class Create{Entity}Command {
  constructor(
    public readonly data: {EntityData},
    public readonly actorId: string
  ) {}
}

@CommandHandler(Create{Entity}Command)
class Create{Entity}Handler {
  async handle(command: Create{Entity}Command): Promise<string> {
    const entity = new {Entity}(command.data);
    await this.repository.save(entity);
    await this.eventBus.publish(new {Entity}CreatedEvent(entity));
    return entity.id;
  }
}

// Query side
class Get{Entity}Query {
  constructor(public readonly id: string) {}
}

@QueryHandler(Get{Entity}Query)
class Get{Entity}Handler {
  async handle(query: Get{Entity}Query): Promise<{Entity}View> {
    return this.readRepository.findById(query.id);
  }
}
```

---

## Security

### Service-to-service authentication

```typescript
// mTLS configuration
const tlsConfig = {
  cert: fs.readFileSync('/certs/service.crt'),
  key: fs.readFileSync('/certs/service.key'),
  ca: fs.readFileSync('/certs/ca.crt'),
  requestCert: true,
  rejectUnauthorized: true,
};

// Service token pattern
class ServiceAuthenticator {
  async getToken(): Promise<string> {
    return this.tokenProvider.getServiceToken({
      service: process.env.SERVICE_NAME,
      scope: ['read:{resource}', 'write:{resource}'],
      audience: 'internal-services',
    });
  }

  async validateToken(token: string): Promise<ServiceClaims> {
    return this.tokenValidator.validate(token, {
      issuer: 'auth-service',
      audience: 'internal-services',
    });
  }
}
```

### API gateway config

```yaml
API_Gateway_Config:
  Authentication:
    Type: 'OAuth2 / JWT'
    Provider: '{auth provider}'

  Rate_Limiting:
    Default: '{n} req/min'
    By_Service:
      { ServiceA }: '{n} req/min'
      { ServiceB }: '{n} req/min'

  Request_Routing:
    Path_Prefix: '/api/v1/{service}'
    Load_Balancing: 'Round Robin / Least Connections'

  Security:
    CORS: 'Enabled'
    Required_Headers: ['X-Request-ID', 'X-Correlation-ID']
    Timeout: '30s'
```

---

## Observability

### Structured logging

```typescript
interface LogContext {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;
  version: string;
  correlationId: string;
  traceId?: string;
  spanId?: string;
  actorId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

class ServiceLogger {
  log(context: LogContext): void {
    console.log(JSON.stringify(context));
  }

  error(error: Error, context: Partial<LogContext>): void {
    this.log({
      ...context,
      level: 'ERROR',
      message: error.message,
      metadata: { stack: error.stack, ...context.metadata },
    });
  }
}
```

### Distributed tracing (OpenTelemetry)

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('{service-name}', '{version}');

async function traced<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const span = tracer.startSpan(name);
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Metrics (Prometheus)

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'path'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5],
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});
```

---

## Deployment and Scaling

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["node", "dist/index.js"]
```

### Kubernetes deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service-name}
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: {service-name}
  template:
    metadata:
      labels:
        app: {service-name}
    spec:
      containers:
      - name: {service-name}
        image: {registry}/{service-name}:{tag}
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Horizontal pod autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {service-name}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {service-name}
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Testing

```typescript
// Unit
describe('{Service}', () => {
  it('should {expected behavior}', async () => {
    const service = new {Service}(mockRepo);
    const result = await service.{method}(mockData);
    expect(result).toBeDefined();
  });
});

// Integration
describe('{Resource} API', () => {
  it('should handle full {workflow} flow', async () => {
    const response = await request(app)
      .post('/{resources}')
      .send(validPayload);
    expect(response.status).toBe(201);
  });
});

// Contract (Pact)
describe('{Service} Consumer', () => {
  it('should consume {resource} events', async () => {
    await provider.addInteraction({
      state: '{resource} exists',
      uponReceiving: 'a request for {resource}',
      withRequest: { method: 'GET', path: '/{resources}/{id}' },
      willRespondWith: { status: 200, body: expected{Resource} }
    });
  });
});

// End-to-end
describe('{Workflow} Flow', () => {
  it('should process through all services', async () => {
    const entity = await create{Entity}();
    await waitForProcessing(entity.id);
    const result = await get{Entity}Status(entity.id);
    expect(result.status).toBe('completed');
  });
});
```

---

## Performance

| Metric              | Target    | Measurement    |
| ------------------- | --------- | -------------- |
| Response time (p50) | < {n}ms   | Prometheus     |
| Response time (p99) | < {n}ms   | Prometheus     |
| Throughput          | > {n} RPS | Load testing   |
| Error rate          | < {n}%    | Monitoring     |
| Availability        | > {n}%    | Uptime monitor |

```typescript
// Connection pooling
const pool = new Pool({ max: 20, min: 5, idle: 10000 });

// Batch processing
class BatchProcessor {
  private batch: Item[] = [];
  private timer?: NodeJS.Timeout;

  async add(item: Item): Promise<void> {
    this.batch.push(item);
    if (this.batch.length >= 100) {
      await this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 1000);
    }
  }

  private async flush(): Promise<void> {
    const items = this.batch.splice(0);
    await this.processBatch(items);
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
```

---

## Service Lifecycle

### Graceful shutdown

```typescript
process.on('SIGTERM', async () => {
  // Stop accepting new requests
  server.close();

  // Drain in-flight requests
  await waitForRequestsToComplete();

  // Close connections
  await database.close();
  await messageQueue.close();

  process.exit(0);
});
```

### Health checks

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.VERSION,
  });
});

app.get('/ready', async (req, res) => {
  const checks = await Promise.all([checkDatabase(), checkMessageQueue(), checkDependencies()]);

  const ready = checks.every((c) => c.status === 'ready');
  res.status(ready ? 200 : 503).json({ ready, checks });
});
```
