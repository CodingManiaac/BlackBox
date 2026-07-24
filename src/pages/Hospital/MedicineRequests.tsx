import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useToast } from '../../hooks/useToast';
import { Truck, Plus, Info, AlertTriangle } from 'lucide-react';

interface MedicineRequest {
  id: string;
  medicine: string;
  quantity: number;
  status: string;
  created_at: number;
  assigned_pharmacy?: string;
}

export const MedicineRequests: React.FC = () => {
  const toastManager = useToast();
  const [requests, setRequests] = useState<MedicineRequest[]>([]);
  const [newDrug, setNewDrug] = useState('Insulin');
  const [newQty, setNewQty] = useState(5);
  const [newWard, setNewWard] = useState('Intensive Care Unit (ICU)');
  const [emergencyPriority, setEmergencyPriority] = useState(false);
  const [reason, setReason] = useState('');

  // Combined emergency states
  const [isCombined, setIsCombined] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [bloodUnits, setBloodUnits] = useState(2);

  const fetchRequests = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        // Filter medicine or combined requests for hospital
        const filtered = data.orders.filter(
          (o: any) => o.request_source === 'Hospital' && (o.request_type === 'Medicine' || o.request_type === 'Combined')
        );
        setRequests(filtered);
      }
    } catch (err) {
      console.error('Failed loading medicine requests:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchRequests();
    };
    return () => eventSource.close();
  }, []);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQty <= 0) {
      toastManager.addToast('Please enter a valid quantity.', 'warning');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/hospitals/procure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: 'FAC-001',
          requestType: isCombined ? 'Combined' : 'Medicine',
          medicine: newDrug,
          quantity: newQty,
          bloodGroup: isCombined ? bloodGroup : null,
          bloodUnits: isCombined ? bloodUnits : null,
          emergencyPriority: emergencyPriority || isCombined, // Forced true for combined emergency
          reason: isCombined ? `Combined Emergency: Medicine Refill & Transfusion. Ward: ${newWard}. Reason: ${reason}` : `Ward: ${newWard}. Reason: ${reason}`
        })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast(
          isCombined 
            ? `Combined Emergency Request ${data.orderId} submitted to BloodBank and Pharmacy networks!` 
            : `Medicine Procurement Request ${data.orderId} submitted to Pharmacy networks!`, 
          'success'
        );
        fetchRequests();
        setNewQty(5);
        setReason('');
        setIsCombined(false);
      }
    } catch (err) {
      console.error(err);
      toastManager.addToast('Failed to submit procurement request.', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Delivered':
      case 'COMPLETED':
        return <Badge variant="success">{status}</Badge>;
      case 'Pending':
      case 'Preparing':
        return <Badge variant="warning">{status}</Badge>;
      case 'Rejected':
      case 'Cancelled':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const columns: Column<MedicineRequest>[] = [
    { key: 'id', header: 'Request ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'medicine', header: 'Resource details', render: (row) => <strong>{row.medicine}</strong> },
    { key: 'quantity', header: 'Units Requested' },
    { key: 'assigned_pharmacy', header: 'Fulfillment Pharmacy', render: (row) => <span>{row.assigned_pharmacy || ' Apollo Pharmacy'}</span> },
    { key: 'status', header: 'Delivery Stage', render: (row) => getStatusBadge(row.status) },
    {
      key: 'tracker',
      header: 'Stepping State',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Truck size={14} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '11px' }} className="medx-caption">
            {row.status === 'Pending' ? 'Awaiting AI Approval' : row.status === 'Out for Delivery' ? 'Rider In Transit' : row.status}
          </span>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Medicine Procurement Center" 
        description="Requisition clinical care medications, manage bulk buffers, and route combined emergency requests."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Requisition form */}
        <Card shadow="sm" hoverLift={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="medx-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--color-primary)' }} />
              New Procurement Request
            </h3>
            
            <button
              onClick={() => setIsCombined(!isCombined)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isCombined ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                backgroundColor: isCombined ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.02)',
                border: isCombined ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                padding: '4px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ⚠️ {isCombined ? 'Cancel Combined' : 'Combined Emergency'}
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Section 1: Medicine details */}
            <div className="medx-form-group">
              <label className="medx-label">Select Medication</label>
              <select 
                className="medx-select"
                value={newDrug}
                onChange={(e) => setNewDrug(e.target.value)}
                style={{ height: '40px' }}
              >
                <option value="Insulin">Insulin Glargine 100 U</option>
                <option value="Atorvastatin">Atorvastatin 20mg (Lipitor)</option>
                <option value="Metformin">Metformin 500mg (Glucophage)</option>
                <option value="Amoxicillin">Amoxicillin 250mg</option>
              </select>
            </div>

            <Input 
              label="Quantity (Units)" 
              type="number"
              value={newQty} 
              onChange={(e) => setNewQty(Number(e.target.value))} 
            />

            {/* Section 2: Combined Blood details (rendered if isCombined is true) */}
            {isCombined && (
              <div style={{ padding: '12px', border: '1px dashed var(--color-danger)', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  Blood Transfusion Requisition (Combined Mode)
                </div>

                <div className="medx-form-group">
                  <label className="medx-label">Blood Group Type</label>
                  <select 
                    className="medx-select"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{ height: '40px' }}
                  >
                    <option value="O-">O- (Universal Emergency)</option>
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <Input 
                  label="Blood Units Required"
                  type="number"
                  value={bloodUnits}
                  onChange={(e) => setBloodUnits(Number(e.target.value))}
                />
              </div>
            )}

            <div className="medx-form-group">
              <label className="medx-label">Destination Ward</label>
              <select 
                className="medx-select"
                value={newWard}
                onChange={(e) => setNewWard(e.target.value)}
                style={{ height: '40px' }}
              >
                <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
                <option value="General Medical Ward B">General Medical Ward B</option>
                <option value="Emergency Ward A">Emergency Ward A</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="emergency-priority"
                type="checkbox"
                checked={emergencyPriority || isCombined}
                disabled={isCombined} // Forced true for combined
                onChange={(e) => setEmergencyPriority(e.target.checked)}
              />
              <label htmlFor="emergency-priority" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                🚨 Mark Emergency Priority (Triggers ECE Severity Level 1)
              </label>
            </div>

            <Input
              label="Intake Notes / Clinical Indication"
              placeholder="e.g. Critical care patient emergency bypass."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Button variant="primary" type="submit">
              {isCombined ? 'Dispatch Combined Emergency' : 'Submit Procurement Request'}
            </Button>
          </form>
        </Card>

        {/* Right: Tracking queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Medicine Procurement Trackers</h3>
          <Table 
            columns={columns}
            data={requests}
            keyExtractor={(row) => row.id}
          />
        </div>

      </div>

      {/* AI Suggestion box */}
      <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-secondary)', backgroundColor: '#F0FDFA' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Info size={18} style={{ color: 'var(--color-secondary)' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#115E59' }}>AI Refill Replenishment Suggestions</h4>
            <p className="medx-caption" style={{ color: '#0F766E', marginTop: '2px', lineHeight: 1.4 }}>
              Telemetry trends suggest high utilization rates of **Insulin Glargine** in ICU beds over the next 48 hours. Dispatch pre-emptive buffer refills to avoid bedside shortages.
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
};
export default MedicineRequests;
