import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Flame, Clock } from 'lucide-react';

interface LogisticsDelivery {
  id: string; // DSP-XXXX
  realOrderId: string; // REQ-XXXX
  destination: string;
  type: 'Drone' | 'Ground Courier';
  payload: string;
  status: 'Ready' | 'Preparing Dispatch' | 'Reached Store' | 'Out for Delivery' | 'Reached Customer' | 'Delivered' | 'Failed';
  priority: 'Emergency SOS' | 'Routine';
  eta: string;
}

export const Deliveries: React.FC = () => {
  const toastManager = useToast();
  const [deliveries, setDeliveries] = useState<LogisticsDelivery[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Ready' | 'Preparing Dispatch' | 'Reached Store' | 'Out for Delivery' | 'Reached Customer' | 'Delivered' | 'Emergency'>('All');

  const fetchRealDeliveries = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        // Map database orders to LogisticsDelivery
        const mapped: LogisticsDelivery[] = data.orders.map((o: any) => ({
          id: `DSP-${o.id.substring(4)}`,
          realOrderId: o.id,
          destination: o.assigned_pharmacy || 'Default Pharmacy',
          type: o.ece_level <= 2 ? 'Drone' : 'Ground Courier',
          payload: `${o.medicine} (Qty: ${o.quantity})`,
          status: o.status,
          priority: o.ece_level <= 2 ? 'Emergency SOS' : 'Routine',
          eta: o.eta || 'Pending'
        }));
        
        setDeliveries(mapped);
      }
    } catch (err) {
      console.error('Failed to load real logistics deliveries:', err);
    }
  };

  useEffect(() => {
    fetchRealDeliveries();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchRealDeliveries();
    };

    return () => eventSource.close();
  }, []);

  const advanceDeliveryStatus = async (realOrderId: string, action: 'dispatch' | 'reached-store' | 'ship' | 'reached-customer' | 'complete') => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflow/${realOrderId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'dispatch' ? JSON.stringify({ riderId: 'RD-001' }) : null
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast(`Workflow progressed successfully.`, 'success');
        fetchRealDeliveries();
      } else {
        toastManager.addToast(data.message || 'Workflow transition failed.', 'error');
      }
    } catch (err) {
      console.error('[Logistics] Progress failed:', err);
      toastManager.addToast('Failed to connect to workflow engine.', 'error');
    }
  };

  const getFilteredDeliveries = () => {
    if (activeTab === 'All') return deliveries;
    if (activeTab === 'Emergency') return deliveries.filter(d => d.priority === 'Emergency SOS');
    return deliveries.filter(d => d.status === activeTab);
  };

  const filtered = getFilteredDeliveries();

  const getPriorityBadge = (priority: LogisticsDelivery['priority']) => {
    switch(priority) {
      case 'Emergency SOS':
        return <Badge variant="danger">{priority}</Badge>;
      default:
        return <Badge variant="info">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: LogisticsDelivery['status']) => {
    switch(status) {
      case 'Delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'Ready':
        return <Badge variant="warning">Ready for Pickup</Badge>;
      case 'Preparing Dispatch':
        return <Badge variant="warning">Rider Assigned</Badge>;
      case 'Reached Store':
        return <Badge variant="info">At Pharmacy</Badge>;
      case 'Out for Delivery':
        return <Badge variant="warning">Out for Delivery</Badge>;
      case 'Reached Customer':
        return <Badge variant="info">At Customer</Badge>;
      case 'Failed':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const columns: Column<LogisticsDelivery>[] = [
    { 
      key: 'id', 
      header: 'Dispatch ID', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>{row.id}</strong>
          {row.priority === 'Emergency SOS' && (
            <span style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--color-danger)', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              fontSize: '10px', 
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              animation: 'blink 1.2s infinite alternate'
            }}>
              <Flame size={10} />
              SOS
            </span>
          )}
        </div>
      )
    },
    { key: 'destination', header: 'Pharmacy Location' },
    { key: 'type', header: 'Vehicle Class' },
    { key: 'payload', header: 'Payload Cargo' },
    { 
      key: 'eta', 
      header: 'ETA Timer', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="medx-caption">
          <Clock size={12} />
          {row.eta}
        </span>
      )
    },
    { key: 'priority', header: 'Priority', render: (row) => getPriorityBadge(row.priority) },
    { key: 'status', header: 'Workflow Stage', render: (row) => getStatusBadge(row.status) },
    {
      key: 'action',
      header: 'Fulfillment Controls',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'Ready' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px' }}
              onClick={() => advanceDeliveryStatus(row.realOrderId, 'dispatch')}
            >
              Assign Rider
            </Button>
          )}

          {row.status === 'Preparing Dispatch' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px' }}
              onClick={() => advanceDeliveryStatus(row.realOrderId, 'reached-store')}
            >
              Mark Reached Pharmacy
            </Button>
          )}

          {row.status === 'Reached Store' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px' }}
              onClick={() => advanceDeliveryStatus(row.realOrderId, 'ship')}
            >
              Mark Out for Delivery
            </Button>
          )}

          {row.status === 'Out for Delivery' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px' }}
              onClick={() => advanceDeliveryStatus(row.realOrderId, 'reached-customer')}
            >
              Mark Reached Customer
            </Button>
          )}

          {row.status === 'Reached Customer' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px', backgroundColor: '#10B981' }}
              onClick={() => advanceDeliveryStatus(row.realOrderId, 'complete')}
            >
              Confirm Handover (Delivered)
            </Button>
          )}

          {row.status === 'Delivered' && (
            <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              Handed Over
            </span>
          )}

          {row.status === 'Failed' && (
            <span className="medx-caption" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
              Failed
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Deliveries Management" 
        description="Fulfill ground dispatch logs, track Swiggy/Zomato rider milestones, and monitor cargo payloads."
      />

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', overflowX: 'auto' }}>
        {(['All', 'Ready', 'Preparing Dispatch', 'Reached Store', 'Out for Delivery', 'Reached Customer', 'Delivered', 'Emergency'] as const).map(tab => {
          const active = activeTab === tab;
          let colorClass = 'medx-button-ghost';
          if (active) colorClass = tab === 'Emergency' ? 'medx-button-danger' : 'medx-button-primary';

          let tabLabel = tab as string;
          if (tab === 'Ready') tabLabel = 'Ready for Pickup';
          if (tab === 'Preparing Dispatch') tabLabel = 'Rider Assigned';
          if (tab === 'Reached Store') tabLabel = 'At Pharmacy';
          if (tab === 'Out for Delivery') tabLabel = 'Out for Delivery';
          if (tab === 'Reached Customer') tabLabel = 'At Customer';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`medx-button ${colorClass}`}
              style={{ height: '36px', fontSize: '13px' }}
            >
              {tab === 'Emergency' && <Flame size={14} style={{ marginRight: '4px' }} />}
              {tabLabel}
              <span style={{ 
                marginLeft: '8px', 
                backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: active ? 'white' : 'var(--color-text-secondary)',
                padding: '2px 6px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {tab === 'All' ? deliveries.length : tab === 'Emergency' ? deliveries.filter(d => d.priority === 'Emergency SOS').length : deliveries.filter(d => d.status === tab).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Deliveries Queue table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Table 
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          emptyMessage={`No deliveries found under tab "${activeTab}"`}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `}} />

    </div>
  );
};
export default Deliveries;
