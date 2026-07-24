import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import KPICard from '../../components/widgets/KPICard';
import ActivityFeed, { ActivityItem } from '../../components/widgets/ActivityFeed';
import Timeline, { TimelineStep } from '../../components/widgets/Timeline';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useNavigation } from '../../hooks/useNavigation';
import { useToast } from '../../hooks/useToast';
import { Activity } from 'lucide-react';

interface Prescription {
  id: string;
  name: string;
  dosage: string;
  status: 'Active' | 'Refill Needed';
  doctor: string;
}

export const Dashboard: React.FC = () => {
  const { navigateTo } = useNavigation();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const session = localStorage.getItem('medx_session');
      let patientId = 'PAT-001';
      if (session) {
        const parsed = JSON.parse(session);
        patientId = parsed.associatedId || 'PAT-001';
      }
      const res = await fetch(`http://localhost:3001/api/patients/${patientId}/notifications`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NOTIFICATION_RECEIVED' || data.type === 'STAGE_CHANGED') {
          fetchNotifications();
        }
      } catch (e) {}
    };

    return () => eventSource.close();
  }, []);

  const healthMetrics = [
    { title: 'Blood Pressure', value: '120/80 mmHg', badgeText: 'Optimal', badgeVariant: 'success' as const, desc: 'Logged 4h ago' },
    { title: 'Blood Glucose', value: '96 mg/dL', badgeText: 'Normal', badgeVariant: 'success' as const, desc: 'Fasting value' },
    { title: 'Heart Rate', value: '72 bpm', badgeText: 'Stable', badgeVariant: 'success' as const, desc: 'Synced from Apple Health' },
    { title: 'Oxygen Level (SpO2)', value: '98%', badgeText: 'Healthy', badgeVariant: 'success' as const, desc: 'Synced from wearables' }
  ];

  // Map to chronological order (oldest first)
  const healthAlerts: ActivityItem[] = [...notifications].reverse().map((n: any) => ({
    id: n.id,
    title: 'Workflow Event Update',
    time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: n.message,
    badgeText: 'Live Feed',
    badgeVariant: 'info'
  }));

  const appointmentSteps: TimelineStep[] = [
    { id: '1', title: 'Consultation with Dr. Jenkins', description: 'Cardiology Clinic consultation regarding diagnostics review.', time: 'July 18, 10:00 AM', status: 'active' },
    { id: '2', title: 'Telemetry Blood Draw', description: 'Fasting glucose and lipid profiles review.', time: 'July 24, 08:30 AM', status: 'pending' },
    { id: '3', title: 'Prescription Renewal Check', description: 'Bi-annual dosage adjustments discussion.', time: 'Aug 12, 02:00 PM', status: 'pending' }
  ];

  const prescriptions: Prescription[] = [
    { id: 'RX-9820', name: 'Atorvastatin', dosage: '20mg Daily', status: 'Active', doctor: 'Dr. S. Jenkins' },
    { id: 'RX-1102', name: 'Metformin', dosage: '500mg Twice Daily', status: 'Active', doctor: 'Dr. R. Gupta' },
    { id: 'RX-4399', name: 'Lisinopril', dosage: '10mg Daily', status: 'Refill Needed', doctor: 'Dr. S. Jenkins' }
  ];

  const prescriptionCols: Column<Prescription>[] = [
    { key: 'name', header: 'Medication Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'dosage', header: 'Dosage Instruction' },
    { key: 'doctor', header: 'Prescribing Physician' },
    { 
      key: 'status', 
      header: 'Fulfillment State', 
      render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    { 
      key: 'action', 
      header: 'Quick Action', 
      render: (row) => (
        <Button 
          variant={row.status === 'Active' ? 'ghost' : 'secondary'} 
          style={{ height: '32px', fontSize: '12px' }}
          onClick={async () => {
            if (row.status === 'Refill Needed') {
              try {
                const session = localStorage.getItem('medx_session');
                let patientId = 'PAT-001';
                if (session) {
                  const parsed = JSON.parse(session);
                  patientId = parsed.associatedId || 'PAT-001';
                }
                const res = await fetch('http://localhost:3001/api/orders/refill', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ patientId, medicineName: row.name })
                });
                const data = await res.json();
                if (res.ok) {
                  addToast(data.message, 'success');
                } else {
                  addToast(data.message || 'Failed to submit refill request.', 'danger');
                }
              } catch (e) {
                addToast('Network error submitting refill.', 'danger');
              }
            } else {
              navigateTo('/patient/search');
            }
          }}
        >
          {row.status === 'Active' ? 'Search Alternatives' : 'Request Refill'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Patient Portal" 
        description="Review your active clinical indicators, doctor appointments, and active prescriptions."
        actions={
          <Button variant="danger" onClick={() => navigateTo('/patient/emergency')}>
            🚨 Launch SOS Emergency Console
          </Button>
        }
      />

      {/* 1. Health Summary Cards */}
      <div>
        <h3 className="medx-section">Health Summary Indicators</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {healthMetrics.map((metric, idx) => (
            <KPICard 
              key={idx}
              title={metric.title}
              value={metric.value}
              badgeText={metric.badgeText}
              badgeVariant={metric.badgeVariant}
              description={metric.desc}
            />
          ))}
        </div>
      </div>

      {/* 2. Main Dashboard splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Prescriptions Table & AI Helper Quick Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="medx-section">Active Prescription Logs</h3>
            <Table 
              columns={prescriptionCols}
              data={prescriptions}
              keyExtractor={(row) => row.id}
            />
          </div>

          {/* Quick AI Health Assistant Card */}
          <Card shadow="sm" style={{ borderLeft: '4px solid var(--color-primary)', backgroundColor: '#EFF6FF' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                padding: '12px',
                borderRadius: '12px',
                color: 'var(--color-primary)'
              }}>
                <Activity size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className="medx-card-title" style={{ fontSize: '16px' }}>Need help understanding your prescription details?</h4>
                <p className="medx-caption" style={{ marginTop: '2px' }}>Ask our AI Health Assistant for drug side effects, food interactions, and custom dosage guidance.</p>
              </div>
              <Button variant="primary" onClick={() => navigateTo('/patient/ai')}>
                Consult AI
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: Alerts & Appointments Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Health Alerts */}
          <ActivityFeed title="Active Health Alerts" activities={healthAlerts} />

          {/* Appointment Timeline */}
          <Timeline title="Upcoming Care Schedule" steps={appointmentSteps} />

        </div>

      </div>
    </div>
  );
};
export default Dashboard;
