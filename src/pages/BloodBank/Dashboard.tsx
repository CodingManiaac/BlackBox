import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useNavigation } from '../../hooks/useNavigation';
import { Thermometer, ShieldAlert, ArrowRight } from 'lucide-react';

interface BloodRequisition {
  id: string;
  facility: string;
  bloodType: string;
  quantity: number;
  timeAwaiting: string;
  priority: 'Immediate' | 'Urgent' | 'Routine';
}

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();

  // Thermal simulation
  const [temperature, setTemperature] = useState(4.2);
  const [alarmActive, setAlarmActive] = useState(false);
  const [pendingList, setPendingList] = useState<BloodRequisition[]>([]);

  const kpis = [
    { title: 'Total Blood Units', value: '112 Packs', badgeText: 'Optimal', badgeVariant: 'success' as const, desc: '38 O- Packs Reserved' },
    { title: 'Expiring Vials (7d)', value: '4 Packs', badgeText: 'Action Needed', badgeVariant: 'warning' as const, desc: 'Redistribution suggested' },
    { title: 'Pending Requisitions', value: `${pendingList.length} Orders`, badgeText: 'Syncing', badgeVariant: 'info' as const, desc: 'Average dispatch: 12m' },
    { 
      title: 'Fridge Temperature', 
      value: `${temperature.toFixed(1)}°C`, 
      badgeText: alarmActive ? 'CRITICAL ALARM' : 'Stable', 
      badgeVariant: alarmActive ? ('danger' as const) : ('success' as const), 
      desc: 'Target bounds: 2.0°C - 6.0°C' 
    }
  ];

  const distributionWeeklyData = [
    { hour: '08:00', packs: 3 },
    { hour: '10:00', packs: 12 },
    { hour: '12:00', packs: 19 },
    { hour: '14:00', packs: 8 },
    { hour: '16:00', packs: 5 },
    { hour: '18:00', packs: 15 },
    { hour: '20:00', packs: 2 }
  ];

  useEffect(() => {
    const fetchRealRequests = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/orders');
        const data = await res.json();
        if (data.success) {
          const mapped: BloodRequisition[] = data.orders
            .filter((o: any) => o.medicine.toLowerCase().includes('blood') || o.medicine === 'O-' || o.medicine === 'O Negative' || o.medicine === 'A+' || o.medicine === 'B+' || o.medicine === 'AB-')
            .filter((o: any) => o.status === 'Pending')
            .map((o: any) => ({
              id: `BRQ-${o.id.substring(4)}`,
              facility: o.assigned_pharmacy || 'Central Red Cross Blood Bank',
              bloodType: o.medicine === 'O Negative' ? 'O-' : o.medicine,
              quantity: o.quantity,
              timeAwaiting: 'Just Now',
              priority: o.ece_level <= 2 ? 'Immediate' : 'Routine'
            }));
          setPendingList(mapped);
        }
      } catch (err) {
        console.error('Failed to load blood requisitions:', err);
      }
    };

    fetchRealRequests();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchRealRequests();
    };

    return () => eventSource.close();
  }, []);

  const triggerTempSpike = () => {
    if (alarmActive) {
      setTemperature(4.2);
      setAlarmActive(false);
    } else {
      setTemperature(7.8);
      setAlarmActive(true);
    }
  };

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

  const pendingCols: Column<BloodRequisition>[] = [
    { key: 'id', header: 'Request ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'facility', header: 'Ordering Facility' },
    { key: 'bloodType', header: 'Blood Type', render: (row) => <strong style={{ color: 'var(--color-danger)' }}>{row.bloodType}</strong> },
    { key: 'quantity', header: 'Packs' },
    { key: 'priority', header: 'Priority', render: (row) => getPriorityBadge(row.priority) },
    { 
      key: 'action', 
      header: 'Action', 
      render: () => (
        <Button 
          variant="secondary" 
          style={{ height: '32px', fontSize: '12px' }}
          onClick={() => navigateTo('/bloodbank/requests')}
        >
          Approve Dispatch
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Blood Registry Hub" 
        description="Fulfill regional clinical hospital blood pack orders, track dispatch riders, and monitor storage fridges."
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
        
        {/* Left Side: Pending requests & alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="medx-section">Hospital Blood Requisitions Queue</h3>
            <Table 
              columns={pendingCols}
              data={pendingList}
              keyExtractor={(row) => row.id}
            />
          </div>

          {/* Alarm Warning notice */}
          {alarmActive && (
            <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-danger)', backgroundColor: '#FEF2F2' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-danger)' }}>
                  <ShieldAlert size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="medx-card-title" style={{ fontSize: '15px', color: '#991B1B' }}>Thermal alarm threshold violation</h4>
                  <p className="medx-caption" style={{ color: '#B91C1C', marginTop: '2px' }}>Main fridge #01 temperature registered {temperature}°C. Cold chain breakdown risk!</p>
                </div>
                <Button variant="danger" onClick={triggerTempSpike}>
                  Reset Sensor
                </Button>
              </div>
            </Card>
          )}

        </div>

        {/* Right Side: Cold Chain monitor & Hourly distributions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Thermal simulator card */}
          <Card shadow="sm" hoverLift={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="medx-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Thermometer size={18} style={{ color: alarmActive ? 'var(--color-danger)' : 'var(--color-primary)' }} />
                Cold Chain Thermal Simulator
              </h3>
              <Button variant="secondary" onClick={triggerTempSpike} style={{ height: '28px', fontSize: '11px' }}>
                {alarmActive ? 'Normalize Fridge' : 'Trigger Temp Spike'}
              </Button>
            </div>
            <p className="medx-caption" style={{ marginBottom: '16px' }}>
              Blood storage temperature must remain between **2.0°C and 6.0°C** to prevent coagulation.
            </p>
            <div style={{
              backgroundColor: alarmActive ? '#FEF2F2' : '#F0FDF4',
              border: alarmActive ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <span className="medx-caption" style={{ color: alarmActive ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 700, fontSize: '18px' }}>
                {temperature.toFixed(1)}°C
              </span>
              <div className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>
                Status: {alarmActive ? 'CRITICAL THERMAL SPIKE' : 'OPT-COOLING SYSTEM OK'}
              </div>
            </div>
          </Card>

          {/* CSS graph */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '24px' }}>Hourly Packs Distributed (Today)</h3>
            
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
              {distributionWeeklyData.map((data, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                  <div 
                    style={{
                      width: '18px',
                      height: `${data.packs * 6}px`,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderTop: '2px solid var(--color-danger)',
                      borderRadius: '4px 4px 0 0'
                    }}
                    title={`${data.packs} packs`}
                  ></div>
                  <span className="medx-caption" style={{ fontSize: '9px' }}>{data.hour}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="medx-caption">Peak: <strong>12:00 PM (19 packs)</strong></span>
              <Button variant="ghost" onClick={() => navigateTo('/bloodbank/analytics')} style={{ fontSize: '12px', height: '28px', padding: 0 }}>
                View Full Census
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
