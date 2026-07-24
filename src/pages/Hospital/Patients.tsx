import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { FileText, ClipboardList, ShieldAlert, CheckCircle, UserCheck } from 'lucide-react';

interface LabReport {
  test: string;
  result: string;
  date: string;
}

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: string;
  status: 'Admitted - ICU' | 'Admitted - General Ward' | 'Discharged';
  allergies: string[];
  medicalHistory: string;
  prescriptions: string[];
  labReports: LabReport[];
}

export const Patients: React.FC = () => {
  const toastManager = useToast();

  const [patients, setPatients] = useState<PatientRecord[]>([
    {
      id: 'PT-9011',
      name: 'Vishu Kumar',
      age: 29,
      gender: 'Male',
      status: 'Admitted - General Ward',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      medicalHistory: 'Chronic hypertension diagnosed 2024. Under active telemetry monitoring.',
      prescriptions: ['Atorvastatin 20mg Once Daily', 'Metformin 500mg Twice Daily'],
      labReports: [
        { test: 'Fasting Blood Glucose', result: '96 mg/dL (Normal)', date: 'July 14, 2026' },
        { test: 'Serum Potassium', result: '4.2 mmol/L (Normal)', date: 'July 12, 2026' }
      ]
    },
    {
      id: 'PT-1102',
      name: 'Amanda Sterling',
      age: 45,
      gender: 'Female',
      status: 'Admitted - ICU',
      allergies: ['Peanuts'],
      medicalHistory: 'Severe asthma history. Admitted following respiratory distress.',
      prescriptions: ['Albuterol Inhaler PRN', 'Prednisone 40mg Daily'],
      labReports: [
        { test: 'Arterial Blood Gas (SpO2)', result: '91% (Critical)', date: 'July 15, 2026' }
      ]
    },
    {
      id: 'PT-4399',
      name: 'Gerald Henderson',
      age: 62,
      gender: 'Male',
      status: 'Discharged',
      allergies: [],
      medicalHistory: 'Type-2 Diabetes mellitus. Post-operative telemetry checks clean.',
      prescriptions: ['Metformin 1000mg Daily'],
      labReports: [
        { test: 'HbA1c', result: '6.4% (Pre-diabetic)', date: 'July 10, 2026' }
      ]
    }
  ]);

  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);

  const getStatusBadge = (status: PatientRecord['status']) => {
    switch(status) {
      case 'Admitted - ICU':
        return <Badge variant="danger">{status}</Badge>;
      case 'Admitted - General Ward':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="success">{status}</Badge>;
    }
  };

  const handleDischarge = (patientId: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, status: 'Discharged' };
      }
      return p;
    }));
    toastManager.addToast(`Patient ${patientId} successfully discharged. Bed vacated.`, 'success');
    setSelectedPatient(null);
  };

  const handleAdmitICU = (patientId: string) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return { ...p, status: 'Admitted - ICU' };
      }
      return p;
    }));
    toastManager.addToast(`Patient ${patientId} transferred to Intensive Care Unit.`, 'warning');
    setSelectedPatient(null);
  };

  const columns: Column<PatientRecord>[] = [
    { key: 'id', header: 'Patient ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'name', header: 'Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'age', header: 'Age' },
    { key: 'gender', header: 'Gender' },
    { key: 'status', header: 'Admission State', render: (row) => getStatusBadge(row.status) },
    { 
      key: 'action', 
      header: 'EMR File', 
      render: (row) => (
        <Button 
          variant="secondary" 
          style={{ height: '32px', fontSize: '12px' }}
          onClick={() => setSelectedPatient(row)}
        >
          <FileText size={12} />
          Open Chart
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Electronic Medical Records (EMR)" 
        description="Verify active clinical patient chart registries, access lab report indices, and schedule discharge notices."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="medx-section">Admitted Census Registry</h3>
        <Table 
          columns={columns}
          data={patients}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* Patient EMR Modal */}
      <Modal
        isOpen={selectedPatient !== null}
        onClose={() => setSelectedPatient(null)}
        title={selectedPatient ? `EMR Medical Profile: ${selectedPatient.name}` : ''}
        footer={
          selectedPatient && selectedPatient.status !== 'Discharged' ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              {selectedPatient.status !== 'Admitted - ICU' && (
                <Button variant="danger" onClick={() => handleAdmitICU(selectedPatient.id)}>
                  Transfer to ICU
                </Button>
              )}
              <Button variant="primary" onClick={() => handleDischarge(selectedPatient.id)}>
                Issue Discharge Document
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedPatient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Demographic Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div>
                <span className="medx-caption">Patient Identifier</span>
                <div><strong>{selectedPatient.id}</strong></div>
              </div>
              <div>
                <span className="medx-caption">Age / Gender</span>
                <div><strong>{selectedPatient.age} yrs / {selectedPatient.gender}</strong></div>
              </div>
              <div>
                <span className="medx-caption">Status</span>
                <div>{getStatusBadge(selectedPatient.status)}</div>
              </div>
            </div>

            {/* Medical History */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', marginBottom: '4px' }}>
                <ClipboardList size={16} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Clinical History Summary</span>
              </div>
              <p className="medx-caption" style={{ lineHeight: 1.4 }}>{selectedPatient.medicalHistory}</p>
            </div>

            {/* Allergies profile */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', marginBottom: '4px' }}>
                <ShieldAlert size={16} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Registered Critical Allergies</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {selectedPatient.allergies.length === 0 ? (
                  <span className="medx-caption" style={{ fontStyle: 'italic' }}>No known allergies registered.</span>
                ) : (
                  selectedPatient.allergies.map(al => (
                    <span key={al} className="medx-badge" style={{ backgroundColor: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', fontSize: '11px' }}>
                      {al}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Active Prescriptions list */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', marginBottom: '4px' }}>
                <UserCheck size={16} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Active Hospital Prescriptions</span>
              </div>
              <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }} className="medx-caption">
                {selectedPatient.prescriptions.map((rx, idx) => (
                  <li key={idx}><strong>{rx}</strong></li>
                ))}
              </ul>
            </div>

            {/* Lab Reports table */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-secondary)', marginBottom: '8px' }}>
                <CheckCircle size={16} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Lab Diagnostics Index</span>
              </div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', backgroundColor: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid var(--color-border)', fontWeight: 600 }} className="medx-caption">
                  <span>Test Details</span>
                  <span>Results</span>
                  <span>Logged Date</span>
                </div>
                {selectedPatient.labReports.map((report, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', padding: '10px 12px', borderBottom: idx !== selectedPatient.labReports.length - 1 ? '1px solid var(--color-border)' : 'none' }} className="medx-caption">
                    <strong>{report.test}</strong>
                    <span>{report.result}</span>
                    <span>{report.date}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};
export default Patients;
