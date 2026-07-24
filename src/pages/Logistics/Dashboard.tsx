import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import MapPlaceholder from '../../components/widgets/MapPlaceholder';
import { useNavigation } from '../../hooks/useNavigation';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ActiveDelivery {
  id: string; // DSP-XXXX
  realOrderId: string; // REQ-XXXX
  destination: string;
  type: 'Drone' | 'Ground Courier';
  payload: string;
  status: string;
  priority: 'Emergency SOS' | 'Routine';
  eta: string;
  rider: string;
  eceLevel: number;
}

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const fetchRealDeliveries = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        const active: ActiveDelivery[] = data.orders.map((o: any) => ({
          id: `DSP-${o.id.substring(4)}`,
          realOrderId: o.id,
          destination: o.assigned_pharmacy || 'Default Pharmacy',
          type: o.ece_level <= 2 ? 'Drone' : 'Ground Courier',
          payload: `${o.medicine} (Qty: ${o.quantity})`,
          status: o.status,
          priority: o.ece_level <= 2 ? 'Emergency SOS' : 'Routine',
          eta: o.eta || 'Pending',
          rider: o.assigned_rider || 'Dave Miller',
          eceLevel: o.ece_level
        }));
        setDeliveries(active);
      }
    } catch (err) {
      console.error('Failed to load real logistics dashboard deliveries:', err);
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

  const activeCount = deliveries.filter(d => d.status !== 'Delivered' && d.status !== 'Failed').length;
  const droneCount = deliveries.filter(d => d.type === 'Drone' && d.status !== 'Delivered').length;
  const groundCount = deliveries.filter(d => d.type === 'Ground Courier' && d.status !== 'Delivered').length;

  const kpis = [
    { title: 'Active Deliveries', value: `${activeCount} Shipments`, badgeText: 'In Transit', badgeVariant: 'info' as const, desc: `${groundCount} ground, ${droneCount} drone missions` },
    { title: 'Couriers On Duty', value: '8 / 12 Riders', badgeText: 'Active', badgeVariant: 'success' as const, desc: '4 riders idle in depot' },
    { title: 'Drone Battery Alerts', value: '2 Units Low', badgeText: 'Action Needed', badgeVariant: 'danger' as const, desc: 'Quadcopter D-02 & D-05 below 20%' },
    { title: 'ETA Delivery Accuracy', value: '98.2%', badgeText: 'Excellent', badgeVariant: 'success' as const, desc: 'All deliveries within slot bounds' }
  ];

  const deliveriesData = [
    { hour: '08:00', counts: 5 },
    { hour: '10:00', counts: 14 },
    { hour: '12:00', counts: 26 },
    { hour: '14:00', counts: 18 },
    { hour: '16:00', counts: 11 },
    { hour: '18:00', counts: 22 },
    { hour: '20:00', counts: 7 }
  ];

  const getPriorityBadge = (priority: ActiveDelivery['priority']) => {
    switch(priority) {
      case 'Emergency SOS':
        return <Badge variant="danger">{priority}</Badge>;
      default:
        return <Badge variant="info">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
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
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const pendingCols: Column<ActiveDelivery>[] = [
    { key: 'id', header: 'Dispatch ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'destination', header: 'Pharmacy Location' },
    { key: 'type', header: 'Vehicle Class' },
    { key: 'payload', header: 'Payload Cargo' },
    { key: 'status', header: 'Stage', render: (row) => getStatusBadge(row.status) },
    { key: 'priority', header: 'Priority Level', render: (row) => getPriorityBadge(row.priority) },
    { 
      key: 'action', 
      header: 'Actions', 
      render: (row) => {
        const idx = deliveries.findIndex(d => d.id === row.id);
        return (
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button 
              variant={selectedIdx === idx ? 'primary' : 'secondary'} 
              style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
              onClick={() => setSelectedIdx(idx)}
            >
              Track Map
            </Button>
            <Button 
              variant="secondary" 
              style={{ height: '30px', fontSize: '11px', padding: '0 8px' }}
              onClick={() => navigateTo('/logistics/deliveries')}
            >
              Update
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Logistics Operations Hub" 
        description="Monitor ground dispatch riders, coordinate autonomous quadcopter drone flights, and optimize routing paths."
      />

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {kpis.map((kpi, idx) => (
          <KPICard 
            key={idx}
            title={kpi.title}
            value={kpi.value}
            badgeText={kpi.badgeText}
            badgeVariant={kpi.badgeVariant}
            description={kpi.desc}
          />
        ))}
      </div>

      {/* Main Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Active deliveries & GIS map mock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="medx-section">Active Logistics Transit Queue</h3>
            <Table 
              columns={pendingCols}
              data={deliveries}
              keyExtractor={(row) => row.id}
              emptyMessage="No active deliveries found in database."
            />
          </div>

          {/* GIS Map Mock */}
          <div>
            <h3 className="medx-section" style={{ marginBottom: '16px' }}>Live Dispatch Route Coordinates</h3>
            {deliveries.length > 0 && selectedIdx < deliveries.length ? (
              <MapPlaceholder 
                title={`Live Route Track for Dispatch ${deliveries[selectedIdx].id}`}
                description="Swiggy/Zomato live coordinates updates."
                status={deliveries[selectedIdx].status}
                assignedPharmacy={deliveries[selectedIdx].destination}
                assignedRider={deliveries[selectedIdx].rider}
                eceLevel={deliveries[selectedIdx].eceLevel}
              />
            ) : (
              <MapPlaceholder 
                title="Live coordinates track" 
                description="Awaiting active shipments to map."
                status="Ready"
              />
            )}
          </div>

        </div>

        {/* Right Side: Battery alert & CSS Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Drone Battery Alert card */}
          <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-danger)', backgroundColor: '#FEF2F2' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-danger)' }}>
                <ShieldAlert size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="medx-card-title" style={{ fontSize: '14px', color: '#991B1B' }}>Quadcopter batteries warning</h4>
                <p className="medx-caption" style={{ color: '#B91C1C', marginTop: '2px', fontSize: '11px' }}>Drones D-02 & D-05 are registered below critical 20% limits. Recall and charge advised.</p>
              </div>
              <Button variant="secondary" onClick={() => navigateTo('/logistics/fleet')} style={{ fontSize: '11px', height: '32px' }}>
                Fleet
              </Button>
            </div>
          </Card>

          {/* CSS graph */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '24px' }}>Hourly Logistics Intake (Today)</h3>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              height: '140px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '8px',
              paddingLeft: '16px',
              paddingRight: '16px',
              marginBottom: '16px'
            }}>
              {deliveriesData.map((data, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                  <div 
                    style={{
                      width: '18px',
                      height: `${data.counts * 4.5}px`,
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      borderTop: '2px solid var(--color-primary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                    title={`${data.counts} shipments`}
                  ></div>
                  <span className="medx-caption" style={{ fontSize: '9px' }}>{data.hour}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="medx-caption">Peak Volume: <strong>12:00 PM (26 ship)</strong></span>
              <Button variant="ghost" onClick={() => navigateTo('/logistics/routes')} style={{ fontSize: '12px', height: '28px', padding: 0 }}>
                View Delay Heatmaps
                <ArrowRight size={12} />
              </Button>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
export default Dashboard;
