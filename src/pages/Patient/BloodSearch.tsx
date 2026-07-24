import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { Droplet, AlertCircle, Share2, Award, Clock } from 'lucide-react';

interface BloodBankStock {
  id: string;
  bankName: string;
  distance: string;
  stockLevel: 'Adequate' | 'Critical' | 'Out of Stock';
  unitsAvailable: number;
}

interface MatchedDonor {
  name: string;
  bloodType: string;
  distance: string;
  status: 'Ready to Donate' | 'Donated Recently';
}

export const BloodSearch: React.FC = () => {
  const toastManager = useToast();

  const [selectedGroup, setSelectedGroup] = useState<string>('O-');
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [reservedBank, setReservedBank] = useState<BloodBankStock | null>(null);

  // Simulated blood bank stock data based on O- or general selection
  const bloodBankData: BloodBankStock[] = [
    { id: 'BB-01', bankName: 'Central Red Cross Blood Bank', distance: '1.4 km away', stockLevel: selectedGroup === 'O-' ? 'Critical' : 'Adequate', unitsAvailable: selectedGroup === 'O-' ? 2 : 45 },
    { id: 'BB-02', bankName: 'Metro General Hospital Blood Depot', distance: '2.5 km away', stockLevel: selectedGroup === 'O-' ? 'Critical' : 'Adequate', unitsAvailable: selectedGroup === 'O-' ? 1 : 28 },
    { id: 'BB-03', bankName: 'City Blood Registry Center', distance: '4.8 km away', stockLevel: selectedGroup === 'O-' ? 'Out of Stock' : 'Adequate', unitsAvailable: selectedGroup === 'O-' ? 0 : 84 }
  ];

  const matchedDonors: MatchedDonor[] = [
    { name: 'David Miller', bloodType: selectedGroup, distance: '0.8 km', status: 'Ready to Donate' },
    { name: 'Sarah Patel', bloodType: selectedGroup, distance: '1.5 km', status: 'Ready to Donate' },
    { name: 'Alex Henderson', bloodType: selectedGroup, distance: '2.2 km', status: 'Donated Recently' }
  ];

  // Trigger emergency broadcast
  const triggerBroadcast = () => {
    setBroadcastActive(true);
    toastManager.addToast(`EMERGENCY BROADCAST SENT: Matching donors for blood type ${selectedGroup} have been alerted in a 5km radius.`, 'error', 6000);
  };

  const handleReservation = (bank: BloodBankStock) => {
    if (bank.unitsAvailable === 0) {
      toastManager.addToast('No units available for reservation.', 'error');
      return;
    }
    setReservedBank(bank);
  };

  const confirmReservation = async () => {
    if (!reservedBank) return;
    try {
      const session = localStorage.getItem('medx_session');
      let patientId = 'PAT-001';
      if (session) {
        const parsed = JSON.parse(session);
        patientId = parsed.associatedId || 'PAT-001';
      }
      const res = await fetch('http://localhost:3001/api/orders/blood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          bloodGroup: selectedGroup,
          quantity: 1,
          reason: 'Emergency blood transfusion requisition'
        })
      });
      const data = await res.json();
      if (res.ok) {
        toastManager.addToast(`1 unit of ${selectedGroup} successfully reserved at ${reservedBank.bankName}. Order ID: ${data.orderId}`, 'success');
        setReservedBank(null);
      } else {
        toastManager.addToast(data.message || 'Failed to reserve blood pack.', 'danger');
      }
    } catch (e) {
      toastManager.addToast('Network error reserving blood pack.', 'danger');
    }
  };

  const columns: Column<BloodBankStock>[] = [
    { key: 'bankName', header: 'Blood Bank / Hospital Depot', render: (row) => <strong>{row.bankName}</strong> },
    { key: 'distance', header: 'Distance' },
    { 
      key: 'stockLevel', 
      header: 'Supply Status', 
      render: (row) => (
        <Badge variant={row.stockLevel === 'Adequate' ? 'success' : row.stockLevel === 'Critical' ? 'warning' : 'danger'}>
          {row.stockLevel}
        </Badge>
      )
    },
    { key: 'unitsAvailable', header: 'Packs Available' },
    {
      key: 'action',
      header: 'Fulfillment',
      render: (row) => (
        <Button 
          variant={row.unitsAvailable > 0 ? 'secondary' : 'ghost'}
          disabled={row.unitsAvailable === 0}
          style={{ height: '32px', fontSize: '12px' }}
          onClick={() => handleReservation(row)}
        >
          {row.unitsAvailable > 0 ? 'Reserve Pack' : 'Out of Stock'}
        </Button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Blood Search Registry" 
        description="Fulfill immediate blood pack reservations, match compatible donors, and broadcast emergency blood drive alarms."
      />

      {/* 1. Selection & Emergency alarm grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Selector card */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '16px' }}>Select Required Blood Group</h3>
          <div className="medx-form-group">
            <label className="medx-label">Blood Type</label>
            <select 
              className="medx-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              style={{ height: '44px', borderRadius: '10px' }}
            >
              <option value="O-">O- Negative (Universal Donor)</option>
              <option value="O+">O+ Positive</option>
              <option value="A-">A- Negative</option>
              <option value="A+">A+ Positive</option>
              <option value="B-">B- Negative</option>
              <option value="B+">B+ Positive</option>
              <option value="AB-">AB- Negative</option>
              <option value="AB+">AB+ Positive</option>
            </select>
          </div>
          <p className="medx-caption" style={{ marginTop: '8px', lineHeight: 1.4 }}>
            Selecting universal blood types (like O-) checks both nearby blood banks and matching donor pools automatically.
          </p>
        </Card>

        {/* Emergency Broadcast Card */}
        <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-danger)', backgroundColor: '#FEF2F2' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
              <AlertCircle size={20} />
              <h4 className="medx-card-title" style={{ margin: 0, color: 'var(--color-danger)' }}>Immediate Critical Necessity?</h4>
            </div>
            <p className="medx-caption" style={{ color: '#991B1B', margin: 0, lineHeight: 1.4 }}>
              If a patient requires immediate blood units and banks are low, trigger an emergency broadcast. This alerts all verified donors of blood group <strong>{selectedGroup}</strong> in the region.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <Button variant="danger" onClick={triggerBroadcast}>
                <Share2 size={14} />
                Issue Emergency Broadcast
              </Button>
              {broadcastActive && (
                <div style={{ animation: 'pulse 1.5s infinite alternate', display: 'flex', alignItems: 'center' }}>
                  <Badge variant="danger">Broadcast Live</Badge>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Main Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Blood Banks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Storage Stock of Type {selectedGroup}</h3>
          <Table 
            columns={columns}
            data={bloodBankData}
            keyExtractor={(row) => row.id}
          />
        </div>

        {/* Right: Matched Donors pool */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--color-primary)' }} />
            Regional Donors Matched
          </h3>
          <p className="medx-caption" style={{ marginBottom: '16px' }}>Verified volunteers matching group <strong>{selectedGroup}</strong></p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matchedDonors.map((donor, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: idx !== matchedDonors.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{donor.name}</div>
                  <div className="medx-caption" style={{ fontSize: '11px' }}>Distance: {donor.distance}</div>
                </div>
                <Badge variant={donor.status === 'Ready to Donate' ? 'success' : 'info'}>
                  {donor.status === 'Ready to Donate' ? 'Available' : 'Resting'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Reservation Receipt Modal */}
      <Modal
        isOpen={reservedBank !== null}
        onClose={() => setReservedBank(null)}
        title="Confirm Blood Pack Reservation"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setReservedBank(null)}>Cancel</Button>
            <Button variant="primary" onClick={confirmReservation}>Confirm Reservation</Button>
          </div>
        }
      >
        {reservedBank && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--color-primary)' }}>
              <Droplet size={24} />
              <strong style={{ fontSize: '16px' }}>Confirming 1 Unit Blood Reservation</strong>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span className="medx-caption">Clinical Blood Type:</span>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>{selectedGroup} Negative</div>
              </div>
              <div>
                <span className="medx-caption">Fulfillment Facility:</span>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{reservedBank.bankName}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-warning)' }} className="medx-caption">
                <Clock size={12} />
                Hold period: Packs are reserved for a maximum of 4 hours.
              </div>
            </div>

            <p className="medx-caption" style={{ fontSize: '12px', lineHeight: 1.4 }}>
              By confirming, you authorize MedXNet coordinates dispatch to share clinical details with {reservedBank.bankName} for medical prep.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};
export default BloodSearch;
