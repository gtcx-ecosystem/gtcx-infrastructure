# Microservices Architecture Template

## Service Overview
**Service Name**: [SERVICE_NAME]  
**Service Type**: [Core/Support/Gateway/Integration]  
**Language**: [TypeScript/Python/Go]  
**Container**: [Docker/Kubernetes]  
**Communication**: [REST/gRPC/Message Queue/Event-Driven]


## Service Architecture

### Service Boundaries
```yaml
Service_Responsibility:
  Domain: "[Specific business domain]"
  Capabilities:
    - "[Core capability 1]"
    - "[Core capability 2]"
    - "[Core capability 3]"
  
  Data_Ownership:
    - "[Entity 1]"
    - "[Entity 2]"
  
  Dependencies:
    Internal:
      - service: "[Service name]"
        purpose: "[Why needed]"
        communication: "[REST/gRPC/Event]"
    
    External:
      - service: "[External API]"
        purpose: "[Why needed]"
        fallback: "[Fallback strategy]"
```

### Service Topology
```
┌─────────────────────────────────────────────────────┐
│                   API Gateway                        │
└──────────┬──────────────────┬──────────────┬────────┘
           │                  │              │
    ┌──────▼──────┐    ┌─────▼─────┐  ┌────▼────┐
    │   Service   │◄───│  Service  │  │ Service │
    │      A      │    │     B     │  │    C    │
    └──────┬──────┘    └─────┬─────┘  └────┬────┘
           │                  │              │
    ┌──────▼──────────────────▼──────────────▼────┐
    │           Message Queue / Event Bus          │
    └──────────────────────────────────────────────┘
           │                  │              │
    ┌──────▼──────┐    ┌─────▼─────┐  ┌────▼────┐
    │   Database  │    │  Database │  │Database │
    │      A      │    │     B     │  │    C    │
    └─────────────┘    └───────────┘  └─────────┘
```


## Service Communication

### Synchronous Communication (REST/gRPC)
```typescript
// Service Discovery Pattern
interface ServiceRegistry {
  register(service: ServiceInfo): Promise<void>;
  discover(serviceName: string): Promise<ServiceEndpoint>;
  health(serviceName: string): Promise<HealthStatus>;
}

// Circuit Breaker Pattern
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
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

// Retry Pattern with Exponential Backoff
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

### Asynchronous Communication (Event-Driven)
```typescript
// Event Publishing
interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
}

// Event Schema
interface DomainEvent {
  id: string;
  type: string;
  version: string;
  timestamp: Date;
  correlationId: string;
  causationId?: string;
  metadata: EventMetadata;
  payload: unknown;
}

// Event Subscription
@EventHandler('transaction.created')
class TransactionCreatedHandler {
  async handle(event: TransactionCreatedEvent): Promise<void> {
    // Process event
    await this.updateAnalytics(event);
    await this.notifyUser(event);
    await this.auditLog(event);
  }
}

// Saga Pattern for Distributed Transactions
class PaymentSaga {
  private steps = [
    'validatePayment',
    'reserveFunds',
    'processTransaction',
    'updateInventory',
    'sendConfirmation'
  ];
  
  async execute(context: SagaContext): Promise<void> {
    const compensations: Array<() => Promise<void>> = [];
    
    for (const step of this.steps) {
      try {
        await this[step](context);
        compensations.push(this[`compensate${step}`]);
      } catch (error) {
        // Compensate in reverse order
        for (const compensate of compensations.reverse()) {
          await compensate();
        }
        throw error;
      }
    }
  }
}
```


## Data Management

### Database per Service Pattern
```yaml
Service_Database:
  Type: "[PostgreSQL/MongoDB/DynamoDB]"
  Schema_Management: "[Migrations/Versioned]"
  Backup_Strategy: "[Daily/Continuous]"
  
  Data_Consistency:
    Pattern: "[Event Sourcing/CQRS/Eventual Consistency]"
    Sync_Method: "[CDC/Polling/Events]"
  
  Shared_Data_Access:
    Method: "[API/Events/Data Replication]"
    Cache: "[Redis/Memcached]"
    TTL: "[Cache duration]"
```

### CQRS Pattern Implementation
```typescript
// Command Side
interface CommandHandler<TCommand, TResult> {
  handle(command: TCommand): Promise<TResult>;
}

class CreateTransactionCommand {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
    public readonly userId: string
  ) {}
}

@CommandHandler(CreateTransactionCommand)
class CreateTransactionHandler {
  async handle(command: CreateTransactionCommand): Promise<string> {
    const transaction = new Transaction(command);
    await this.repository.save(transaction);
    await this.eventBus.publish(new TransactionCreatedEvent(transaction));
    return transaction.id;
  }
}

// Query Side
interface QueryHandler<TQuery, TResult> {
  handle(query: TQuery): Promise<TResult>;
}

class GetTransactionQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetTransactionQuery)
class GetTransactionHandler {
  async handle(query: GetTransactionQuery): Promise<TransactionView> {
    return this.readRepository.findById(query.id);
  }
}
```


## Service Security

### Service-to-Service Authentication
```typescript
// mTLS Configuration
const tlsConfig = {
  cert: fs.readFileSync('/certs/service.crt'),
  key: fs.readFileSync('/certs/service.key'),
  ca: fs.readFileSync('/certs/ca.crt'),
  requestCert: true,
  rejectUnauthorized: true
};

// Service Token Pattern
class ServiceAuthenticator {
  async getToken(): Promise<string> {
    const token = await this.tokenProvider.getServiceToken({
      service: process.env.SERVICE_NAME,
      scope: ['read:transactions', 'write:transactions'],
      audience: 'internal-services'
    });
    return token;
  }
  
  async validateToken(token: string): Promise<ServiceClaims> {
    return this.tokenValidator.validate(token, {
      issuer: 'auth-service',
      audience: 'internal-services'
    });
  }
}
```

### API Gateway Integration
```yaml
API_Gateway_Config:
  Authentication:
    Type: "OAuth2/JWT"
    Provider: "Auth0/Cognito/Custom"
  
  Rate_Limiting:
    Default: "1000 req/min"
    By_Service:
      ServiceA: "5000 req/min"
      ServiceB: "2000 req/min"
  
  Request_Routing:
    Path_Prefix: "/api/v1/[service]"
    Load_Balancing: "Round Robin/Least Connections"
  
  Security:
    CORS: "Enabled"
    Headers: ["X-Request-ID", "X-Correlation-ID"]
    Timeout: "30s"
```


## Service Observability

### Logging Standards
```typescript
// Structured Logging
interface LogContext {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  service: string;
  version: string;
  correlationId: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
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
      metadata: {
        stack: error.stack,
        ...context.metadata
      }
    });
  }
}
```

### Distributed Tracing
```typescript
// OpenTelemetry Integration
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('service-name', '1.0.0');

async function tracedOperation<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = tracer.startSpan(name);
  
  try {
    const result = await fn();
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Metrics Collection
```typescript
// Prometheus Metrics
import { Counter, Histogram, Gauge } from 'prom-client';

const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status']
});

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});
```


## Deployment & Scaling

### Container Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["node", "dist/index.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: [service-name]
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: [service-name]
  template:
    metadata:
      labels:
        app: [service-name]
    spec:
      containers:
      - name: [service-name]
        image: gtcx/[service-name]:latest
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

### Auto-Scaling Configuration
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: [service-name]-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: [service-name]
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


## Testing Strategy

### Service Testing Levels
```typescript
// Unit Tests
describe('TransactionService', () => {
  it('should create transaction', async () => {
    const service = new TransactionService(mockRepo);
    const result = await service.create(mockData);
    expect(result).toBeDefined();
  });
});

// Integration Tests
describe('Transaction API', () => {
  it('should handle full transaction flow', async () => {
    const response = await request(app)
      .post('/transactions')
      .send(validTransaction);
    expect(response.status).toBe(201);
  });
});

// Contract Tests (Pact)
describe('Transaction Service Consumer', () => {
  it('should consume transaction events', async () => {
    await provider.addInteraction({
      state: 'transaction exists',
      uponReceiving: 'a request for transaction',
      withRequest: {
        method: 'GET',
        path: '/transactions/123'
      },
      willRespondWith: {
        status: 200,
        body: expectedTransaction
      }
    });
  });
});

// End-to-End Tests
describe('Payment Flow', () => {
  it('should process payment through all services', async () => {
    const payment = await createPayment();
    await waitForProcessing(payment.id);
    const result = await getPaymentStatus(payment.id);
    expect(result.status).toBe('completed');
  });
});
```


## Service Performance

### Performance Requirements
| Metric | Target | Measurement |
|--------|--------|-------------|
| Response Time (p50) | < 100ms | Prometheus |
| Response Time (p99) | < 500ms | Prometheus |
| Throughput | > 1000 RPS | Load Testing |
| Error Rate | < 0.1% | Monitoring |
| Availability | > 99.9% | Uptime Monitor |

### Performance Optimization
```typescript
// Connection Pooling
const pool = new Pool({
  max: 20,
  min: 5,
  idle: 10000
});

// Caching Strategy
const cache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120
});

// Batch Processing
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


## Service Lifecycle

### Graceful Shutdown
```typescript
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  
  // Stop accepting new requests
  server.close();
  
  // Wait for ongoing requests to complete
  await waitForRequestsToComplete();
  
  // Close database connections
  await database.close();
  
  // Close message queue connections
  await messageQueue.close();
  
  // Final cleanup
  process.exit(0);
});
```

### Health Checks
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.VERSION
  });
});

app.get('/ready', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkMessageQueue(),
    checkDependencies()
  ]);
  
  const ready = checks.every(check => check.status === 'ready');
  res.status(ready ? 200 : 503).json({
    ready,
    checks
  });
});
```


*This template provides a comprehensive guide for building scalable, resilient microservices in the GTCX ecosystem.*
