# KORA - Frontend Trust Interface

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Tech Stack**: Next.js, TypeScript, Web3  


## 1. Technology Stack

```yaml
Framework: Next.js 14
Language: TypeScript 5.2
State: Zustand + React Query
Styling: Tailwind CSS + Radix UI
Web3: Ethers.js
Visualization: D3.js
Testing: Cypress + Jest
Build: Turbo
```

## 2. Application Architecture

```
src/
├── app/                    # Next.js app router
│   ├── verify/
│   ├── disputes/
│   ├── proofs/
│   └── api/
├── components/
│   ├── verification/       # Verification UI components
│   ├── trust-indicators/   # Trust visualization
│   ├── dispute-resolution/ # Dispute interfaces
│   └── shared/
├── lib/
│   ├── blockchain/        # Web3 integration
│   ├── api/              # API clients
│   └── utils/
├── stores/               # Zustand stores
└── types/               # TypeScript definitions
```

## 3. Key Components

### Trust Score Visualizer
```tsx
interface TrustScoreProps {
  score: number;
  sources: VerificationSource[];
  animated?: boolean;
}

export const TrustScore: React.FC<TrustScoreProps> = ({ 
  score, 
  sources, 
  animated = true 
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    if (animated) {
      // Animate score from 0 to actual
      const timer = setInterval(() => {
        setDisplayScore(prev => {
          if (prev >= score) {
            clearInterval(timer);
            return score;
          }
          return prev + 1;
        });
      }, 20);
      return () => clearInterval(timer);
    }
  }, [score, animated]);
  
  return (
    <div className="trust-container">
      <CircularProgress 
        value={displayScore}
        max={100}
        className={getTrustColor(displayScore)}
      />
      <SourceBreakdown sources={sources} />
      <TrustBadge level={getTrustLevel(displayScore)} />
    </div>
  );
};
```

### Verification Flow Component
```tsx
export const VerificationFlow: React.FC = () => {
  const [step, setStep] = useState<VerificationStep>('input');
  const { verify, isVerifying } = useVerification();
  
  const steps: VerificationStep[] = [
    'input',
    'sources',
    'processing',
    'consensus',
    'proof',
    'complete'
  ];
  
  return (
    <VerificationWizard currentStep={step}>
      {step === 'input' && (
        <ParcelInput onSubmit={(data) => {
          verify(data);
          setStep('sources');
        }} />
      )}
      
      {step === 'sources' && (
        <SourceSelection 
          sources={availableSources}
          onConfirm={() => setStep('processing')}
        />
      )}
      
      {step === 'processing' && (
        <ProcessingAnimation 
          sources={activeSources}
          onComplete={() => setStep('consensus')}
        />
      )}
      
      {step === 'consensus' && (
        <ConsensusVisualization 
          results={verificationResults}
          onContinue={() => setStep('proof')}
        />
      )}
      
      {step === 'proof' && (
        <ProofGeneration 
          data={consensusData}
          onGenerated={() => setStep('complete')}
        />
      )}
      
      {step === 'complete' && (
        <VerificationComplete 
          proof={generatedProof}
          onDownload={downloadProof}
          onShare={shareProof}
        />
      )}
    </VerificationWizard>
  );
};
```

## 4. State Management

```typescript
// Zustand store for verification state
interface VerificationStore {
  currentVerification: Verification | null;
  verificationHistory: Verification[];
  activeDisputes: Dispute[];
  
  // Actions
  startVerification: (parcelId: string) => Promise<void>;
  updateVerificationStatus: (id: string, status: Status) => void;
  fileDispute: (verificationId: string, reason: string) => Promise<void>;
}

export const useVerificationStore = create<VerificationStore>((set, get) => ({
  currentVerification: null,
  verificationHistory: [],
  activeDisputes: [],
  
  startVerification: async (parcelId) => {
    const verification = await api.verify(parcelId);
    set({ currentVerification: verification });
  },
  
  updateVerificationStatus: (id, status) => {
    set(state => ({
      verificationHistory: state.verificationHistory.map(v =>
        v.id === id ? { ...v, status } : v
      )
    }));
  },
  
  fileDispute: async (verificationId, reason) => {
    const dispute = await api.fileDispute(verificationId, reason);
    set(state => ({
      activeDisputes: [...state.activeDisputes, dispute]
    }));
  }
}));
```

## 5. Blockchain Integration

```typescript
// Web3 proof verification
import { ethers } from 'ethers';

export class ProofVerifier {
  private contract: ethers.Contract;
  
  constructor(provider: ethers.Provider) {
    this.contract = new ethers.Contract(
      PROOF_CONTRACT_ADDRESS,
      PROOF_ABI,
      provider
    );
  }
  
  async verifyOnChain(proof: Proof): Promise<boolean> {
    try {
      const tx = await this.contract.verifyProof(
        proof.merkleRoot,
        proof.signature,
        proof.witnesses
      );
      
      const receipt = await tx.wait();
      return receipt.status === 1;
    } catch (error) {
      console.error('On-chain verification failed:', error);
      return false;
    }
  }
  
  async getProofHistory(parcelId: string): Promise<Proof[]> {
    const events = await this.contract.queryFilter(
      this.contract.filters.ProofSubmitted(parcelId)
    );
    
    return events.map(event => ({
      merkleRoot: event.args.merkleRoot,
      timestamp: event.args.timestamp,
      verifier: event.args.verifier
    }));
  }
}
```

