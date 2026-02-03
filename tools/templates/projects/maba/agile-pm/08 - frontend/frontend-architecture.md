# MABA - Frontend Architecture

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Status**: In Development  


## 1. Technology Stack

```yaml
Framework: React 18.2
Language: TypeScript 5.0
State Management: Redux Toolkit + RTK Query
Styling: Tailwind CSS 3.3
Build Tool: Vite 4.4
Testing: Jest + React Testing Library
UI Components: Ant Design 5.0
Charts: Recharts
Forms: React Hook Form
```

## 2. Application Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/
│   ├── dashboard/
│   ├── transformation/
│   └── mapping/
├── features/            # Feature-based modules
│   ├── auth/
│   ├── jobs/
│   ├── sources/
│   └── settings/
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── store/               # Redux store configuration
├── utils/               # Utility functions
└── types/               # TypeScript definitions
```

## 3. Key Components

### Dashboard Component
```tsx
interface DashboardProps {
  userId: string;
  timeRange: TimeRange;
}

const Dashboard: React.FC<DashboardProps> = ({ userId, timeRange }) => {
  const { data: stats } = useGetStatsQuery({ userId, timeRange });
  const { data: jobs } = useGetActiveJobsQuery();
  
  return (
    <DashboardLayout>
      <StatsGrid stats={stats} />
      <ActiveJobsPanel jobs={jobs} />
      <RecentActivityFeed />
      <PerformanceChart timeRange={timeRange} />
    </DashboardLayout>
  );
};
```

### Schema Mapper Component
```tsx
const SchemaMapper: React.FC = () => {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const { suggestions } = useAIMappingSuggestions(sourceSchema);
  
  return (
    <MappingInterface>
      <SourcePanel fields={sourceFields} />
      <MappingCanvas 
        mappings={mappings}
        onConnect={handleConnect}
        suggestions={suggestions}
      />
      <TargetPanel fields={targetFields} />
    </MappingInterface>
  );
};
```

## 4. State Management

```typescript
// Store structure
interface RootState {
  auth: AuthState;
  jobs: JobsState;
  sources: SourcesState;
  mappings: MappingsState;
  ui: UIState;
}

// Example slice
const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    jobStarted: (state, action) => {
      state.activeJobs.push(action.payload);
    },
    jobProgress: (state, action) => {
      const job = state.activeJobs.find(j => j.id === action.payload.id);
      if (job) job.progress = action.payload.progress;
    }
  }
});
```

## 5. API Integration

```typescript
// RTK Query API
const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers) => {
      headers.set('authorization', `Bearer ${getToken()}`);
      return headers;
    }
  }),
  endpoints: (builder) => ({
    getJobs: builder.query<Job[], void>({
      query: () => 'jobs',
      providesTags: ['Jobs']
    }),
    startTransformation: builder.mutation<Job, TransformConfig>({
      query: (config) => ({
        url: 'transform',
        method: 'POST',
        body: config
      }),
      invalidatesTags: ['Jobs']
    })
  })
});
```

## 6. Real-time Updates

```typescript
// WebSocket connection for real-time updates
const useJobProgress = (jobId: string) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8001/jobs/${jobId}/progress`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
    };
    
    return () => ws.close();
  }, [jobId]);
  
  return progress;
};
```

## 7. Performance Optimization

```typescript
// Lazy loading routes
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const SchemaMapper = lazy(() => import('./features/mapping/SchemaMapper'));
const JobDetails = lazy(() => import('./features/jobs/JobDetails'));

// Memoization
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => 
    processComplexData(data), [data]
  );
  
  return <DataVisualization data={processedData} />;
});

// Virtual scrolling for large lists
<VirtualList
  height={600}
  itemCount={records.length}
  itemSize={50}
  renderItem={({ index, style }) => (
    <RecordRow record={records[index]} style={style} />
  )}
/>
```

## 8. Testing Strategy

```typescript
// Component testing
describe('TransformationForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<TransformationForm onSubmit={onSubmit} />);
    
    await userEvent.type(screen.getByLabelText('Source'), 'postgres://...');
    await userEvent.click(screen.getByText('Start Transformation'));
    
    expect(onSubmit).toHaveBeenCalledWith({
      source: 'postgres://...',
      // ... other fields
    });
  });
});

// Integration testing
describe('Job Progress Flow', () => {
  it('should update progress in real-time', async () => {
    renderWithProviders(<JobProgress jobId="123" />);
    
    act(() => {
      mockWebSocket.send({ progress: 50 });
    });
    
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
```

## 9. Accessibility

```tsx
// WCAG 2.1 AA Compliance
<Button
  aria-label="Start new transformation"
  aria-describedby="transform-help"
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
  Start Transformation
</Button>

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'Enter':
    case ' ':
      handleClick();
      break;
    case 'Escape':
      handleCancel();
      break;
  }
};
```

## 10. Build & Deployment

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'redux'],
          ui: ['antd', 'recharts'],
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8001'
    }
  }
});
```


**Document Status**: Frontend specification  
**Review Cycle**: Every sprint  
**Owner**: Frontend Team Lead
