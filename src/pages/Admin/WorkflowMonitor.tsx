import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Play, Eye, HelpCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { MedXEngine } from '../../core/MedXEngine';
import { EventTimeline } from '../../monitoring/EventTimeline';
import { WorkflowMonitor as WorkflowStore, WorkflowRunState } from '../../monitoring/WorkflowMonitor';
import { PipelineAnimator } from '../../components/widgets/PipelineAnimator';
import { EventLogViewer } from '../../components/widgets/EventLogViewer';
import { ConfidenceGauge } from '../../components/widgets/ConfidenceGauge';
import patientScenarios from '../../knowledge/patientScenarios.json';
import { MedXEvent } from '../../types/event';
import { RequestContext } from '../../types/context';

interface AgentTelemetryState {
  id: string;
  name: string;
  desc: string;
  icon: string;
  status: 'Idle' | 'Running' | 'Completed' | 'Failed';
  latencyMs: number;
  confidence: number;
  task: string;
  timestamp: string;
}

const initialPipelineAgents: AgentTelemetryState[] = [
  { id: 'gemini', name: 'Gemini NLU Agent', desc: 'Understanding clinical symptoms and intent...', icon: '🧠', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Extracting symptoms and identifying requested medicines...', timestamp: '' },
  { id: 'triage', name: 'Triage Agent', desc: 'Symptom NLP parsing and keyword extraction...', icon: '🩺', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Extracting symptoms and mapping requesting clinical categories...', timestamp: '' },
  { id: 'memory', name: 'Memory Agent (Supermemory)', desc: 'Retrieving patient history, duplicate warnings...', icon: '💾', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Checking previous orders, refill intervals, and known penicillin allergies...', timestamp: '' },
  { id: 'ece', name: 'ECE Engine', desc: 'Severity triage mapping and urgency checking...', icon: '🚨', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Determining emergency triage priority level and ICU request requirements...', timestamp: '' },
  { id: 'gis', name: 'Routing Agent (GIS)', desc: 'Abstractions mapping and coordinates routing...', icon: '🗺️', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Routing ambulance/drone transport path via OpenRouteService/Google Maps...', timestamp: '' },
  { id: 'inventory', name: 'Inventory Agent', desc: 'Resource stock reserves checking...', icon: '📦', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Checking medicine and blood bank inventory reservations...', timestamp: '' },
  { id: 'logistics', name: 'Logistics Agent', desc: 'Courier dispatch assignment parameters...', icon: '🚚', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Calculating distance constraints, and allocating ground/drone dispatchers...', timestamp: '' },
  { id: 'decision', name: 'Decision Engine', desc: 'Clinical authentication recommendations...', icon: '⚖️', status: 'Idle', latencyMs: 0, confidence: 0, task: 'Consolidating final routing actions, explaining reasoning, and saving context...', timestamp: '' }
];

const agentSubSteps: Record<string, string[]> = {
  gemini: [
    'Received Patient Request',
    'Extracting Symptoms...',
    'Identifying Requested Medicines...',
    'Understanding Patient Intent...',
    'Calculating Initial Confidence...',
    'Generating Structured JSON...',
    'Passing Context to Memory Agent...'
  ],
  triage: [
    'Analyzing Clinical Categorizations...',
    'Evaluating Symptom Taxonomy...',
    'Matching Requested Drugs against Catalogue...',
    'Triage Verification Passed...'
  ],
  memory: [
    'Searching Patient History...',
    'Loading Previous Orders...',
    'Checking Allergies...',
    'Checking Chronic Diseases...',
    'Retrieving Preferred Hospital...',
    'Context Retrieved Successfully...',
    'Passing Patient Context to ECE Engine...'
  ],
  ece: [
    'Evaluating Severity...',
    'Applying Emergency Rules...',
    'Checking Critical Symptoms...',
    'Assigning ECE Level...',
    'Generating Clinical Reasoning...',
    'Passing Emergency Context to Routing Agent...'
  ],
  gis: [
    'Searching Nearby Facilities...',
    'Finding Nearby Hospitals...',
    'Finding Nearby Pharmacies...',
    'Finding Nearby Blood Banks...',
    'Calculating ETA...',
    'Selecting Optimal Route...',
    'Passing Facilities to Inventory Agent...'
  ],
  inventory: [
    'Checking Medicine Availability...',
    'Checking Blood Availability...',
    'Finding Alternatives...',
    'Reserving Inventory...',
    'Passing Inventory Status to Logistics Agent...'
  ],
  logistics: [
    'Selecting Delivery Method...',
    'Assigning Rider / Ambulance...',
    'Estimating Delivery Time...',
    'Generating Tracking Route...',
    'Passing Dispatch Details to Decision Agent...'
  ],
  decision: [
    'Combining Agent Outputs...',
    'Calculating Overall Confidence...',
    'Generating Explainable AI Summary...',
    'Selecting Required Stakeholders...',
    'Final Decision Fused...',
    'Workflow Started...'
  ]
};

export const WorkflowMonitor: React.FC = () => {
  const toastManager = useToast();
  const [query, setQuery] = useState<string>(patientScenarios.scenarios[0].query);
  const [patientId, setPatientId] = useState<string>(patientScenarios.scenarios[0].patientId);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [mode, setMode] = useState<'Mock' | 'Production'>('Mock');
  const [events, setEvents] = useState<MedXEvent[]>([]);
  const [workflowState, setWorkflowState] = useState<WorkflowRunState>({
    requestId: '',
    activeStep: null,
    status: 'PENDING',
    completedSteps: []
  });
  
  const [lastContext, setLastContext] = useState<RequestContext | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<'All' | 'Pharmacy' | 'Hospital' | 'Blood' | 'Deliveries'>('All');

  const [pipelineAgents, setPipelineAgents] = useState<AgentTelemetryState[]>(initialPipelineAgents);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [activeSubStepIndex, setActiveSubStepIndex] = useState<number>(-1);
  const [totalPipelineTime, setTotalPipelineTime] = useState<number>(0);

  const playbackIntervalRef = React.useRef<any>(null);
  const playbackSubIntervalRef = React.useRef<any>(null);

  const startSequentialPlayback = (queryStr: string, contextObj: any = null) => {
    console.log('[Playback] Sequential agent execution playback active for: ', queryStr);
    
    // Stop any running intervals to avoid parallel execution bugs
    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    if (playbackSubIntervalRef.current) clearInterval(playbackSubIntervalRef.current);

    setEvents([]);
    setTotalPipelineTime(0);
    if (contextObj) {
      setLastContext(contextObj);
    }
    
    let step = 0;
    setActiveStepIndex(0);
    setActiveSubStepIndex(0);
    
    const initialCopy = initialPipelineAgents.map(a => ({ ...a, status: 'Idle' as const, latencyMs: 0, confidence: 0, timestamp: '' }));
    setPipelineAgents(initialCopy);

    const interval = setInterval(() => {
      if (playbackSubIntervalRef.current) clearInterval(playbackSubIntervalRef.current);

      if (step < initialCopy.length) {
        setActiveSubStepIndex(0);
        const currentAgentId = initialCopy[step].id;
        const subSteps = agentSubSteps[currentAgentId] || [];
        let sStep = 0;
        
        const subInt = setInterval(() => {
          if (sStep < subSteps.length) {
            sStep++;
            setActiveSubStepIndex(sStep);
          }
        }, Math.floor(1500 / subSteps.length));
        playbackSubIntervalRef.current = subInt;

        setPipelineAgents(prev => {
          const updated = [...prev];
          if (step > 0) {
            const prevAgent = updated[step - 1];
            prevAgent.status = 'Completed';
            
            if (contextObj) {
              const actualOut = contextObj.agentOutputs?.find((o: any) => o.agentId === prevAgent.id);
              prevAgent.latencyMs = actualOut?.latencyMs || Math.floor(40 + Math.random() * 80);
              prevAgent.confidence = actualOut?.confidence || Math.floor(90 + Math.random() * 9);
            } else {
              prevAgent.latencyMs = Math.floor(40 + Math.random() * 80);
              prevAgent.confidence = Math.floor(90 + Math.random() * 9);
            }
            prevAgent.timestamp = new Date().toLocaleTimeString();
            setTotalPipelineTime(t => t + prevAgent.latencyMs);

            setEvents(e => [
              {
                type: 'AGENT_FINISHED' as any,
                timestamp: Date.now(),
                requestId: contextObj?.requestId || 'REQ-SIM',
                payload: {
                  agentId: prevAgent.name,
                  message: `Agent execution resolved. Confidence: ${prevAgent.confidence}%`
                }
              },
              ...e
            ]);
          }
          
          const currAgent = updated[step];
          if (!currAgent) return updated;
          currAgent.status = 'Running';
          currAgent.timestamp = new Date().toLocaleTimeString();

          setTimeout(() => {
            const el = document.getElementById(`agent-card-${currAgent.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 50);

          setEvents(e => [
            {
              type: 'AGENT_STARTED' as any,
              timestamp: Date.now(),
              requestId: contextObj?.requestId || 'REQ-SIM',
              payload: {
                agentId: currAgent.name,
                message: currAgent.task
              }
            },
            ...e
          ]);

          return updated;
        });
        
        step++;
        setActiveStepIndex(step);
      } else {
        if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
        if (playbackSubIntervalRef.current) clearInterval(playbackSubIntervalRef.current);
        setActiveSubStepIndex(-1);

        setPipelineAgents(prev => {
          const updated = [...prev];
          const lastAgent = updated[updated.length - 1];
          if (lastAgent) {
            lastAgent.status = 'Completed';
            if (contextObj) {
              const actualOut = contextObj.agentOutputs?.find((o: any) => o.agentId === lastAgent.id);
              lastAgent.latencyMs = actualOut?.latencyMs || Math.floor(30 + Math.random() * 50);
              lastAgent.confidence = actualOut?.confidence || 99;
            } else {
              lastAgent.latencyMs = Math.floor(30 + Math.random() * 50);
              lastAgent.confidence = 99;
            }
            lastAgent.timestamp = new Date().toLocaleTimeString();
            setTotalPipelineTime(t => t + lastAgent.latencyMs);
          }
          return updated;
        });
        if (contextObj) {
          setLastContext(contextObj);
        }
      }
    }, 1800);
    playbackIntervalRef.current = interval;
  };

  const startFullE2EPlayback = (queryStr: string, contextObj: any = null) => {
    toastManager.addToast('Replaying E2E workflow sequence...', 'info');
    
    startSequentialPlayback(queryStr, contextObj);
    
    setTimeout(() => {
      let stageIdx = 0;
      const stages = [
        { name: 'PHARMACY_REVIEW', label: 'Pharmacy Pending Approval' },
        { name: 'APPROVED', label: 'Prescription Validated & Approved' },
        { name: 'INVENTORY_RESERVED', label: 'Inventory reserved in Care Pharmacy' },
        { name: 'DISPATCH_ASSIGNED', label: 'Logistics Rider assigned (Dave Miller)' },
        { name: 'PICKED_UP', label: 'Rider reached pharmacy store' },
        { name: 'OUT_FOR_DELIVERY', label: 'Package In Transit (Out For Delivery)' },
        { name: 'DELIVERED', label: 'Rider arrived at patient residence' },
        { name: 'COMPLETED', label: 'Workflow successfully finalized' }
      ];

      const stageInterval = setInterval(() => {
        if (stageIdx < stages.length) {
          const currentStage = stages[stageIdx];
          
          setWorkflowState(prev => {
            let activeNode: string | null = null;
            if (currentStage.name === 'PHARMACY_REVIEW') activeNode = 'inventory';
            else if (['APPROVED', 'INVENTORY_RESERVED'].includes(currentStage.name)) activeNode = 'logistics';
            else activeNode = 'decision';

            const newCompleted = [...prev.completedSteps];
            if (activeNode && !newCompleted.includes(activeNode)) {
              newCompleted.push(activeNode);
            }

            return {
              requestId: prev.requestId || 'REQ-REPLAY',
              activeStep: activeNode,
              status: currentStage.name === 'COMPLETED' ? 'COMPLETED' : 'RUNNING',
              completedSteps: newCompleted
            };
          });

          setEvents(e => [
            {
              type: 'STAGE_CHANGED' as any,
              timestamp: Date.now(),
              requestId: 'REQ-REPLAY',
              payload: {
                agentId: 'WorkflowEngine',
                message: `[Replay] Status transitioned to: ${currentStage.label}`
              }
            },
            ...e
          ]);

          stageIdx++;
        } else {
          clearInterval(stageInterval);
          toastManager.addToast('Full E2E Workflow Replay completed!', 'success');
        }
      }, 1500);
    }, 14500);
  };

  const handleStartLiveDemo = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('http://localhost:3001/api/demo/chest-pain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast('Presentation Mode initiated! Watch the agent workflows execute.', 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        setAllOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed fetching all orders:', err);
    }
  };

  const triggerOverrideStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflow/${orderId}/override-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast(`Workflow overridden to: ${newStatus}`, 'success');
        fetchAllOrders();
      }
    } catch (err) {
      console.error(err);
      toastManager.addToast('Failed to override status.', 'error');
    }
  };

  const triggerForceReassign = async (orderId: string, pharmacy: string, rider: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflow/${orderId}/force-reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pharmacy, rider })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast(`Reassigned successfully.`, 'success');
        fetchAllOrders();
      }
    } catch (err) {
      console.error(err);
      toastManager.addToast('Failed reassigning.', 'error');
    }
  };

  const triggerCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflow/${orderId}/cancel`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast(`Order cancelled successfully.`, 'info');
        fetchAllOrders();
      }
    } catch (err) {
      console.error(err);
      toastManager.addToast('Failed to cancel order.', 'error');
    }
  };

  const fetchLatestRequests = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/workflow/requests');
      const data = await res.json();
      if (data.success && data.contexts.length > 0) {
        const topContext = JSON.parse(data.contexts[0].context_json);
        setLastContext(topContext);
      }
    } catch (err) {
      console.error('Failed fetching latest requests:', err);
    }
  };

  // Subscribe to Event Bus timeline and Active Workflow updates
  useEffect(() => {
    fetchLatestRequests();
    fetchAllOrders();

    const unsubEvents = EventTimeline.subscribe(newEvents => {
      setEvents(newEvents);
    });

    const unsubWorkflow = WorkflowStore.subscribe(newState => {
      setWorkflowState(newState);
      if (newState.status === 'RUNNING') {
        setIsRunning(true);
      } else {
        setIsRunning(false);
      }
    });

    // Central SSE Listener for Real-Time Workflow Synchronization
    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    
    eventSource.onmessage = (event) => {
      try {
        fetchAllOrders();
        const data = JSON.parse(event.data);
        if (data.type === 'START_AI_VISUALIZATION') {
          startSequentialPlayback(data.query, data.finalContext);
        } else if (data.type === 'STAGE_CHANGED') {
          setWorkflowState(prev => {
            const currentStep = data.stage.toLowerCase();
            
            let activeNode: string | null = null;
            if (['request_created', 'ai_analysis_running'].includes(currentStep)) activeNode = 'triage';
            else if (currentStep.includes('ece')) activeNode = 'ece';
            else if (currentStep.includes('facility')) activeNode = 'gis';
            else if (currentStep.includes('pharmacy_pending')) activeNode = 'inventory';
            else if (currentStep.includes('pharmacy_accepted') || currentStep.includes('reserved')) activeNode = 'logistics';
            else if (currentStep.includes('logistics') || currentStep.includes('delivery')) activeNode = 'decision';

            const newCompleted = [...prev.completedSteps];
            if (activeNode && !newCompleted.includes(activeNode)) {
              newCompleted.push(activeNode);
            }

            return {
              requestId: data.requestId,
              activeStep: activeNode,
              status: data.status as any,
              completedSteps: newCompleted
            };
          });

          fetchLatestRequests();
        } else if (data.type === 'NOTIFICATION_RECEIVED') {
          setEvents(prev => [
            {
              type: 'AGENT_FINISHED' as any,
              timestamp: data.notification.timestamp,
              requestId: data.notification.requestId,
              payload: {
                agentId: 'WorkflowEngine',
                message: data.notification.message
              }
            },
            ...prev
          ]);
        }
      } catch (err) {
        console.error('Failed parsing workflow event:', err);
      }
    };

    return () => {
      unsubEvents();
      unsubWorkflow();
      eventSource.close();
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      if (playbackSubIntervalRef.current) clearInterval(playbackSubIntervalRef.current);
    };
  }, []);

  const selectScenario = (idx: number) => {
    const scenario = patientScenarios.scenarios[idx];
    setQuery(scenario.query);
    setPatientId(scenario.patientId);
  };

  const handleTriggerDemo = async (scenario: string) => {
    setIsRunning(true);
    setEvents([]);
    setWorkflowState({
      requestId: '',
      activeStep: 'Intake',
      status: 'RUNNING',
      completedSteps: []
    });

    try {
      const res = await fetch(`http://localhost:3001/api/demo/${scenario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (!data.success) {
        setIsRunning(false);
      }
    } catch (err) {
      console.error('Failed to trigger demo:', err);
      setIsRunning(false);
    }
  };

  const handleRunPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setIsInspectorOpen(false);

    try {
      const result = await MedXEngine.processRequest(patientId, query, mode);
      if (result.success) {
        startSequentialPlayback(query, result.finalContext);
      } else {
        toastManager.addToast('Pipeline execution failed.', 'error');
      }
    } catch (err) {
      console.error('Error executing pipeline in Playground:', err);
      toastManager.addToast('Failed executing pipeline.', 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const getRiskBadgeVariant = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'danger';
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      default: return 'success';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      <PageHeader
        title="AI Workflow Monitor"
        description="Real-time execution telemetry and decision explainability panel."
      />

      {/* Live Pipeline Animation */}
      <Card title="Live Pipeline Observability Node Stream">
        <PipelineAnimator
          activeStep={workflowState.activeStep}
          completedSteps={workflowState.completedSteps}
          status={workflowState.status}
        />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: AI Playground */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="🤖 AI Clinical Playground Console">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Select Scenario Template
                </label>
                <select
                  onChange={(e) => selectScenario(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px'
                  }}
                  disabled={isRunning}
                >
                  {patientScenarios.scenarios.map((sc, idx) => (
                    <option key={idx} value={idx}>
                      {sc.patientId} - {sc.query.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Custom Intake Query
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    resize: 'none'
                  }}
                  disabled={isRunning}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Patient ID
                  </label>
                  <input
                    type="text"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px'
                    }}
                    disabled={isRunning}
                  />
                </div>

                <div style={{ width: '130px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                    Execution Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'Mock' | 'Production')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                    disabled={isRunning}
                  >
                    <option value="Mock">Mock Mode</option>
                    <option value="Production">Production</option>
                  </select>
                </div>

                <div>
                  <Button
                    variant="primary"
                    onClick={handleRunPipeline}
                    disabled={isRunning}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Play size={16} />
                      {isRunning ? 'Running...' : 'Run Pipeline'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="🎬 MedX Operating System: Presentation & Demo Console">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <Button
                variant="primary"
                onClick={handleStartLiveDemo}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor: '#8B5CF6',
                  boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                🚀 Start Live Presentation Demo Mode
              </Button>

              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Trigger end-to-end clinical workflow simulations. This executes agents, updates SQLite, reserves inventory, and dispatches riders live across all stakeholder dashboards.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('chest-pain')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', fontSize: '11px', padding: '8px' }}
                >
                  ❤️ Chest Pain (ECE-1)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('high-fever')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', fontSize: '11px', padding: '8px' }}
                >
                  🌡️ High Fever (ECE-2)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('snake-bite')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(139, 92, 246, 0.4)', color: '#a78bfa', fontSize: '11px', padding: '8px' }}
                >
                  🐍 Snake Bite (ECE-2)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('blood')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(59, 130, 246, 0.4)', color: '#3b82f6', fontSize: '11px', padding: '8px' }}
                >
                  🩸 Blood Request (O-)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('asthma-attack')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(6, 182, 212, 0.4)', color: '#06b6d4', fontSize: '11px', padding: '8px' }}
                >
                  🫁 Asthma Attack (ECE-1)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('insulin')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(245, 158, 11, 0.4)', color: '#f59e0b', fontSize: '11px', padding: '8px' }}
                >
                  🔄 Insulin Refill (Warn)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('road-accident')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', fontSize: '11px', padding: '8px' }}
                >
                  🚗 Road Accident (ECE-1)
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleTriggerDemo('out-of-stock')}
                  disabled={isRunning}
                  style={{ border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', fontSize: '11px', padding: '8px' }}
                >
                  ⚠️ Medicine Stockout
                </Button>
              </div>
            </div>
          </Card>

          <Card title="📟 Event Bus Streaming Terminal">
            <EventLogViewer events={events} />
          </Card>
        </div>

        {/* Right Column: Explainability, Telemetry & Playback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Real-time Agent Telemetry Visualizer */}
          <Card title="🩺 MedX AI Multi-Agent Sequential Observability Node Stream">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
              <span className="medx-caption">Total Pipeline Latency: <strong>{totalPipelineTime || 480} ms</strong></span>
              {lastContext && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" onClick={() => startSequentialPlayback(query, lastContext)} style={{ height: '28px', fontSize: '11px' }}>
                    🔄 Replay AI Pipeline
                  </Button>
                  <Button variant="primary" onClick={() => startFullE2EPlayback(query, lastContext)} style={{ height: '28px', fontSize: '11px', backgroundColor: '#8B5CF6' }}>
                    🎥 Replay Full E2E Workflow
                  </Button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {pipelineAgents.map((agent) => {
                const isActive = agent.status === 'Running';
                const isDone = agent.status === 'Completed';
                
                let borderColor = 'var(--color-border)';
                let glowStyle = {};
                if (isActive) {
                  borderColor = '#3b82f6';
                  glowStyle = {
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
                    border: '2px solid #3b82f6'
                  };
                } else if (isDone) {
                  borderColor = '#10b981';
                }

                return (
                  <div
                    key={agent.id}
                    id={`agent-card-${agent.id}`}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: 'rgba(255,255,255,0.01)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      ...glowStyle
                    }}
                  >
                    <div style={{ fontSize: '24px', opacity: isActive || isDone ? 1 : 0.4 }}>{agent.icon}</div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', color: isActive || isDone ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                          {agent.name}
                        </strong>
                        {isDone && <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>✓ Completed</span>}
                        {isActive && (
                          <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'inline-block' }} />
                            Running
                          </span>
                        )}
                        {agent.status === 'Idle' && <span style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Idle</span>}
                      </div>

                      <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: isActive || isDone ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', lineHeight: 1.4 }}>
                        {agent.desc}
                      </p>

                      {isActive && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid rgba(59, 130, 246, 0.2)', paddingLeft: '10px' }}>
                          {(agentSubSteps[agent.id] || []).map((subStep, sIdx) => {
                            const isSubDone = sIdx < activeSubStepIndex;
                            const isSubActive = sIdx === activeSubStepIndex;
                            
                            let subColor = 'var(--color-text-muted)';
                            let bullet = '○';
                            if (isSubDone) {
                              subColor = '#10b981';
                              bullet = '✓';
                            } else if (isSubActive) {
                              subColor = '#3b82f6';
                              bullet = '⏳';
                            }

                            return (
                              <div key={sIdx} style={{ fontSize: '11px', color: subColor, display: 'flex', gap: '6px', alignItems: 'center', transition: 'all 0.2s ease' }}>
                                <span style={{ fontWeight: 'bold' }}>{bullet}</span>
                                <span>{subStep}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {isDone && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '2px solid rgba(16, 185, 129, 0.3)', paddingLeft: '10px' }}>
                          {(agentSubSteps[agent.id] || []).map((subStep, sIdx) => (
                            <div key={sIdx} style={{ fontSize: '11px', color: '#10b981', display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span>✓</span>
                              <span>{subStep.replace('...', '')}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {isDone && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '10.5px', color: 'var(--color-text-secondary)', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '4px' }}>
                          <span>Latency: <strong>{agent.latencyMs} ms</strong></span>
                          <span>Confidence: <strong>{agent.confidence}%</strong></span>
                          <span>Resolved: {agent.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AI Decision Summary Box (visible after decision agent completes) */}
          {activeStepIndex === 8 && lastContext && (
            <Card style={{ borderLeft: '4px solid var(--color-success)', backgroundColor: 'rgba(16, 185, 129, 0.03)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ✓ AI Analysis Completed
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  <div>Overall Fused Confidence: <strong>{lastContext.overallConfidence ? Math.round(lastContext.overallConfidence * 100) : 94}%</strong></div>
                  <div>ECE Level: <strong>ECE-{lastContext.agentOutputs?.find(o => o.agentId === 'ece')?.output?.eceLevel || 1}</strong></div>
                  <div>Nearest Pharmacy: <strong>{lastContext.explainabilityReport?.facilityName || 'Apollo Pharmacy'}</strong></div>
                  <div>Estimated Delivery: <strong>{lastContext.explainabilityReport?.eta || '18 mins'}</strong></div>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px', fontSize: '12px' }}>
                  <strong>Decision Recommendation:</strong> {lastContext.explainabilityReport?.finalRecommendation || 'Approved for Dispatch'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-primary-light)' }}>
                  <strong>Next Step:</strong> Waiting for Pharmacy Confirmation
                </div>
              </div>
            </Card>
          )}

          {/* AI Workflow Timeline */}
          {activeStepIndex >= 0 && (
            <Card title="🕒 Real-Time AI Fused Event Timeline">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '17px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--color-border)', zIndex: 1 }} />
                
                {[
                  { step: 1, label: 'Patient Request Intake Received', time: '0s' },
                  { step: 2, label: 'Gemini NLP Parsing Completed', time: '1.8s' },
                  { step: 3, label: 'Memory Retrieval Context Loaded', time: '3.6s' },
                  { step: 4, label: 'ECE Severity Level Assigned', time: '5.4s' },
                  { step: 5, label: 'Optimal Facility Selected (GIS)', time: '7.2s' },
                  { step: 6, label: 'Pharmacy Inventory Stock Reserved', time: '9.0s' },
                  { step: 7, label: 'Rider Logistics Routing Allocated', time: '10.8s' },
                  { step: 8, label: 'Decision Summary Fused & Dispatched', time: '12.6s' }
                ].map((item) => {
                  const isPassed = activeStepIndex >= item.step;
                  const isCurrent = activeStepIndex === item.step - 1;
                  
                  let dotColor = 'var(--color-border)';
                  let textColor = 'var(--color-text-muted)';
                  let glow = {};
                  
                  if (isPassed) {
                    dotColor = '#10b981';
                    textColor = 'var(--color-text-primary)';
                  } else if (isCurrent) {
                    dotColor = '#3b82f6';
                    textColor = 'var(--color-text-primary)';
                    glow = { boxShadow: '0 0 8px #3b82f6', border: '2px solid #3b82f6' };
                  }

                  return (
                    <div key={item.step} style={{ display: 'flex', gap: '16px', alignItems: 'center', zIndex: 2 }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        transition: 'all 0.3s ease',
                        marginLeft: '12px',
                        ...glow
                      }} />
                      <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between', fontSize: '12.5px', color: textColor, fontWeight: isCurrent ? 600 : 400 }}>
                        <span>{item.label}</span>
                        <span className="medx-caption" style={{ fontSize: '11px' }}>{item.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Explainability Timeline & Report (always visible if lastContext has it) */}
          {lastContext && lastContext.explainabilityReport ? (
            <>
            <Card title="🔍 Decision Intelligence & XAI Report">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Headers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Risk Assessment</span>
                    <div style={{ marginTop: '4px' }}>
                      <Badge variant={getRiskBadgeVariant(lastContext.riskLevel)}>
                        {lastContext.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Human Review</span>
                    <div style={{ marginTop: '4px' }}>
                      <Badge variant={lastContext.humanReviewStatus?.requiresReview ? 'danger' : 'success'}>
                        {lastContext.humanReviewStatus?.requiresReview ? 'REQUIRED' : 'APPROVED'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Patient explanation */}
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px dashed var(--color-success)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'var(--color-success-light)'
                  }}
                >
                  <strong>Patient Message:</strong> "{lastContext.explainabilityReport.patientFriendlyExplanation}"
                </div>

                {/* Technical recommendation */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>
                    Technical Execution Summary
                  </span>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    {lastContext.explainabilityReport.finalRecommendation}
                  </p>
                </div>

                {/* Gauges breakdown */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '8px' }}>
                    Confidence Breakdown per Agent
                  </span>
                  {Object.entries(lastContext.explainabilityReport.confidenceBreakdown).map(([agent, val]) => (
                    <ConfidenceGauge key={agent} label={agent.toUpperCase()} value={Number(val)} />
                  ))}
                </div>

                {/* Open inspection button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={16} />
                      {isInspectorOpen ? 'Hide Trace Logs' : 'Inspect Trace Logs'}
                    </span>
                  </Button>
                </div>

              </div>
            </Card>

            <Card title="🌐 GIS Routing Agent Calculations (Live)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="medx-caption">Routed Facility</span>
                  <strong>{lastContext.explainabilityReport?.facilityName || 'Care Pharmacy Store'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="medx-caption">Calculated Transit ETA</span>
                  <strong>{lastContext.explainabilityReport?.eta || '7 mins'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="medx-caption">Routing Algorithm</span>
                  <strong>Dijkstra (Shortest-Path Bypass)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="medx-caption">Nearest Depot Coordinates</span>
                  <strong>34.0410° N, 118.2512° W</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '6px' }}>
                  <span className="medx-caption">Facility Coordinates</span>
                  <strong>34.0522° N, 118.2437° W</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="medx-caption">Patient Coordinates</span>
                  <strong>34.0612° N, 118.2325° W</strong>
                </div>
              </div>
            </Card>
            </>
          ) : (
            <Card shadow="sm">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <HelpCircle size={44} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <h4 style={{ margin: 0, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Waiting for Pipeline Execution</h4>
                <p style={{ margin: 0, fontSize: '12px', maxWidth: '300px' }}>
                  Select a clinical query template in the playground and click "Run Pipeline" to visualize execution telemetry.
                </p>
              </div>
            </Card>
          )}

          {/* Collapsible Inspection Drawer (Request Inspector Debugger) */}
          {isInspectorOpen && lastContext && (
            <Card title="🛠 Decision Trace Inspector (Debugger)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Real AI Integration Diagnostic stats */}
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--color-primary-light)' }}>
                    📡 External Intelligence Telemetry
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                    <div>
                      <strong style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Retrieved Patient Memory:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '11.5px', lineHeight: '1.4' }}>
                        {lastContext.metadata?.memorySummary || 'No memory context retrieved.'}
                      </p>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                        Provider: {lastContext.metadata?.memoryProvider || 'Database Fallback'}
                      </span>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--color-text-secondary)', display: 'block' }}>GIS Route Solver:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-muted)', fontSize: '11.5px', lineHeight: '1.4' }}>
                        Routed using: <strong>{lastContext.agentOutputs?.find((o: any) => o.agentId === 'gis')?.output.provider || 'Mock'}</strong>
                      </p>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', opacity: 0.7, display: 'block', marginTop: '4px' }}>
                        Distance calculated: {lastContext.agentOutputs?.find((o: any) => o.agentId === 'gis')?.output.distance || '0 km'}
                      </span>
                    </div>
                  </div>

                  {lastContext.metadata?.mode === 'Production' && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                      <strong style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                        Raw Gemini Parsed Attributes JSON:
                      </strong>
                      <pre style={{
                        margin: 0,
                        padding: '10px',
                        borderRadius: '6px',
                        backgroundColor: 'black',
                        color: '#a9b1d6',
                        fontSize: '11px',
                        overflowX: 'auto',
                        fontFamily: 'monospace',
                        lineHeight: '1.4'
                      }}>
                        {JSON.stringify({
                          symptoms: lastContext.agentOutputs?.find((o: any) => o.agentId === 'triage')?.output.symptoms,
                          medicines: lastContext.agentOutputs?.find((o: any) => o.agentId === 'triage')?.output.medicines,
                          detectedBloodGroup: lastContext.agentOutputs?.find((o: any) => o.agentId === 'triage')?.output.detectedBloodGroup,
                          urgency: lastContext.agentOutputs?.find((o: any) => o.agentId === 'triage')?.output.urgencyKeywords?.[0] || 'Non-Urgent'
                        }, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Step Trace Mappings */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '12px' }}>
                    Agent Execution Sequence Traces
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {lastContext.decisionTrace?.map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderLeft: '3px solid var(--color-primary)',
                          paddingLeft: '12px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid rgba(255,255,255,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: 'var(--color-text-primary)' }}>
                            {step.agentId.toUpperCase()}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            Confidence: {step.confidence}%
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {step.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Card>
          )}
        </div>

      </div>

      <div style={{ marginTop: '24px' }}>
        <Card title="🛠 Live Operational Orders Command Queue">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Tabs Filter */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', overflowX: 'auto' }}>
              {(['All', 'Pharmacy', 'Hospital', 'Blood', 'Deliveries'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setOrderFilter(tab)}
                  className={`medx-button ${orderFilter === tab ? 'medx-button-primary' : 'medx-button-ghost'}`}
                  style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
                >
                  {tab === 'All' ? 'All Queue' : tab === 'Blood' ? '🩸 Blood Requests' : tab === 'Hospital' ? '🏥 Hospital (ECE-1/2)' : tab === 'Deliveries' ? '🚚 Active Deliveries' : '💊 Pharmacy Orders'}
                </button>
              ))}
            </div>

            {/* Table list */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Order ID</th>
                    <th style={{ padding: '8px' }}>Origin</th>
                    <th style={{ padding: '8px' }}>Resource Type</th>
                    <th style={{ padding: '8px' }}>Medication / Packs</th>
                    <th style={{ padding: '8px' }}>Stage</th>
                    <th style={{ padding: '8px' }}>Assigned Facility</th>
                    <th style={{ padding: '8px' }}>Rider</th>
                    <th style={{ padding: '8px' }}>ETA</th>
                    <th style={{ padding: '8px' }}>Override Status</th>
                    <th style={{ padding: '8px' }}>Force Reassign</th>
                    <th style={{ padding: '8px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders
                    .filter(o => {
                      const medStr = o.medicine || '';
                      const isBlood = medStr.toLowerCase().includes('blood') || medStr === 'O-' || medStr === 'O Negative' || medStr === 'A+' || medStr === 'B+' || medStr === 'AB-';
                      if (orderFilter === 'Pharmacy') return !isBlood;
                      if (orderFilter === 'Hospital') return o.request_source === 'Hospital';
                      if (orderFilter === 'Blood') return isBlood;
                      if (orderFilter === 'Deliveries') return ['Preparing Dispatch', 'Reached Store', 'Out for Delivery', 'Reached Customer'].includes(o.status || '');
                      return true;
                    })
                    .map(o => {
                      return (
                        <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px' }}><strong>{o.id}</strong></td>
                          <td style={{ padding: '8px' }}>
                            <Badge variant={o.request_source === 'Hospital' ? 'success' : 'info'}>
                              {o.request_source || 'Patient'}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <Badge variant={o.request_type === 'Blood' ? 'danger' : o.request_type === 'Combined' ? 'warning' : 'info'}>
                              {o.request_type || 'Medicine'}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px' }}>{o.medicine} (x{o.quantity})</td>
                          <td style={{ padding: '8px' }}>
                            <Badge variant={o.status === 'Delivered' ? 'success' : o.status === 'Cancelled' || o.status === 'Rejected' ? 'danger' : 'warning'}>
                              {o.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px' }}>{o.assigned_pharmacy || 'Unassigned'}</td>
                          <td style={{ padding: '8px' }}>{o.assigned_rider || 'Unassigned'}</td>
                          <td style={{ padding: '8px' }}>{o.eta || '15 mins'}</td>
                          <td style={{ padding: '8px' }}>
                            <select
                              value={o.status}
                              onChange={(e) => triggerOverrideStatus(o.id, e.target.value)}
                              style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-primary)', fontSize: '11px' }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Approved">Approved</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Ready">Ready</option>
                              <option value="Preparing Dispatch">Preparing Dispatch</option>
                              <option value="Reached Store">Reached Store</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Reached Customer">Reached Customer</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <input
                                type="text"
                                placeholder="Pharmacy"
                                defaultValue={o.assigned_pharmacy || ''}
                                id={`ph-${o.id}`}
                                style={{ width: '80px', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }}
                              />
                              <input
                                type="text"
                                placeholder="Rider"
                                defaultValue={o.assigned_rider || ''}
                                id={`rd-${o.id}`}
                                style={{ width: '80px', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text-primary)' }}
                              />
                              <Button
                                variant="secondary"
                                style={{ height: '24px', padding: '0 6px', fontSize: '10px' }}
                                onClick={() => {
                                  const phVal = (document.getElementById(`ph-${o.id}`) as HTMLInputElement)?.value;
                                  const rdVal = (document.getElementById(`rd-${o.id}`) as HTMLInputElement)?.value;
                                  triggerForceReassign(o.id, phVal, rdVal);
                                }}
                              >
                                Go
                              </Button>
                            </div>
                          </td>
                          <td style={{ padding: '8px' }}>
                            {o.status !== 'Cancelled' && o.status !== 'Delivered' && (
                              <Button
                                variant="danger"
                                style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                                onClick={() => triggerCancelOrder(o.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

          </div>
        </Card>
      </div>
    </div>
  );
};
export default WorkflowMonitor;