## 6. Real-time Updates

```typescript
// WebSocket for live verification updates
export function useVerificationSocket(verificationId: string) {
  const [status, setStatus] = useState<VerificationStatus>();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const ws = new WebSocket(`wss://api.kora.global/ws/${verificationId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      switch (update.type) {
        case 'progress':
          setProgress(update.value);
          break;
        case 'source_complete':
          handleSourceComplete(update.source);
          break;
        case 'verification_complete':
          setStatus(update.status);
          break;
      }
    };
    
    return () => ws.close();
  }, [verificationId]);
  
  return { status, progress };
}
```

## 7. Trust Visualization

```typescript
// D3.js trust network visualization
export const TrustNetwork: React.FC<{ data: TrustData }> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;
    
    // Create force simulation
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Draw links
    const links = svg.selectAll('.link')
      .data(data.links)
      .enter().append('line')
      .attr('class', 'link')
      .style('stroke', d => getTrustColor(d.trust))
      .style('stroke-width', d => Math.sqrt(d.trust * 10));
    
    // Draw nodes
    const nodes = svg.selectAll('.node')
      .data(data.nodes)
      .enter().append('circle')
      .attr('class', 'node')
      .attr('r', d => d.importance * 20)
      .style('fill', d => getNodeColor(d.type));
    
    simulation.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      nodes
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });
  }, [data]);
  
  return <svg ref={svgRef} width={800} height={600} />;
};
```

## 8. Dispute Resolution Interface

```tsx
export const DisputeResolution: React.FC = () => {
  const [dispute, setDispute] = useState<Dispute>();
  const { submitEvidence, requestArbitration } = useDispute();
  
  return (
    <DisputeContainer>
      <DisputeTimeline dispute={dispute} />
      
      <EvidenceUpload
        onUpload={async (files) => {
          const evidence = await processEvidence(files);
          submitEvidence(dispute.id, evidence);
        }}
      />
      
      <StakeholderComments 
        stakeholders={dispute.stakeholders}
        onComment={(comment) => addComment(dispute.id, comment)}
      />
      
      <ArbitrationPanel>
        <ArbitratorSelection 
          available={availableArbitrators}
          onSelect={(arbitrator) => requestArbitration(arbitrator)}
        />
        
        <VotingInterface 
          enabled={dispute.status === 'voting'}
          onVote={(decision) => submitVote(decision)}
        />
      </ArbitrationPanel>
      
      <ResolutionStatus 
        status={dispute.resolution}
        deadline={dispute.deadline}
      />
    </DisputeContainer>
  );
};
```

## 9. Mobile Responsive Design

```tsx
// Responsive verification interface
export const MobileVerification: React.FC = () => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  return (
    <div className={`
      ${isMobile ? 'flex-col' : 'flex-row'}
      flex gap-4 p-4
    `}>
      {isMobile ? (
        <MobileOptimizedFlow />
      ) : (
        <DesktopVerificationFlow />
      )}
    </div>
  );
};

const MobileOptimizedFlow: React.FC = () => (
  <Swiper>
    <SwiperSlide>
      <ParcelScanner />
    </SwiperSlide>
    <SwiperSlide>
      <QuickVerify />
    </SwiperSlide>
    <SwiperSlide>
      <TrustBadge />
    </SwiperSlide>
  </Swiper>
);
```

## 10. QR Code Integration

```tsx
// QR code for offline verification
export const OfflineVerification: React.FC<{ proof: Proof }> = ({ proof }) => {
  const qrData = useMemo(() => {
    return JSON.stringify({
      v: 1, // version
      p: proof.merkleRoot.substring(0, 16), // partial proof
      t: proof.timestamp,
      s: proof.signatures[0].substring(0, 16) // partial signature
    });
  }, [proof]);
  
  return (
    <div className="offline-verification">
      <QRCode 
        value={qrData}
        size={256}
        level="H"
        includeMargin
      />
      <VerificationCode>{proof.verificationCode}</VerificationCode>
      <Instructions>
        Scan this code or enter the verification code at
        verify.kora.global to verify offline
      </Instructions>
    </div>
  );
};
```

## 11. Performance Optimization

```typescript
// Lazy loading and code splitting
const HeavyVisualization = lazy(() => 
  import('./components/HeavyVisualization')
);

// Virtual scrolling for large lists
const VirtualizedDisputeList: React.FC<{ disputes: Dispute[] }> = ({ disputes }) => {
  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>
      <DisputeRow dispute={disputes[index]} />
    </div>
  );
  
  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={disputes.length}
          rowHeight={80}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};

// Memoization for expensive computations
const TrustCalculation = memo(({ sources }) => {
  const trust = useMemo(() => 
    calculateComplexTrustScore(sources), [sources]
  );
  
  return <TrustDisplay score={trust} />;
});
```


**Document Status**: Frontend specification  
**Framework**: Next.js 14 with TypeScript  
**Review Cycle**: Every sprint  
**Owner**: Frontend Team Lead
