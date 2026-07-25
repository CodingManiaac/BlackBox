import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useNavigation } from '../../hooks/useNavigation';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import ActivityFeed, { ActivityItem } from '../../components/widgets/ActivityFeed';

interface PendingVerification {
  id: string;
  patient: string;
  doctor: string;
  medication: string;
  timeAwaiting: string;
}

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();

  const [ordersCount, setOrdersCount] = useState(42);
  const [revenue, setRevenue] = useState(1840);
  const [lowStockCount, setLowStockCount] = useState(3);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(4);
  const [pendingList, setPendingList] = useState<PendingVerification[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const getPharmacyName = () => {
    const session = localStorage.getItem('medx_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.name || 'Care Pharmacy';
      } catch (e) {}
    }
    return 'Care Pharmacy';
  };
  const pharmacyName = getPharmacyName();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflow/notifications/role?role=pharmacy&recipientId=${encodeURIComponent(pharmacyName)}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/workflow/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClearAll = async () => {
    try {
      await fetch('http://localhost:3001/api/workflow/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'pharmacy', recipientId: pharmacyName })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Orders to compute Orders Count and Revenue
      const ordersRes = await fetch('http://localhost:3001/api/orders');
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        const pharmacyOrders = ordersData.orders.filter((o: any) => o.assigned_pharmacy === pharmacyName);
        setOrdersCount(pharmacyOrders.length);
        const totalRev = pharmacyOrders.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0);
        setRevenue(totalRev);
      }

      // 2. Fetch Inventory to compute Low Stock items
      const invRes = await fetch('http://localhost:3001/api/pharmacies/inventory');
      const invData = await invRes.json();
      if (invData.success) {
        const lowStock = invData.inventory.filter((item: any) => item.quantity < 20);
        setLowStockCount(lowStock.length);
      }

      // 3. Fetch Prescription Verifications
      const verRes = await fetch('http://localhost:3001/api/pharmacies/verifications');
      const verData = await verRes.json();
      if (verData.success) {
        const awaiting = verData.queue.filter((v: any) => v.status === 'Awaiting Audit');
        setPendingVerificationsCount(awaiting.length);
        
        const mappedList: PendingVerification[] = awaiting.map((v: any) => ({
          id: v.id,
          patient: v.patient_name,
          doctor: v.doctor_name,
          medication: v.prescribed_drug,
          timeAwaiting: v.date
        }));
        setPendingList(mappedList);
      }
    } catch (err) {
      console.error('Failed to load pharmacy dashboard stats:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchDashboardData();
      fetchNotifications();
    };

    return () => eventSource.close();
  }, []);

  const kpis = [
    { title: 'Orders Today', value: String(ordersCount), badgeText: 'Syncing', badgeVariant: 'info' as const, desc: 'Assigned to facility' },
    { title: 'Revenue (Today)', value: `$${revenue.toLocaleString()}`, badgeText: 'Live', badgeVariant: 'success' as const, desc: 'Calculated from total sales' },
    { title: 'Low Stock Alert', value: `${lowStockCount} Items`, badgeText: lowStockCount > 0 ? 'Action Needed' : 'Healthy', badgeVariant: lowStockCount > 0 ? 'danger' as const : 'success' as const, desc: 'Stock quantity < 20' },
    { title: 'Pending Verification', value: `${pendingVerificationsCount} Prescriptions`, badgeText: pendingVerificationsCount > 0 ? 'Audit Needed' : 'Clear', badgeVariant: pendingVerificationsCount > 0 ? 'warning' as const : 'success' as const, desc: 'Awaiting pharmacist signoff' }
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

          {/* Stakeholder Alerts Feed */}
          <ActivityFeed 
            title="Pharmacy Alerts & Notifications" 
            activities={notifications.map((n: any) => ({
              id: n.id,
              title: n.read === 1 ? 'Read Alert' : 'Unread Alert',
              time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              description: n.message,
              badgeText: n.read === 1 ? 'Read' : 'New',
              badgeVariant: n.read === 1 ? ('success' as const) : ('warning' as const)
            }))}
            onItemClick={handleNotificationClick}
            onClearAll={handleNotificationClearAll}
          />

        </div>

      </div>
    </div>
  );
};
export default Dashboard;
