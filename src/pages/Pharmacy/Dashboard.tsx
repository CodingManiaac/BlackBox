import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useNavigation } from '../../hooks/useNavigation';
import { ArrowRight, ShieldAlert } from 'lucide-react';

interface PendingVerification {
  id: string;
  patient: string;
  doctor: string;
  medication: string;
  timeAwaiting: string;
}

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();

  const kpis = [
    { title: 'Orders Today', value: '42', badgeText: 'Syncing', badgeVariant: 'info' as const, desc: '14 orders preparing' },
    { title: 'Revenue (Today)', value: '$1,840', badgeText: '+8.4%', badgeVariant: 'success' as const, desc: 'Average transaction: $43.80' },
    { title: 'Low Stock Alert', value: '3 Items', badgeText: 'Action Needed', badgeVariant: 'danger' as const, desc: 'Atorvastatin 20mg, Insulin...' },
    { title: 'Pending Verification', value: '4 Prescriptions', badgeText: 'Audit Needed', badgeVariant: 'warning' as const, desc: 'Average verification: 6m' }
  ];

  // Visual CSS-based sales trend graph data
  const chartData = [
    { hour: '08:00', sales: 12 },
    { hour: '10:00', sales: 28 },
    { hour: '12:00', sales: 45 },
    { hour: '14:00', sales: 32 },
    { hour: '16:00', sales: 18 },
    { hour: '18:00', sales: 40 },
    { hour: '20:00', sales: 15 }
  ];

  const pendingList: PendingVerification[] = [
    { id: 'RXV-9920', patient: 'A. Sterling', doctor: 'Dr. S. Jenkins', medication: 'Atorvastatin 20mg (30 tabs)', timeAwaiting: '3 mins ago' },
    { id: 'RXV-1102', patient: 'G. Henderson', doctor: 'Dr. R. Gupta', medication: 'Metformin 500mg (60 tabs)', timeAwaiting: '8 mins ago' },
    { id: 'RXV-4399', patient: 'M. Vance', doctor: 'Dr. S. Jenkins', medication: 'Lisinopril 10mg (30 tabs)', timeAwaiting: '14 mins ago' }
  ];

  const pendingCols: Column<PendingVerification>[] = [
    { key: 'id', header: 'Verify ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'patient', header: 'Patient Name' },
    { key: 'medication', header: 'Medication' },
    { key: 'timeAwaiting', header: 'Awaiting' },
    { 
      key: 'action', 
      header: 'Action', 
      render: () => (
        <Button 
          variant="secondary" 
          style={{ height: '32px', fontSize: '12px' }}
          onClick={() => navigateTo('/pharmacy/verify')}
        >
          Verify Rx
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Pharmacy Hub" 
        description="Verify physician prescriptions, monitor stock levels, check sales analytics, and dispatch deliveries."
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

      {/* Main splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Pending verification list & low stock warnings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Pending Verifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="medx-section">Prescriptions Awaiting Pharmacist Audit</h3>
            <Table 
              columns={pendingCols}
              data={pendingList}
              keyExtractor={(row) => row.id}
            />
          </div>

          {/* Low Stock Alerts warning */}
          <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-danger)', backgroundColor: '#FEF2F2' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-danger)' }}>
                <ShieldAlert size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="medx-card-title" style={{ fontSize: '15px', color: '#991B1B' }}>Critical stock levels detected</h4>
                <p className="medx-caption" style={{ color: '#B91C1C', marginTop: '2px' }}>3 essential drugs are below buffer limits. Supply routing adjustments advised.</p>
              </div>
              <Button variant="secondary" onClick={() => navigateTo('/pharmacy/inventory')}>
                Manage Inventory
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: CSS Trend Graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '24px' }}>Hourly Sales Activity (Today)</h3>
            
            {/* CSS Bar Chart Graph */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              height: '160px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '8px',
              paddingLeft: '16px',
              paddingRight: '16px',
              marginBottom: '16px'
            }}>
              {chartData.map((data, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                  {/* Visual Bar */}
                  <div 
                    style={{
                      width: '20px',
                      height: `${data.sales * 2.5}px`,
                      backgroundColor: 'var(--color-primary-soft)',
                      borderTop: '2px solid var(--color-primary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                    title={`${data.sales} orders`}
                  ></div>
                  <span className="medx-caption" style={{ fontSize: '10px' }}>{data.hour}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="medx-caption">Peak Sales: <strong>12:00 PM (45 sales)</strong></span>
              <Button variant="ghost" onClick={() => navigateTo('/pharmacy/analytics')} style={{ fontSize: '12px', height: '28px', padding: 0 }}>
                View Full Reports
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
