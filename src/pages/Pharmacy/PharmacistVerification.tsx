import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useToast } from '../../hooks/useToast';
import { Eye, FileText, AlertTriangle, ShieldCheck, Key } from 'lucide-react';

interface PrescriptionVerification {
  id: string;
  patientName: string;
  patientAllergies: string[];
  doctorName: string;
  prescribedDrug: string;
  date: string;
  status: 'Awaiting Audit' | 'Approved' | 'Rejected';
  notes?: string;
}

export const PharmacistVerification: React.FC = () => {
  const toastManager = useToast();

  const [queue, setQueue] = useState<PrescriptionVerification[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<PrescriptionVerification | null>(null);

  // Simulators
  const [ocrLoading, setOcrLoading] = useState(false);
  const [aiValidated, setAiValidated] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);

  // PIN modal
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pharmacistPin, setPharmacistPin] = useState('');

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchQueue = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/pharmacies/verifications');
      const data = await res.json();
      if (data.success) {
        const mapped: PrescriptionVerification[] = data.queue.map((item: any) => ({
          id: item.id,
          patientName: item.patient_name,
          patientAllergies: item.patient_allergies ? item.patient_allergies.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          doctorName: item.doctor_name,
          prescribedDrug: item.prescribed_drug,
          date: item.date,
          status: item.status,
          notes: item.notes || ''
        }));
        setQueue(mapped);
      }
    } catch (err) {
      console.error('Failed to load pharmacist verification queue:', err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleSelectAudit = (audit: PrescriptionVerification) => {
    setSelectedAudit(audit);
    setAiValidated(false);
    setAiWarning(null);
  };

  // OCR Simulator
  const triggerOCR = () => {
    if (!selectedAudit) return;
    setOcrLoading(true);
    toastManager.addToast('Accessing OCR engines to extract handwritten coordinates...', 'info');

    setTimeout(() => {
      setOcrLoading(false);
      toastManager.addToast('OCR text coordinates successfully parsed in prescription view.', 'success');
    }, 1800);
  };

  // AI Drug Validator Simulator
  const triggerAIValidation = () => {
    if (!selectedAudit) return;
    setAiValidated(true);

    // Simulated allergy clash check
    const drug = selectedAudit.prescribedDrug.toLowerCase();
    const clash = selectedAudit.patientAllergies.find(al => {
      // Amoxicillin belongs to penicillin class
      if (drug.includes('amoxicillin') && al.toLowerCase() === 'penicillin') return true;
      return false;
    });

    if (clash) {
      setAiWarning(`CRITICAL ALLERGY CLASH: Patient is allergic to ${clash}. Prescribed drug "${selectedAudit.prescribedDrug}" belongs to compatible allergen class. High risk of anaphylaxis.`);
      toastManager.addToast('AI Validation: Allergy clash detected!', 'error');
    } else {
      setAiWarning(null);
      toastManager.addToast('AI Validation: Drug interactions clear.', 'success');
    }
  };

  // PIN Authorization confirm
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pharmacistPin === '1234') {
      if (selectedAudit) {
        try {
          const res = await fetch('http://localhost:3001/api/pharmacies/verifications/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedAudit.id,
              status: 'Approved',
              notes: 'Signed off by Pharmacist #201'
            })
          });
          if (res.ok) {
            toastManager.addToast(`Prescription ${selectedAudit.id} digitally signed & approved.`, 'success');
            fetchQueue();
          }
        } catch (err) {
          console.error(err);
        }
      }
      setPinModalOpen(false);
      setPharmacistPin('');
      setSelectedAudit(null);
    } else {
      toastManager.addToast('Invalid Signature PIN. Verification denied.', 'error');
    }
  };

  // Reject prescription
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    if (selectedAudit) {
      try {
        const res = await fetch('http://localhost:3001/api/pharmacies/verifications/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedAudit.id,
            status: 'Rejected',
            notes: rejectReason
          })
        });
        if (res.ok) {
          toastManager.addToast(`Prescription ${selectedAudit.id} rejected. Reason: ${rejectReason}`, 'info');
          fetchQueue();
        }
      } catch (err) {
        console.error(err);
      }
    }

    setRejectModalOpen(false);
    setRejectReason('');
    setSelectedAudit(null);
  };

  const pendingList = queue.filter(q => q.status === 'Awaiting Audit');
  const auditedList = queue.filter(q => q.status !== 'Awaiting Audit');

  const pendingColumns: Column<PrescriptionVerification>[] = [
    { key: 'id', header: 'Verify ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'patientName', header: 'Patient' },
    { key: 'prescribedDrug', header: 'Prescribed Medication' },
    { key: 'date', header: 'Received' },
    { 
      key: 'action', 
      header: 'Audit Controls', 
      render: (row) => (
        <Button 
          variant="secondary" 
          style={{ height: '32px', fontSize: '12px' }}
          onClick={() => handleSelectAudit(row)}
        >
          <Eye size={12} />
          View Rx
        </Button>
      )
    }
  ];

  const auditedColumns: Column<PrescriptionVerification>[] = [
    { key: 'id', header: 'Verify ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'patientName', header: 'Patient' },
    { key: 'prescribedDrug', header: 'Medication' },
    { 
      key: 'status', 
      header: 'Audit Status', 
      render: (row) => (
        <Badge variant={row.status === 'Approved' ? 'success' : 'danger'}>
          {row.status}
        </Badge>
      )
    },
    { key: 'notes', header: 'Audit Note Signature', render: (row) => <span>{row.status === 'Approved' ? 'Signed off by Pharmacist #201' : row.notes}</span> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Rx Pharmacist Verification" 
        description="Verify physician prescription notes, execute AI drug allergy checks, and digitally sign off orders."
      />

      {/* Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedAudit ? '1.2fr 2fr' : '1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Pending audit queue list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="medx-section">Verification Intake Queue</h3>
            <Table 
              columns={pendingColumns}
              data={pendingList}
              keyExtractor={(row) => row.id}
              emptyMessage="Intake verification queue is currently empty."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="medx-section">Completed Audits History</h3>
            <Table 
              columns={auditedColumns}
              data={auditedList}
              keyExtractor={(row) => row.id}
            />
          </div>
        </div>

        {/* Right: Detailed audit viewer */}
        {selectedAudit && (
          <div className="medx-fade-in">
            <Card shadow="sm" hoverLift={false}>
              
              {/* Header profile */}
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 className="medx-title" style={{ fontSize: '18px' }}>Audit Details: {selectedAudit.id}</h3>
                  <span className="medx-caption">Date Received: {selectedAudit.date}</span>
                </div>
                <Badge variant="warning">Audit Pending</Badge>
              </div>

              {/* Patient details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div>
                  <span className="medx-caption">Patient Name</span>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedAudit.patientName}</div>
                </div>
                <div>
                  <span className="medx-caption">Physician Signature</span>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{selectedAudit.doctorName}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span className="medx-caption">Allergies Profile</span>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {selectedAudit.patientAllergies.length === 0 ? (
                      <span className="medx-caption" style={{ fontStyle: 'italic' }}>No known allergies</span>
                    ) : (
                      selectedAudit.patientAllergies.map(al => (
                        <span key={al} className="medx-badge" style={{ backgroundColor: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-danger)', fontSize: '10px' }}>
                          {al}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Prescription Image / Details */}
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="medx-caption" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    <FileText size={16} />
                    Scanned Prescription Note
                  </span>
                  <Button variant="secondary" onClick={triggerOCR} style={{ height: '28px', fontSize: '11px' }}>
                    Run OCR Text Extract
                  </Button>
                </div>

                {ocrLoading ? (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-secondary)' }} className="medx-caption">
                    Loading OCR model matrices...
                  </div>
                ) : (
                  <div style={{ fontStyle: 'italic', fontFamily: 'monospace', padding: '12px', backgroundColor: '#FAFBFD', border: '1px dashed var(--color-border)', borderRadius: '6px', fontSize: '13px' }}>
                    Rx: {selectedAudit.prescribedDrug}<br />
                    Sig: Take as directed by physician. Dispense original pack.
                  </div>
                )}
              </div>

              {/* AI validation checks */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 className="medx-caption" style={{ fontWeight: 700, fontSize: '13px', margin: 0 }}>AI Drug Validation Engine</h4>
                  <Button variant="secondary" onClick={triggerAIValidation} style={{ height: '28px', fontSize: '11px' }}>
                    Execute Interaction Check
                  </Button>
                </div>

                {aiValidated && (
                  <div className="medx-fade-in">
                    {aiWarning ? (
                      <div style={{ backgroundColor: '#FEF2F2', border: '1px solid rgba(239,68,68,0.15)', padding: '12px 16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <AlertTriangle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                        <span className="medx-caption" style={{ color: 'var(--color-danger)', fontSize: '11px', lineHeight: 1.3 }}>{aiWarning}</span>
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#F0FDF4', border: '1px solid rgba(34,197,94,0.15)', padding: '12px 16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <ShieldCheck size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                        <span className="medx-caption" style={{ color: '#15803D', fontSize: '11px' }}>AI cross-checks completed successfully. No drug conflicts or patient allergies interactions identified.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="danger" onClick={() => setRejectModalOpen(true)}>
                  Reject Prescription
                </Button>
                <Button variant="primary" onClick={() => setPinModalOpen(true)}>
                  <Key size={14} />
                  Authorize & Sign
                </Button>
              </div>

            </Card>
          </div>
        )}

      </div>

      {/* Pharmacist Signature PIN Modal */}
      <Modal 
        isOpen={pinModalOpen} 
        onClose={() => setPinModalOpen(false)} 
        title="Double Verification - Pharmacist Signature PIN"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setPinModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePinSubmit}>Submit Signature</Button>
          </div>
        }
      >
        <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p className="medx-caption">
            Type your 4-digit verification PIN to digitally sign off this prescription request. (Simulate PIN: <strong>1234</strong>)
          </p>
          <Input 
            label="Pharmacist Signature PIN" 
            type="password"
            maxLength={4}
            value={pharmacistPin} 
            onChange={(e) => setPharmacistPin(e.target.value)}
            placeholder="••••"
            style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '0.25em' }}
          />
        </form>
      </Modal>

      {/* Rejection Notes Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Prescription Audit Rejection Note"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleRejectSubmit}>Submit Rejection</Button>
          </div>
        }
      >
        <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="medx-form-group">
            <label className="medx-label">Rejection Reason</label>
            <input 
              type="text" 
              className="medx-input" 
              placeholder="e.g., Unclear physician writing, dosage bounds check exceeded..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </form>
      </Modal>

    </div>
  );
};
export default PharmacistVerification;
