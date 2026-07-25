import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useToast } from '../../hooks/useToast';

interface PatientOrder {
  id: string;
  medicine: string;
  quantity: number;
  status: string;
  assigned_pharmacy?: string;
  assigned_rider?: string;
  eta?: string;
  ece_level: number;
  created_at: number;
}

export const LiveTracking: React.FC = () => {
  const toastManager = useToast();
  const [orders, setOrders] = useState<PatientOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [deliveryMode, setDeliveryMode] = useState<'Rider' | 'Ambulance' | 'Drone'>('Rider');
  const [animationProgress, setAnimationProgress] = useState<number>(0);

  // Load orders
  const fetchOrders = async () => {
    try {
      const session = localStorage.getItem('medx_session');
      let patientId = 'PAT-001';
      if (session) {
        try {
          const parsed = JSON.parse(session);
          patientId = parsed.associatedId || 'PAT-001';
        } catch (e) {}
      }

      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        const userOrders = data.orders.filter((o: any) => o.patient_id === patientId);
        setOrders(userOrders);
        setSelectedOrderId(prev => {
          if (!prev || !userOrders.some((o: any) => o.id === prev)) {
            return userOrders.length > 0 ? userOrders[0].id : '';
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to load tracking orders:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = data.event || data;
        if (payload.orderId || payload.requestId) {
          setSelectedOrderId(payload.orderId || payload.requestId);
        }
      } catch (e) {}
      fetchOrders();
    };
    return () => eventSource.close();
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // Synchronize deliveryMode with the selected order's assigned_rider
  useEffect(() => {
    if (!selectedOrder) return;
    const rider = selectedOrder.assigned_rider || '';
    if (rider.toLowerCase().includes('drone')) {
      setDeliveryMode('Drone');
    } else if (rider.toLowerCase().includes('ambulance')) {
      setDeliveryMode('Ambulance');
    } else {
      setDeliveryMode('Rider');
    }
  }, [selectedOrder]);

  // Auto-progress animation based on order status
  useEffect(() => {
    if (!selectedOrder) return;
    
    const status = selectedOrder.status;
    let targetProgress = 0.05; // Placed / Under review

    if (['Approved', 'Preparing', 'Ready', 'Under Review', 'PHARMACY_REVIEW', 'APPROVED', 'INVENTORY_RESERVED'].includes(status)) {
      targetProgress = 0.25; // Preparing at Pharmacy
    } else if (['Dispatched', 'Out for Delivery', 'Preparing Dispatch', 'Reached Store', 'DISPATCH_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(status)) {
      targetProgress = 0.65; // In transit
    } else if (['Reached Customer', 'Delivered', 'COMPLETED', 'DELIVERED'].includes(status)) {
      targetProgress = 1.0; // Arrived
    }

    setAnimationProgress(targetProgress);
  }, [selectedOrder]);

  // Adjust ETA based on delivery mode
  const getCalculatedETA = () => {
    if (!selectedOrder) return 'N/A';
    if (selectedOrder.status === 'Delivered' || selectedOrder.status === 'COMPLETED') return 'Delivered';

    switch (deliveryMode) {
      case 'Drone':
        return '3 mins (Express Air)';
      case 'Ambulance':
        return '6 mins (Emergency Priority)';
      case 'Rider':
      default:
        return selectedOrder.eta || '12 mins';
    }
  };

  // Coordinates
  const startX = 80;
  const startY = 240;
  const endX = 420;
  const endY = 80;

  // Current marker position based on progress
  const currentX = startX + (endX - startX) * animationProgress;
  const currentY = startY + (endY - startY) * animationProgress;

  const getModeIcon = () => {
    switch (deliveryMode) {
      case 'Drone':
        return '🚁';
      case 'Ambulance':
        return '🚑';
      case 'Rider':
      default:
        return '🏍️';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="🛰️ Live Order Dispatch & GIS Tracking"
        description="Monitor active medical deliveries and ambulance routing streams in real time."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        {/* Left Column: Interactive GIS Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="🗺️ Live Dispatch Map (GIS Fused Mode)">
            {/* SVG Interactive Canvas Map */}
            <div style={{ position: 'relative', width: '100%', height: '320px', backgroundColor: '#0B0F19', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              
              <svg width="100%" height="100%" viewBox="0 0 500 320" style={{ display: 'block' }}>
                {/* Grid Gridlines for GIS HUD style */}
                <defs>
                  <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Stylized city streets blueprint */}
                <path d="M 30,50 L 470,50 M 30,120 L 470,120 M 30,200 L 470,200 M 30,270 L 470,270" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
                <path d="M 80,30 L 80,290 M 200,30 L 200,290 M 320,30 L 320,290 M 420,30 L 420,290" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />

                {/* Route Path line from store to patient */}
                <line 
                  x1={startX} 
                  y1={startY} 
                  x2={endX} 
                  y2={endY} 
                  stroke={deliveryMode === 'Ambulance' ? 'var(--color-warning)' : 'var(--color-primary)'} 
                  strokeWidth="3" 
                  strokeDasharray="6,4"
                />

                {/* Facility Node Pin */}
                <circle cx={startX} cy={startY} r="18" fill="rgba(37, 99, 235, 0.15)" stroke="var(--color-primary)" strokeWidth="2" />
                <text x={startX} y={startY + 4} textAnchor="middle" fontSize="11" fill="white">🏥</text>
                <text x={startX - 10} y={startY + 30} fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">Store Depot</text>

                {/* Patient Node Pin */}
                <circle cx={endX} cy={endY} r="18" fill="rgba(16, 185, 129, 0.15)" stroke="var(--color-success)" strokeWidth="2" />
                <text x={endX} y={endY + 4} textAnchor="middle" fontSize="11" fill="white">🏠</text>
                <text x={endX - 10} y={endY - 20} fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">You (Patient)</text>

                {/* Live Animating Rider Marker */}
                <g transform={`translate(${currentX - 14}, ${currentY - 14})`}>
                  <circle cx="14" cy="14" r="14" fill={deliveryMode === 'Ambulance' ? 'var(--color-warning)' : 'var(--color-primary)'} style={{ boxShadow: '0 0 10px var(--color-primary)' }} />
                  <text x="14" y="19" textAnchor="middle" fontSize="13">{getModeIcon()}</text>
                </g>
              </svg>

              {/* HUD overlay labels with calculations */}
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '10px 16px', borderRadius: '8px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
                <div>🛰️ <strong>GIS Telemetry</strong></div>
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                <div>Vehicle: <strong>{getModeIcon()} {deliveryMode}</strong></div>
                <div>Position: <strong>{(34.0522 + (34.0612 - 34.0522) * animationProgress).toFixed(4)}° N, {(118.2437 + (118.2325 - 118.2437) * animationProgress).toFixed(4)}° W</strong></div>
                <div>Destination: <strong>34.0612° N, 118.2325° W</strong></div>
                <div>Distance: <strong>{(2500 * (1 - animationProgress)).toFixed(0)} meters</strong></div>
                <div>ETA: <strong style={{ color: 'var(--color-primary)' }}>{getCalculatedETA()}</strong></div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Order Details & Live Timeline Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Order selection */}
          <Card title="📦 Active Tracking Target">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Select order to track:</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px'
                }}
              >
                {orders.length === 0 && <option value="">No Active Orders</option>}
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} - {o.medicine.substring(0, 24)}... ({o.status})
                  </option>
                ))}
              </select>

              {selectedOrder && (
                <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Order ID:</span>
                    <strong style={{ fontSize: '12px' }}>{selectedOrder.id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Fulfillment:</span>
                    <strong style={{ fontSize: '12px' }}>
                      {selectedOrder.assigned_pharmacy && selectedOrder.assigned_pharmacy !== 'Default Pharmacy' && selectedOrder.assigned_pharmacy !== 'Unassigned'
                        ? selectedOrder.assigned_pharmacy 
                        : 'Awaiting Acceptance'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Rider Assigned:</span>
                    <strong style={{ fontSize: '12px' }}>{selectedOrder.assigned_rider || ' Dave Miller'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Live Transit ETA:</span>
                    <strong style={{ fontSize: '12px', color: 'var(--color-primary)' }}>{getCalculatedETA()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Workflow Severity:</span>
                    <Badge variant={
                      selectedOrder.ece_level === 1 ? 'danger' :
                      selectedOrder.ece_level === 2 ? 'danger' :
                      selectedOrder.ece_level === 3 ? 'warning' :
                      selectedOrder.ece_level === 4 ? 'info' : 'success'
                    }>
                      ECE-{selectedOrder.ece_level} - {
                        selectedOrder.ece_level === 1 ? 'Life Threatening' :
                        selectedOrder.ece_level === 2 ? 'Critical' :
                        selectedOrder.ece_level === 3 ? 'Priority' :
                        selectedOrder.ece_level === 4 ? 'Moderate' : 'Routine'
                      }
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Delivery progress status timeline */}
          <Card title="🚚 Delivery Workflow Milestones">
            {selectedOrder ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '13px', top: '10px', bottom: '10px', width: '2px', backgroundColor: 'var(--color-border)' }} />
                
                {[
                  { key: 'Pending', label: 'Order Registered in SQLite', desc: 'Awaiting AI and Triage confirmation.' },
                  { key: 'Approved', label: 'Pharmacy Confirmed / Under Review', desc: 'Prescription valid, stock allocated.' },
                  { key: 'Preparing', label: 'Inventory Reserved / Preparing Pack', desc: 'Care Pharmacy is sealing medicine.' },
                  { key: 'Ready', label: 'Awaiting Rider Pickup', desc: 'Item marked ready in pharmacy panel.' },
                  { key: 'Dispatched', label: 'Out For Delivery (In Transit)', desc: 'Rider is on the way to your address.' },
                  { key: 'Delivered', label: 'Completed & Delivered', desc: 'Handed over. Transaction finalized.' }
                ].map((step, idx) => {
                  const getStepState = () => {
                    const status = selectedOrder.status;
                    
                    const getNormalizedStatus = (s: string): string => {
                      if (['Pending', 'Request Received', 'REQUEST_CREATED', 'AI_ANALYSIS_RUNNING', 'ECE_ASSIGNED', 'FACILITY_IDENTIFIED', 'PHARMACY_PENDING'].includes(s)) return 'Pending';
                      if (['Under Review', 'PHARMACY_REVIEW', 'PHARMACY_ACCEPTED'].includes(s)) return 'Approved';
                      if (['Approved', 'APPROVED'].includes(s)) return 'Approved';
                      if (['Preparing', 'INVENTORY_RESERVED'].includes(s)) return 'Preparing';
                      if (['Ready', 'Preparing Dispatch', 'Reached Store', 'DISPATCH_ASSIGNED', 'PICKED_UP'].includes(s)) return 'Ready';
                      if (['Out for Delivery', 'Reached Customer', 'OUT_FOR_DELIVERY'].includes(s)) return 'Dispatched';
                      if (['Delivered', 'COMPLETED', 'DELIVERED'].includes(s)) return 'Delivered';
                      return 'Pending';
                    };

                    const orderStages = ['Pending', 'Approved', 'Preparing', 'Ready', 'Dispatched', 'Delivered'];
                    const currentIdx = orderStages.indexOf(getNormalizedStatus(status));
                    
                    if (currentIdx >= idx) return 'completed';
                    if (currentIdx === idx - 1) return 'active';
                    return 'pending';
                  };

                  const state = getStepState();
                  
                  let bulletColor = 'var(--color-border)';
                  let textColor = 'var(--color-text-muted)';
                  let bulletText = '○';

                  if (state === 'completed') {
                    bulletColor = '#10b981';
                    textColor = 'var(--color-text-primary)';
                    bulletText = '✓';
                  } else if (state === 'active') {
                    bulletColor = '#3b82f6';
                    textColor = 'var(--color-text-primary)';
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
                        <div style={{ fontSize: '13px', fontWeight: state !== 'pending' ? 600 : 400, color: textColor }}>
                          {step.label}
                        </div>
                        <p className="medx-caption" style={{ fontSize: '11.5px', marginTop: '2px', margin: 0, color: 'var(--color-text-muted)' }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                No active order trace found.
              </div>
            )}
          </Card>
          
        </div>

      </div>
    </div>
  );
};
export default LiveTracking;
