import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Flame, Clock } from 'lucide-react';

interface PharmacyOrder {
  id: string;
  patient: string;
  medication: string;
  date: string;
  status: string;
  emergency: boolean;
  cost: number;
}

export const Orders: React.FC = () => {
  const toastManager = useToast();
  const [orders, setOrders] = useState<PharmacyOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Preparing' | 'Ready' | 'Out for Delivery' | 'Emergency'>('All');

  const fetchRealOrders = async () => {
    try {
      const session = localStorage.getItem('medx_session');
      let currentPharmacyName = 'Care Pharmacy';
      if (session) {
        try {
          const parsed = JSON.parse(session);
          currentPharmacyName = parsed.name || 'Care Pharmacy';
        } catch (e) {}
      }

      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        const filtered = data.orders.filter((o: any) => {
          if (o.request_type === 'Blood') return false;
          const assigned = o.assigned_pharmacy || 'Unassigned';
          const isUnassigned = assigned === 'Unassigned' || assigned === 'Default Pharmacy';
          
          if (isUnassigned) {
            return o.status === 'Pending';
          } else {
            return assigned === currentPharmacyName;
          }
        });

        const mapped: PharmacyOrder[] = filtered.map((o: any) => ({
          id: o.id,
          patient: `Patient (${o.patient_id})`,
          medication: `${o.medicine} (Qty: ${o.quantity})`,
          date: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: o.status === 'Pending' ? 'New' : o.status,
          emergency: o.ece_level <= 2,
          cost: o.total_amount || 30.00
        }));
        
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Failed to load real pharmacy orders:', err);
    }
  };

  useEffect(() => {
    fetchRealOrders();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchRealOrders();
    };

    return () => eventSource.close();
  }, []);

  const getFilteredOrders = () => {
    if (activeTab === 'All') return orders;
    if (activeTab === 'Emergency') return orders.filter(o => o.emergency);
    if (activeTab === 'Out for Delivery') {
      return orders.filter(o => ['Preparing Dispatch', 'Reached Store', 'Out for Delivery', 'Reached Customer'].includes(o.status));
    }
    return orders.filter(o => o.status === activeTab);
  };

  const filteredOrders = getFilteredOrders();

  const getStatusBadge = (status: PharmacyOrder['status']) => {
    switch(status) {
      case 'Delivered':
        return <Badge variant="success">Completed</Badge>;
      case 'New':
        return <Badge variant="warning">New Order</Badge>;
      case 'Under Review':
        return <Badge variant="info">Under Rx Review</Badge>;
      case 'Approved':
        return <Badge variant="success">Approved</Badge>;
      case 'Preparing':
        return <Badge variant="warning">Preparing</Badge>;
      case 'Ready':
        return <Badge variant="info">Ready for Pickup</Badge>;
      case 'Preparing Dispatch':
        return <Badge variant="info">Rider Assigned</Badge>;
      case 'Reached Store':
        return <Badge variant="info">Rider at Pharmacy</Badge>;
      case 'Out for Delivery':
        return <Badge variant="warning">In Transit</Badge>;
      case 'Reached Customer':
        return <Badge variant="info">Rider at Customer</Badge>;
      case 'Cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'Rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'Out of Stock':
        return <Badge variant="danger">Out of Stock</Badge>;
      case 'Manual Review':
        return <Badge variant="warning">Manual Review</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const columns: Column<PharmacyOrder>[] = [
    { 
      key: 'id', 
      header: 'Order ID', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong>{row.id}</strong>
          {row.emergency && (
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
              SOS Priority
            </span>
          )}
        </div>
      )
    },
    { key: 'patient', header: 'Patient' },
    { key: 'medication', header: 'Medication Details' },
    { 
      key: 'date', 
      header: 'Received Time', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="medx-caption">
          <Clock size={12} />
          {row.date}
        </span>
      )
    },
    { key: 'status', header: 'Workflow Stage', render: (row) => getStatusBadge(row.status) },
    { key: 'cost', header: 'Price', render: (row) => <span>${row.cost.toFixed(2)}</span> },
    {
      key: 'action',
      header: 'Fulfillment controls',
      render: (row) => {
        const needsPrescription = row.medication.includes('Atorvastatin') || 
                                  row.medication.includes('Metformin') || 
                                  row.medication.includes('Amoxicillin') || 
                                  row.medication.includes('Insulin');

        const triggerAction = async (endpoint: string, bodyObj: any = null) => {
          try {
            let finalBody = bodyObj;
            if (endpoint === 'accept') {
              const session = localStorage.getItem('medx_session');
              let facilityId = 'FAC-003';
              if (session) {
                try {
                  const parsed = JSON.parse(session);
                  facilityId = parsed.associatedId || 'FAC-003';
                } catch (e) {}
              }
              finalBody = { facilityId, ...bodyObj };
            }

            const url = ['return-accept', 'return-reject'].includes(endpoint)
              ? `http://localhost:3001/api/orders/${row.id}/${endpoint}`
              : `http://localhost:3001/api/workflow/${row.id}/${endpoint}`;

            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: finalBody ? JSON.stringify(finalBody) : null
            });
            const data = await res.json();
            if (data.success) {
              toastManager.addToast(`Action successful.`, 'success');
              fetchRealOrders();
            } else {
              toastManager.addToast(data.message || 'Operation failed.', 'error');
            }
          } catch (err) {
            console.error(err);
            toastManager.addToast('Network communication error.', 'error');
          }
        };

        const handleSuggestAlternative = () => {
          const alt = prompt('Enter the suggested alternative medicine name:');
          if (alt) {
            triggerAction('suggest-alternative', { alternative: alt });
          }
        };

        return (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {row.status === 'New' && (
              <>
                <Button variant="primary" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('accept')}>
                  Accept Order
                </Button>
                {needsPrescription && (
                  <Button variant="secondary" style={{ height: '32px', fontSize: '11px', border: '1px solid var(--color-warning)', color: 'var(--color-warning)' }} onClick={() => triggerAction('verify-prescription')}>
                    Verify Rx
                  </Button>
                )}
                <Button variant="danger" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('reject', { remarks: 'Rejected by pharmacist.' })}>
                  Reject
                </Button>
              </>
            )}

            {row.status === 'Under Review' && (
              <>
                <Button variant="primary" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('verify-prescription')}>
                  Verify Prescription
                </Button>
                <Button variant="danger" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('reject', { remarks: 'Verification failed.' })}>
                  Reject
                </Button>
              </>
            )}

            {row.status === 'Approved' && (
              <>
                <Button variant="primary" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('reserve-inventory')}>
                  Reserve Inventory
                </Button>
                <Button variant="danger" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('mark-out-of-stock')}>
                  Out of Stock
                </Button>
                <Button variant="secondary" style={{ height: '32px', fontSize: '11px' }} onClick={handleSuggestAlternative}>
                  Suggest Alt
                </Button>
              </>
            )}

            {row.status === 'Preparing' && (
              <Button variant="primary" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('ready')}>
                Mark Ready
              </Button>
            )}

            {row.status === 'Ready' && (
              <span className="medx-caption" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Awaiting Rider Pickup
              </span>
            )}

            {['Preparing Dispatch', 'Reached Store'].includes(row.status) && (
              <span className="medx-caption" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Rider Preparing
              </span>
            )}

            {row.status === 'Out for Delivery' && (
              <span className="medx-caption" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                In Transit
              </span>
            )}

            {row.status === 'Reached Customer' && (
              <span className="medx-caption" style={{ color: 'var(--color-info)', fontWeight: 600 }}>
                Rider at Patient Location
              </span>
            )}

            {row.status === 'Delivered' && (
              <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                Completed
              </span>
            )}

            {row.status === 'Cancelled' && (
              <span className="medx-caption" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                Cancelled
              </span>
            )}

            {row.status === 'Rejected' && (
              <span className="medx-caption" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                Rejected
              </span>
            )}

            {row.status === 'Out of Stock' && (
              <span className="medx-caption" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                Out of Stock
              </span>
            )}

            {row.status === 'Manual Review' && (
              <span className="medx-caption" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                Awaiting Manual Review
              </span>
            )}

            {row.status === 'Waiting for Pharmacy Response' && (
              <>
                <Button variant="primary" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('return-accept')}>
                  Accept Return
                </Button>
                <Button variant="danger" style={{ height: '32px', fontSize: '11px' }} onClick={() => triggerAction('return-reject')}>
                  Reject Return
                </Button>
              </>
            )}
          </div>
        )
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Order Management" 
        description="Fulfill client drug orders, route emergency telemetry shipments, and audit dispatch queues."
      />

      {/* Tabs navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', overflowX: 'auto' }}>
        {(['All', 'New', 'Preparing', 'Ready', 'Out for Delivery', 'Emergency'] as const).map(tab => {
          const active = activeTab === tab;
          let colorClass = 'medx-button-ghost';
          if (active) colorClass = tab === 'Emergency' ? 'medx-button-danger' : 'medx-button-primary';

          let count = 0;
          if (tab === 'All') count = orders.length;
          else if (tab === 'Emergency') count = orders.filter(o => o.emergency).length;
          else if (tab === 'Out for Delivery') {
            count = orders.filter(o => ['Preparing Dispatch', 'Reached Store', 'Out for Delivery', 'Reached Customer'].includes(o.status)).length;
          } else {
            count = orders.filter(o => o.status === tab).length;
          }

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`medx-button ${colorClass}`}
              style={{ height: '36px', fontSize: '13px' }}
            >
              {tab === 'Emergency' && <Flame size={14} style={{ marginRight: '4px' }} />}
              {tab === 'Out for Delivery' ? 'In Transit' : tab}
              <span style={{ 
                marginLeft: '8px', 
                backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                color: active ? 'white' : 'var(--color-text-secondary)',
                padding: '2px 6px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Table 
          columns={columns}
          data={filteredOrders}
          keyExtractor={(row) => row.id}
          emptyMessage={`No orders found in tab "${activeTab}"`}
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
export default Orders;
