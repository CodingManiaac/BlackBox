import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';

interface HospitalRequest {
  id: string;
  medicine: string;
  quantity: number;
  request_type: string;
  status: string;
  assigned_pharmacy?: string;
  assigned_rider?: string;
  eta?: string;
  ece_level: number;
  created_at: number;
  blood_group?: string;
  blood_units?: number;
}

export const ProcurementHistory: React.FC = () => {
  const toastManager = useToast();
  const [requests, setRequests] = useState<HospitalRequest[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<'Rider' | 'Ambulance' | 'Drone'>('Rider');
  const [animationProgress, setAnimationProgress] = useState<number>(0);

  const fetchHospitalRequests = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        // Filter requests originating from Hospital
        const hospReqs = data.orders.filter((o: any) => o.request_source === 'Hospital');
        setRequests(hospReqs);
        if (hospReqs.length > 0 && !selectedOrderId) {
          setSelectedOrderId(hospReqs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load hospital requests:', err);
    }
  };

  useEffect(() => {
    fetchHospitalRequests();
    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchHospitalRequests();
    };
    return () => eventSource.close();
  }, []);

  const selectedOrder = requests.find(o => o.id === selectedOrderId);

  // Sync animation coordinates
  useEffect(() => {
    if (!selectedOrder) return;
    const status = selectedOrder.status;
    let targetProgress = 0.05;

    if (['Approved', 'Preparing', 'Ready', 'Under Review', 'PHARMACY_REVIEW', 'APPROVED', 'INVENTORY_RESERVED'].includes(status)) {
      targetProgress = 0.25;
    } else if (['Dispatched', 'Out for Delivery', 'Preparing Dispatch', 'Reached Store', 'DISPATCH_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(status)) {
      targetProgress = 0.65;
    } else if (['Reached Customer', 'Delivered', 'COMPLETED', 'DELIVERED'].includes(status)) {
      targetProgress = 1.0;
    }

    setAnimationProgress(targetProgress);
  }, [selectedOrder]);

  const getCalculatedETA = () => {
    if (!selectedOrder) return 'N/A';
    if (selectedOrder.status === 'Delivered' || selectedOrder.status === 'COMPLETED') return 'Delivered';

    switch (deliveryMode) {
      case 'Drone':
        return '4 mins (Air Bypass)';
      case 'Ambulance':
        return '8 mins (Emergency Siren)';
      case 'Rider':
      default:
        return selectedOrder.eta || '15 mins';
    }
  };

  // Map coordinates
  const startX = 60;
  const startY = 250;
  const endX = 440;
  const endY = 70;

  const currentX = startX + (endX - startX) * animationProgress;
  const currentY = startY + (endY - startY) * animationProgress;

  const getModeIcon = () => {
    switch (deliveryMode) {
      case 'Drone': return '🚁';
      case 'Ambulance': return '🚑';
      case 'Rider':
      default: return '🏍️';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'COMPLETED':
        return 'success';
      case 'Pending':
      case 'Preparing':
        return 'warning';
      case 'Rejected':
      case 'Cancelled':
        return 'danger';
      default:
        return 'info';
    }
  };

  const columns: Column<HospitalRequest>[] = [
    { key: 'id', header: 'Order ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'request_type', header: 'Resource Class', render: (row) => <Badge variant="info">{row.request_type}</Badge> },
    { key: 'medicine', header: 'Requested Resource details', render: (row) => <span style={{ fontSize: '12px' }}>{row.medicine}</span> },
    { key: 'quantity', header: 'Total Quantity' },
    { key: 'status', header: 'Workflow Stage', render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge> },
    { key: 'eta', header: 'Live ETA', render: (row) => <span>{row.eta || '15 mins'}</span> },
    {
      key: 'action',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
          onClick={() => {
            setSelectedOrderId(row.id);
            toastManager.addToast(`Tracking procurement ID ${row.id}`, 'info');
          }}
        >
          Track Dispatch
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader
        title="🚚 Institutional Procurement Logs & Live Dispatch"
        description="Verify hospital procurement request histories, check active cargo, and track ambulance coordinates."
      />

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Left Side: Interactive map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="🛰️ GIS Dispatch Coordinates Trace">
            
            {/* Delivery mode selection */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginRight: '10px' }}>
                Delivery Vehicle:
              </span>
              <button
                onClick={() => { setDeliveryMode('Rider'); toastManager.addToast('Ground Dispatcher Activated.', 'info'); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: deliveryMode === 'Rider' ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                  color: deliveryMode === 'Rider' ? 'white' : 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🏍️ Road Rider
              </button>
              <button
                onClick={() => { setDeliveryMode('Ambulance'); toastManager.addToast('Emergency Ambulance Assigned.', 'warning'); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: deliveryMode === 'Ambulance' ? 'var(--color-warning)' : 'rgba(255,255,255,0.02)',
                  color: deliveryMode === 'Ambulance' ? '#0F172A' : 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🚑 Ambulance Priority
              </button>
              <button
                onClick={() => { setDeliveryMode('Drone'); toastManager.addToast('Autonomous Quadcopter Launched.', 'success'); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: deliveryMode === 'Drone' ? 'var(--color-success)' : 'rgba(255,255,255,0.02)',
                  color: deliveryMode === 'Drone' ? 'white' : 'var(--color-text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🚁 Drone (Future Air)
              </button>
            </div>

            {/* SVG City Map */}
            <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#0B0F19', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <svg width="100%" height="100%" viewBox="0 0 500 320">
                <defs>
                  <pattern id="hosp-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hosp-grid)" />

                {/* Stylized city grid streets */}
                <path d="M 30,60 L 470,60 M 30,140 L 470,140 M 30,220 L 470,220 M 30,290 L 470,290" stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="none" />
                <path d="M 60,30 L 60,300 M 180,30 L 180,300 M 300,30 L 300,300 M 440,30 L 440,300" stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="none" />

                {/* Route dashed line */}
                <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="6,4" />

                {/* Source Depot Node Pin */}
                <circle cx={startX} cy={startY} r="18" fill="rgba(37, 99, 235, 0.15)" stroke="var(--color-primary)" strokeWidth="2" />
                <text x={startX} y={startY + 4} textAnchor="middle" fontSize="11">🏢</text>
                <text x={startX - 10} y={startY + 30} fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">Depot Facility</text>

                {/* Destination Hospital Node Pin */}
                <circle cx={endX} cy={endY} r="18" fill="rgba(16, 185, 129, 0.15)" stroke="var(--color-success)" strokeWidth="2" />
                <text x={endX} y={endY + 4} textAnchor="middle" fontSize="11">🏥</text>
                <text x={endX - 35} y={endY - 16} fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">Metro General Hospital</text>

                {/* Animated vehicle marker */}
                <g transform={`translate(${currentX - 14}, ${currentY - 14})`}>
                  <circle cx="14" cy="14" r="14" fill="var(--color-primary)" />
                  <text x="14" y="19" textAnchor="middle" fontSize="13">{getModeIcon()}</text>
                </g>
              </svg>
            </div>
          </Card>
        </div>

        {/* Right Side: Active Request Tracker Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="📡 Active Request Details">
            {selectedOrder ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Request ID:</span>
                    <strong>{selectedOrder.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Resource Details:</span>
                    <strong style={{ fontSize: '12px' }}>{selectedOrder.medicine}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Route Source:</span>
                    <strong style={{ fontSize: '12px' }}>{selectedOrder.assigned_pharmacy || 'Apollo Pharmacy'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Transit Vehicle:</span>
                    <strong style={{ fontSize: '12px' }}>{deliveryMode} ({getModeIcon()})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Live Transit ETA:</span>
                    <strong style={{ fontSize: '12px', color: 'var(--color-primary)' }}>{getCalculatedETA()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Triage Priority:</span>
                    <Badge variant={selectedOrder.ece_level <= 2 ? 'danger' : 'info'}>
                      ECE-{selectedOrder.ece_level}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)' }}>
                No active tracking order selected.
              </div>
            )}
          </Card>

          {/* Timeline progress steps */}
          <Card title="📋 Delivery Milestones">
            {selectedOrder ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '13px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--color-border)' }} />
                {[
                  { key: 'Pending', label: 'Procurement Request Registered', desc: 'Awaiting AI priority checks.' },
                  { key: 'Approved', label: 'Pharmacy/BloodBank Confirmed', desc: 'Validating licensing and cold chain flags.' },
                  { key: 'Preparing', label: 'Resource Sealed & Reserved', desc: 'Items locked in local inventory shelves.' },
                  { key: 'Ready', label: 'Rider Pickup Pending', desc: 'Marked ready in depot fulfillment console.' },
                  { key: 'Dispatched', label: 'Out for Delivery (In Transit)', desc: 'Rider/Ambulance dispatched on route.' },
                  { key: 'Delivered', label: 'Delivered to ER/ICU Wards', desc: 'Procurement transaction archived.' }
                ].map((step, idx) => {
                  const getStepState = () => {
                    const status = selectedOrder.status;
                    const orderStages = ['Pending', 'Approved', 'Preparing', 'Ready', 'Dispatched', 'Delivered'];
                    const currentIdx = orderStages.indexOf(status === 'Out for Delivery' ? 'Dispatched' : status === 'COMPLETED' ? 'Delivered' : status);
                    if (currentIdx >= idx) return 'completed';
                    if (currentIdx === idx - 1) return 'active';
                    return 'pending';
                  };
                  const state = getStepState();
                  let bulletColor = 'var(--color-border)';
                  let bulletText = '○';

                  if (state === 'completed') {
                    bulletColor = '#10b981';
                    bulletText = '✓';
                  } else if (state === 'active') {
                    bulletColor = '#3b82f6';
                    bulletText = '⏳';
                  }

                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', zIndex: 2 }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: state === 'completed' ? '#10b981' : state === 'active' ? '#3b82f6' : 'var(--color-surface)',
                        border: `2px solid ${bulletColor}`,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {bulletText}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: state !== 'pending' ? 600 : 400, color: state !== 'pending' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                          {step.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)' }}>
                No active milestones tracker.
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* Bottom Row: Full Procurement Log History */}
      <Card title="📑 Complete Procurement Transaction History">
        <Table
          columns={columns}
          data={requests}
          keyExtractor={(row) => row.id}
        />
      </Card>
    </div>
  );
};
export default ProcurementHistory;
