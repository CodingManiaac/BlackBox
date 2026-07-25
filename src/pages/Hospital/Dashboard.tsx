import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useNavigation } from '../../hooks/useNavigation';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import ActivityFeed, { ActivityItem } from '../../components/widgets/ActivityFeed';

interface ERPatient {
  id: string;
  name: string;
  triage: 'ECE-1' | 'ECE-2' | 'ECE-3' | 'ECE-4';
  symptoms: string;
  eta: string;
}

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();

  const [stats, setStats] = useState({ icu_occupied: 16, icu_total: 20, ventilator_occupied: 8, ventilator_total: 12 });
  const [incomingERList, setIncomingERList] = useState<ERPatient[]>([]);
  const [bloodRequestsCount, setBloodRequestsCount] = useState(2);
  const [notifications, setNotifications] = useState<any[]>([]);

  const getFacilityId = () => {
    const session = localStorage.getItem('medx_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.associatedId || 'FAC-001';
      } catch (e) {}
    }
    return 'FAC-001';
  };
  const facilityId = getFacilityId();

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflow/notifications/role?role=hospital&recipientId=${facilityId}`);
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
        body: JSON.stringify({ role: 'hospital', recipientId: facilityId })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHospitalDashboard = async () => {
    try {
      // 1. Fetch stats
      const statsRes = await fetch(`http://localhost:3001/api/hospitals/stats?facilityId=${facilityId}`);
      const statsData = await statsRes.json();
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }

      // 2. Fetch triage requests
      const reqRes = await fetch('http://localhost:3001/api/workflow/requests');
      const reqData = await reqRes.json();
      if (reqData.success) {
        const filtered = reqData.contexts
          .map((c: any) => JSON.parse(c.context_json))
          .filter((ctx: any) => {
            const eceOutput = ctx.agentOutputs.find((o: any) => o.agentId === 'ece')?.output;
            return eceOutput && eceOutput.eceLevel <= 2 && ctx.status !== 'Delivered' && ctx.status !== 'Completed';
          })
          .map((ctx: any) => {
            const eceOutput = ctx.agentOutputs.find((o: any) => o.agentId === 'ece')?.output;
            const gisOutput = ctx.agentOutputs.find((o: any) => o.agentId === 'gis')?.output;
            return {
              id: `ERP-${ctx.requestId.substring(4)}`,
              name: `Patient (${ctx.patientId})`,
              triage: `ECE-${eceOutput.eceLevel}` as any,
              symptoms: ctx.query,
              eta: gisOutput?.eta || 'Pending'
            };
          });
        setIncomingERList(filtered);
      }

      // 3. Fetch active blood requests
      const ordersRes = await fetch('http://localhost:3001/api/orders');
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        const bloodReqs = ordersData.orders.filter((o: any) => 
          (o.request_type === 'Blood' || o.medicine.toLowerCase().includes('blood') || o.medicine === 'O-' || o.medicine === 'O Negative' || o.medicine === 'A+' || o.medicine === 'B+' || o.medicine === 'AB-')
          && o.status === 'Pending'
        );
        setBloodRequestsCount(bloodReqs.length);
      }
    } catch (err) {
      console.error('Failed to fetch hospital dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchHospitalDashboard();
    fetchNotifications();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchHospitalDashboard();
      fetchNotifications();
    };

    return () => eventSource.close();
  }, []);

  const icuPercent = Math.round((stats.icu_occupied / stats.icu_total) * 100);

  const kpis = [
    { title: 'ICU Beds Occupancy', value: `${stats.icu_occupied} / ${stats.icu_total}`, badgeText: `${icuPercent}% Full`, badgeVariant: icuPercent >= 80 ? 'danger' as const : 'warning' as const, desc: `${stats.icu_total - stats.icu_occupied} ICU beds open` },
    { title: 'Emergency Queue', value: `${incomingERList.length} Patients`, badgeText: incomingERList.length > 0 ? 'High Alert' : 'Normal', badgeVariant: incomingERList.length > 0 ? 'danger' as const : 'success' as const, desc: 'Realtime telemetry intakes' },
    { title: 'Active Blood Requests', value: `${bloodRequestsCount} Requests`, badgeText: 'Syncing', badgeVariant: 'info' as const, desc: 'Awaiting Red Cross Dispatch' },
    { title: 'Ventilator Utilization', value: `${stats.ventilator_occupied} / ${stats.ventilator_total}`, badgeText: 'Optimal', badgeVariant: 'success' as const, desc: `${stats.ventilator_total - stats.ventilator_occupied} units standby` }
  ];

  const erIntakeData = [
    { hour: '08:00', patients: 2 },
    { hour: '10:00', patients: 8 },
    { hour: '12:00', patients: 14 },
    { hour: '14:00', patients: 9 },
    { hour: '16:00', patients: 4 },
    { hour: '18:00', patients: 11 },
    { hour: '20:00', patients: 3 }
  ];

  const getTriageBadge = (triage: ERPatient['triage']) => {
    switch(triage) {
      case 'ECE-1':
        return <Badge variant="danger">{triage}</Badge>;
      case 'ECE-2':
        return <Badge variant="warning">{triage}</Badge>;
      default:
        return <Badge variant="info">{triage}</Badge>;
    }
  };

  const incomingCols: Column<ERPatient>[] = [
    { key: 'id', header: 'Case ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'name', header: 'Patient Name' },
    { key: 'triage', header: 'Triage Class', render: (row) => getTriageBadge(row.triage) },
    { key: 'symptoms', header: 'Symptoms Profile' },
    { key: 'eta', header: 'Rider ETA' },
    { 
      key: 'action', 
      header: 'Assign Unit', 
      render: () => (
        <Button 
          variant="secondary" 
          style={{ height: '32px', fontSize: '12px' }}
          onClick={() => navigateTo('/hospital/emergency')}
        >
          Assign Care
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Clinical Operations Hub" 
        description="Monitor emergency intakes, check intensive care bed availability, and allocate clinical ventilators."
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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Incoming ER intake */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="medx-section">Active Incoming Ambulance Intakes</h3>
            <Table 
              columns={incomingCols}
              data={incomingERList}
              keyExtractor={(row) => row.id}
            />
          </div>

          {/* ICU capacity notice */}
          <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-warning)', backgroundColor: '#FEFBF0' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ color: 'var(--color-warning)' }}>
                <ShieldAlert size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="medx-card-title" style={{ fontSize: '15px', color: '#92400E' }}>ICU Beds capacity warning</h4>
                <p className="medx-caption" style={{ color: '#B45309', marginTop: '2px' }}>Intensive Care units are registering 80% occupancy. Optimize OT triage pipelines.</p>
              </div>
              <Button variant="secondary" onClick={() => navigateTo('/hospital/resources')}>
                Manage Beds
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: hourly ER admission CSS graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '24px' }}>Hourly Intake Admissions (Today)</h3>
            
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
              {erIntakeData.map((data, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                  <div 
                    style={{
                      width: '20px',
                      height: `${data.patients * 8}px`,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderTop: '2px solid var(--color-danger)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}
                    title={`${data.patients} patients`}
                  ></div>
                  <span className="medx-caption" style={{ fontSize: '10px' }}>{data.hour}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="medx-caption">Peak Hours: <strong>12:00 PM (14 patients)</strong></span>
              <Button variant="ghost" onClick={() => navigateTo('/hospital/reports')} style={{ fontSize: '12px', height: '28px', padding: 0 }}>
                View Census Analytics
                <ArrowRight size={12} />
              </Button>
            </div>
          </Card>

          {/* Hospital Alerts Feed */}
          <ActivityFeed 
            title="Hospital Alerts & Notifications" 
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
