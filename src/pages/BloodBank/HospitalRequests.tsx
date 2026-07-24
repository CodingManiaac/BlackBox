import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Droplet, Clock, Flame } from 'lucide-react';

interface BloodRequisition {
  id: string;
  dbOrderId: string;
  facilityName: string;
  bloodType: string;
  packsNeeded: number;
  priority: 'Immediate' | 'Urgent' | 'Routine';
  status: 'Pending' | 'Approved' | 'Dispatch Ready' | 'Delivered';
  date: string;
}

export const HospitalRequests: React.FC = () => {
  const toastManager = useToast();

  const [requests, setRequests] = useState<BloodRequisition[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Approved' | 'Dispatch Ready' | 'Delivered' | 'Emergency'>('All');

  const fetchRealRequests = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        const mapped: BloodRequisition[] = data.orders
          .filter((o: any) => o.medicine.toLowerCase().includes('blood') || o.medicine === 'O-' || o.medicine === 'O Negative' || o.medicine === 'A+' || o.medicine === 'B+' || o.medicine === 'AB-')
          .map((o: any) => ({
            id: `BRQ-${o.id.substring(4)}`,
            dbOrderId: o.id,
            facilityName: o.assigned_pharmacy || 'Central Red Cross Blood Bank',
            bloodType: o.medicine === 'O Negative' ? 'O-' : o.medicine,
            packsNeeded: o.quantity,
            priority: o.ece_level <= 2 ? 'Immediate' : 'Routine',
            status: o.status === 'Pending' ? 'Pending' : o.status === 'Under Review' || o.status === 'Approved' ? 'Approved' : o.status === 'Preparing' || o.status === 'Ready' || o.status === 'Preparing Dispatch' || o.status === 'Reached Store' ? 'Dispatch Ready' : o.status,
            date: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        
        setRequests(mapped);
      }
    } catch (err) {
      console.error('Failed to load real blood requisitions:', err);
    }
  };

  useEffect(() => {
    fetchRealRequests();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchRealRequests();
    };

    return () => eventSource.close();
  }, []);

  const advanceStatus = async (id: string, next: BloodRequisition['status']) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;

    try {
      const endpoint = next === 'Approved' ? 'accept' : 'reserve-inventory';
      const body = next === 'Approved' ? JSON.stringify({ facilityId: 'FAC-005' }) : null;

      const res = await fetch(`http://localhost:3001/api/workflow/${req.dbOrderId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast(`Requisition state updated.`, 'success');
        fetchRealRequests();
      } else {
        toastManager.addToast(data.message || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      toastManager.addToast('Could not update status on server.', 'error');
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'All') return requests;
    if (activeTab === 'Emergency') return requests.filter(r => r.priority === 'Immediate');
    return requests.filter(r => r.status === activeTab);
  };

  const filtered = getFilteredRequests();

  const getPriorityBadge = (priority: BloodRequisition['priority']) => {
    switch(priority) {
      case 'Immediate':
        return <Badge variant="danger">{priority}</Badge>;
      case 'Urgent':
        return <Badge variant="warning">{priority}</Badge>;
      default:
        return <Badge variant="info">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: BloodRequisition['status']) => {
    switch(status) {
      case 'Delivered':
        return <Badge variant="success">{status}</Badge>;
      case 'Pending':
        return <Badge variant="warning">{status}</Badge>;
      case 'Approved':
        return <Badge variant="info">{status}</Badge>;
      default:
        return <Badge variant="info">Dispatch Ready</Badge>;
    }
  };

  const columns: Column<BloodRequisition>[] = [
    { 
      key: 'id', 
      header: 'Requisition ID', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>{row.id}</strong>
          {row.priority === 'Immediate' && (
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
    { key: 'facilityName', header: 'Facility Target' },
    { 
      key: 'bloodType', 
      header: 'Blood Type', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontWeight: 700 }}>
          <Droplet size={14} />
          {row.bloodType}
        </span>
      )
    },
    { key: 'packsNeeded', header: 'Packs' },
    { 
      key: 'date', 
      header: 'Logged', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="medx-caption">
          <Clock size={12} />
          {row.date}
        </span>
      )
    },
    { key: 'priority', header: 'Priority', render: (row) => getPriorityBadge(row.priority) },
    { key: 'status', header: 'Fulfillment State', render: (row) => getStatusBadge(row.status) },
    {
      key: 'action',
      header: 'Workflow Controls',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'Pending' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px' }}
              onClick={() => advanceStatus(row.id, 'Approved')}
            >
              Approve Request
            </Button>
          )}

          {row.status === 'Approved' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px' }}
              onClick={() => advanceStatus(row.id, 'Dispatch Ready')}
            >
              Assemble & Ready
            </Button>
          )}

          {row.status === 'Dispatch Ready' && (
            <span className="medx-caption" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Awaiting Rider pickup
            </span>
          )}

          {row.status === 'Delivered' && (
            <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              Delivered
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Hospital Requisitions" 
        description="Verify incoming hospital blood orders, authorize supply dispatch, and monitor delivery logistics."
      />

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', overflowX: 'auto' }}>
        {(['All', 'Pending', 'Approved', 'Dispatch Ready', 'Delivered', 'Emergency'] as const).map(tab => {
          const active = activeTab === tab;
          let colorClass = 'medx-button-ghost';
          if (active) colorClass = tab === 'Emergency' ? 'medx-button-danger' : 'medx-button-primary';

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`medx-button ${colorClass}`}
              style={{ height: '36px', fontSize: '13px' }}
            >
              {tab === 'Emergency' && <Flame size={14} style={{ marginRight: '4px' }} />}
              {tab === 'Dispatch Ready' ? 'Ready' : tab}
              <span style={{ 
                marginLeft: '8px', 
                backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: active ? 'white' : 'var(--color-text-secondary)',
                padding: '2px 6px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {tab === 'All' ? requests.length : tab === 'Emergency' ? requests.filter(r => r.priority === 'Immediate').length : requests.filter(r => r.status === tab).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requisitions Queue table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Table 
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          emptyMessage={`No blood requisitions found under tab "${activeTab}"`}
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
export default HospitalRequests;
