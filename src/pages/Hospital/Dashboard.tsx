import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useNavigation } from '../../hooks/useNavigation';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ERPatient {
  id: string;
  name: string;
  triage: 'ECE-1' | 'ECE-2' | 'ECE-3' | 'ECE-4';
  symptoms: string;
  eta: string;
}

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();

  const kpis = [
    { title: 'ICU Beds Occupancy', value: '16 / 20', badgeText: '80% Full', badgeVariant: 'warning' as const, desc: '4 critical care beds open' },
    { title: 'Emergency Queue', value: '5 Patients', badgeText: 'High Alert', badgeVariant: 'danger' as const, desc: '2 incoming ambulances' },
    { title: 'Active Blood Requests', value: '2 Requests', badgeText: 'Syncing', badgeVariant: 'info' as const, desc: 'O- and AB+ packs matching' },
    { title: 'Ventilator Utilization', value: '8 / 12', badgeText: 'Optimal', badgeVariant: 'success' as const, desc: '4 machines in standby' }
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

  const incomingERList: ERPatient[] = [
    { id: 'ERP-802', name: 'J. Doe', triage: 'ECE-1', symptoms: 'Cardiac arrest telemetry spikes', eta: '3 mins (AMB-20)' },
    { id: 'ERP-110', name: 'S. Cooper', triage: 'ECE-2', symptoms: 'Sudden left-arm numbness, slurred speech', eta: '6 mins (AMB-04)' },
    { id: 'ERP-439', name: 'R. Stark', triage: 'ECE-3', symptoms: 'Open lower-leg compound fracture', eta: '12 mins' }
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

        </div>

      </div>
    </div>
  );
};
export default Dashboard;
