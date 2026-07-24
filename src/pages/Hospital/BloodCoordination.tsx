import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useToast } from '../../hooks/useToast';
import { Droplet, Plus } from 'lucide-react';

interface ActiveBloodRequest {
  id: string;
  medicine: string;
  quantity: number;
  status: string;
  ece_level: number;
  created_at: number;
  blood_group?: string;
  blood_units?: number;
}

interface RegionalBloodBankStock {
  blood_group: string;
  quantity: number;
  expiry: string;
}

export const BloodCoordination: React.FC = () => {
  const toastHelper = useToast();
  const [activeRequests, setActiveRequests] = useState<ActiveBloodRequest[]>([]);
  const [bloodStocks, setBloodStocks] = useState<RegionalBloodBankStock[]>([]);

  // Form states
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [bloodUnits, setBloodUnits] = useState(2);
  const [emergencyPriority, setEmergencyPriority] = useState(false);
  const [reason, setReason] = useState('');

  const fetchBloodData = async () => {
    try {
      // 1. Fetch active blood requests
      const ordersRes = await fetch('http://localhost:3001/api/orders');
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        const filtered = ordersData.orders.filter(
          (o: any) => o.request_source === 'Hospital' && (o.request_type === 'Blood' || o.request_type === 'Combined')
        );
        setActiveRequests(filtered);
      }

      // 2. Fetch blood bank reserve counts
      const stockRes = await fetch('http://localhost:3001/api/hospitals/blood');
      const stockData = await stockRes.json();
      if (stockData.success) {
        setBloodStocks(stockData.blood);
      }
    } catch (err) {
      console.error('Failed to load blood coordination data:', err);
    }
  };

  useEffect(() => {
    fetchBloodData();
    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchBloodData();
    };
    return () => eventSource.close();
  }, []);

  const handleSubmitProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bloodUnits <= 0) {
      toastHelper.addToast('Please enter a valid number of units.', 'warning');
      return;
    }

    const matchingStock = bloodStocks.find(s => s.blood_group === bloodGroup);
    if (!matchingStock || matchingStock.quantity < bloodUnits) {
      toastHelper.addToast(`Insufficient units of ${bloodGroup} in Central Blood Bank.`, 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/hospitals/procure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: 'FAC-001',
          requestType: 'Blood',
          bloodGroup,
          bloodUnits,
          emergencyPriority,
          reason: `Blood Group: ${bloodGroup}. Clinical Transfusion: ${reason}`
        })
      });
      const data = await res.json();
      if (data.success) {
        toastHelper.addToast(`Blood Requisition ${data.orderId} submitted to Red Cross Blood Bank!`, 'success');
        fetchBloodData();
        setBloodUnits(2);
        setReason('');
      }
    } catch (err) {
      console.error(err);
      toastHelper.addToast('Failed to submit blood request.', 'error');
    }
  };

  const getPriorityBadge = (eceLevel: number) => {
    if (eceLevel <= 2) {
      return <Badge variant="danger">Immediate</Badge>;
    }
    return <Badge variant="info">Routine</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'COMPLETED':
        return <Badge variant="success">Delivered</Badge>;
      case 'Pending':
        return <Badge variant="warning">Matching Bank</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const reqCols: Column<ActiveBloodRequest>[] = [
    { key: 'id', header: 'Request ID', render: (row) => <strong>{row.id}</strong> },
    { 
      key: 'blood_group', 
      header: 'Blood Type', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontWeight: 700 }}>
          <Droplet size={14} />
          {row.blood_group || 'O-'}
        </span>
      )
    },
    { key: 'blood_units', header: 'Units Required', render: (row) => <span>{row.blood_units || row.quantity} units</span> },
    { key: 'ece_level', header: 'Priority Level', render: (row) => getPriorityBadge(row.ece_level) },
    { key: 'status', header: 'Fulfillment Status', render: (row) => getStatusBadge(row.status) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Blood Procurement Coordination" 
        description="Check real-time regional blood reserves, match compatible blood banks, and coordinate fast dispatches."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Procurement form */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--color-primary)' }} />
            New Blood Requisition
          </h3>

          <form onSubmit={handleSubmitProcurement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="medx-form-group">
              <label className="medx-label">Select Blood Type</label>
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
              label="Units Required (Packs)" 
              type="number"
              value={bloodUnits} 
              onChange={(e) => setBloodUnits(Number(e.target.value))} 
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="blood-emergency"
                type="checkbox"
                checked={emergencyPriority}
                onChange={(e) => setEmergencyPriority(e.target.checked)}
              />
              <label htmlFor="blood-emergency" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                🚨 Mark Emergency Priority (Triggers ECE Severity Level 1)
              </label>
            </div>

            <Input
              label="Transfusion Notes / Clinical Indication"
              placeholder="e.g. Active ER trauma or compound fracture replacement."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Button variant="primary" type="submit">
              Submit Blood Request
            </Button>
          </form>
        </Card>

        {/* Right: Active requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Active Blood Requisitions</h3>
          <Table 
            columns={reqCols}
            data={activeRequests}
            keyExtractor={(row) => row.id}
          />
        </div>

      </div>

      {/* Grid of actual Blood Bank stocks */}
      <Card title="🔴 Live Blood Bank Inventory (Red Cross Central)">
        <p className="medx-caption" style={{ marginBottom: '16px' }}>Showing verified units in regional storage. Red Cross coordinates cold chain transport automatically.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '16px' }}>
          {bloodStocks.map(stock => (
            <div 
              key={stock.blood_group}
              style={{
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                textAlign: 'center',
                backgroundColor: stock.quantity === 0 ? 'rgba(0,0,0,0.01)' : 'rgba(239, 68, 68, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-danger)' }}>
                {stock.blood_group}
              </span>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>
                {stock.quantity} packs
              </div>
              <span className="medx-caption" style={{ fontSize: '10px' }}>
                Exp: {stock.expiry}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
export default BloodCoordination;
