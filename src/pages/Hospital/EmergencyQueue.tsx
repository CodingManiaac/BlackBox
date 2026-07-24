import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Clock, Stethoscope, BedDouble } from 'lucide-react';

interface ERPatientIntake {
  id: string;
  dbOrderId?: string;
  name: string;
  triageLevel: 'ECE-1' | 'ECE-2' | 'ECE-3' | 'ECE-4' | 'ECE-5';
  symptoms: string;
  eta: string;
  assignedDoctor: string;
  ambulanceCode: string;
}

export const EmergencyQueue: React.FC = () => {
  const toastManager = useToast();

  const [queue, setQueue] = useState<ERPatientIntake[]>([]);

  const doctorsList = ['Dr. Sarah Jenkins', 'Dr. Rajesh Gupta', 'Dr. Michael Vance', 'Dr. Lisa Sterling'];

  useEffect(() => {
    const fetchRealQueue = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/workflow/requests');
        const data = await res.json();
        if (data.success) {
          const mapped: ERPatientIntake[] = data.contexts
            .map((c: any) => JSON.parse(c.context_json))
            .filter((ctx: any) => {
              const eceOutput = ctx.agentOutputs.find((o: any) => o.agentId === 'ece')?.output;
              return eceOutput && eceOutput.eceLevel <= 2;
            })
            .map((ctx: any) => {
              const eceOutput = ctx.agentOutputs.find((o: any) => o.agentId === 'ece')?.output;
              const gisOutput = ctx.agentOutputs.find((o: any) => o.agentId === 'gis')?.output;
              
              return {
                id: `ERP-${ctx.requestId.substring(4)}`,
                dbOrderId: ctx.requestId,
                name: `Patient (${ctx.patientId})`,
                triageLevel: `ECE-${eceOutput.eceLevel}` as any,
                symptoms: ctx.query,
                eta: gisOutput?.eta || 'Pending',
                assignedDoctor: 'Unassigned',
                ambulanceCode: 'AMB-01'
              };
            });
          
          setQueue(mapped);
        }
      } catch (err) {
        console.error('Failed to load real emergency hospital queue:', err);
      }
    };

    fetchRealQueue();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchRealQueue();
    };

    return () => eventSource.close();
  }, []);

  const handleDoctorChange = (patientId: string, doctorName: string) => {
    setQueue(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, assignedDoctor: doctorName };
      }
      return p;
    }));
    toastManager.addToast(`Assigned ${doctorName} to patient ${patientId}`, 'success');
  };

  const handleTriageChange = (patientId: string, level: ERPatientIntake['triageLevel']) => {
    setQueue(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, triageLevel: level };
      }
      return p;
    }));
    toastManager.addToast(`Patient ${patientId} triage re-classified to ${level}`, 'warning');
  };

  const handleAdmit = async (patient: ERPatientIntake) => {
    if (patient.dbOrderId) {
      try {
        await fetch(`http://localhost:3001/api/workflow/${patient.dbOrderId}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ facilityId: 'FAC-001' })
        });
      } catch (err) {
        console.error(err);
      }
    }
    setQueue(prev => prev.filter(p => p.id !== patient.id));
    toastManager.addToast(`Intake ${patient.id} admitted. ICU Bed allocated and EMR profile generated.`, 'success');
  };

  const getTriageBadge = (level: ERPatientIntake['triageLevel']) => {
    switch(level) {
      case 'ECE-1':
        return <Badge variant="danger">{level} - Resuscitation</Badge>;
      case 'ECE-2':
        return <Badge variant="warning">{level} - Emergent</Badge>;
      case 'ECE-3':
        return <Badge variant="warning">{level} - Urgent</Badge>;
      case 'ECE-4':
        return <Badge variant="info">{level} - Less Urgent</Badge>;
      default:
        return <Badge variant="success">{level} - Non-Urgent</Badge>;
    }
  };

  const columns: Column<ERPatientIntake>[] = [
    { 
      key: 'id', 
      header: 'Case ID', 
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{row.id}</strong>
          <span style={{ fontSize: '10px' }} className="medx-caption">Ambulance: {row.ambulanceCode}</span>
        </div>
      )
    },
    { key: 'name', header: 'Patient Name', render: (row) => <strong>{row.name}</strong> },
    { 
      key: 'triageLevel', 
      header: 'Triage Severity Rating', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getTriageBadge(row.triageLevel)}
          <select 
            value={row.triageLevel}
            onChange={(e) => handleTriageChange(row.id, e.target.value as any)}
            className="medx-select"
            style={{ width: '80px', height: '24px', padding: '0 4px', fontSize: '10px', borderRadius: '4px' }}
          >
            <option value="ECE-1">ECE-1</option>
            <option value="ECE-2">ECE-2</option>
            <option value="ECE-3">ECE-3</option>
            <option value="ECE-4">ECE-4</option>
            <option value="ECE-5">ECE-5</option>
          </select>
        </div>
      )
    },
    { key: 'symptoms', header: 'Symptoms (AI Intake Notes)' },
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
    { 
      key: 'assignedDoctor', 
      header: 'Assign Physician', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Stethoscope size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <select 
            className="medx-select"
            value={row.assignedDoctor}
            onChange={(e) => handleDoctorChange(row.id, e.target.value)}
            style={{ height: '32px', fontSize: '12px', width: '160px', borderRadius: '6px' }}
          >
            <option value="Unassigned">Unassigned</option>
            {doctorsList.map(doc => (
              <option key={doc} value={doc}>{doc}</option>
            ))}
          </select>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <Button 
          variant="primary" 
          style={{ height: '32px', fontSize: '11px', display: 'inline-flex', gap: '4px' }}
          onClick={() => handleAdmit(row)}
        >
          <BedDouble size={12} />
          Admit Ward
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Emergency Intake Queue" 
        description="Audit incoming ambulance telemetry, triage patients automatically, and assign physicians."
      />

      {/* Grid of information */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Priority intake table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="medx-section">Incoming ER Priority Queue</h3>
          <Table 
            columns={columns}
            data={queue}
            keyExtractor={(row) => row.id}
            emptyMessage="No active emergency patient intakes."
          />
        </div>

      </div>
    </div>
  );
};
export default EmergencyQueue;
