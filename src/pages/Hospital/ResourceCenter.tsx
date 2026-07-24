import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Plus, Minus } from 'lucide-react';

interface StaffStatus {
  name: string;
  role: string;
  dept: string;
  status: 'On Duty' | 'On Call' | 'Off Duty';
}

interface OperationTheater {
  id: string;
  name: string;
  status: 'Available' | 'In Use - Surgery' | 'In Preparation';
  nextScheduled: string;
}

export const ResourceCenter: React.FC = () => {
  const toastManager = useToast();

  // Resource Counts
  const [icuAvailable, setIcuAvailable] = useState(4);
  const [icuTotal] = useState(20);

  const [ventAvailable, setVentAvailable] = useState(8);
  const [ventTotal] = useState(12);

  const [oxygenCount, setOxygenCount] = useState(84);

  const staffList: StaffStatus[] = [
    { name: 'Dr. Sarah Jenkins', role: 'Physician', dept: 'Cardiology', status: 'On Duty' },
    { name: 'Dr. Rajesh Gupta', role: 'Physician', dept: 'Trauma Care', status: 'On Call' },
    { name: 'Nurse Emma Watson', role: 'Critical Nurse', dept: 'ICU', status: 'On Duty' }
  ];

  const theatersList: OperationTheater[] = [
    { id: 'OT-01', name: 'Operation Theater 1 (Major)', status: 'In Use - Surgery', nextScheduled: '02:30 PM' },
    { id: 'OT-02', name: 'Operation Theater 2 (Minor)', status: 'Available', nextScheduled: '04:00 PM' },
    { id: 'OT-03', name: 'Operation Theater 3 (Cardiac)', status: 'In Preparation', nextScheduled: '01:15 PM' }
  ];

  // Counters
  const adjustIcu = (val: number) => {
    const next = icuAvailable + val;
    if (next < 0 || next > icuTotal) return;
    setIcuAvailable(next);
    toastManager.addToast(`ICU Bed count adjusted to ${next}`, 'info');
  };

  const adjustVent = (val: number) => {
    const next = ventAvailable + val;
    if (next < 0 || next > ventTotal) return;
    setVentAvailable(next);
    toastManager.addToast(`Ventilator availability adjusted to ${next}`, 'info');
  };

  const adjustOxygen = (val: number) => {
    const next = oxygenCount + val;
    if (next < 0) return;
    setOxygenCount(next);
    if (val > 0) {
      toastManager.addToast(`Restocked oxygen canister. Count: ${next}`, 'success');
    } else {
      toastManager.addToast(`Dispatched oxygen canister. Count: ${next}`, 'info');
    }
  };

  const getTheaterBadge = (status: OperationTheater['status']) => {
    switch(status) {
      case 'Available':
        return <Badge variant="success">{status}</Badge>;
      case 'In Use - Surgery':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="warning">{status}</Badge>;
    }
  };

  const staffCols: Column<StaffStatus>[] = [
    { key: 'name', header: 'Staff Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'role', header: 'Designation' },
    { key: 'dept', header: 'Department' },
    { 
      key: 'status', 
      header: 'Duty Roster', 
      render: (row) => (
        <Badge variant={row.status === 'On Duty' ? 'success' : row.status === 'On Call' ? 'warning' : 'info'}>
          {row.status}
        </Badge>
      )
    }
  ];

  const theaterCols: Column<OperationTheater>[] = [
    { key: 'name', header: 'Facility Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'status', header: 'Current Availability', render: (row) => getTheaterBadge(row.status) },
    { key: 'nextScheduled', header: 'Next Block Scheduled' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Clinical Resource Center" 
        description="Fulfill intensive care bed occupancy counts, adjust ventilator availability units, and audit doctor rosters."
      />

      {/* Interactive Resources Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* ICU beds */}
        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span className="medx-caption">Available ICU Beds</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800 }}>{icuAvailable}</span>
              <span className="medx-caption">/ {icuTotal} beds</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => adjustIcu(-1)} style={{ padding: '0 12px', height: '36px' }}>
              <Minus size={14} />
            </Button>
            <Button variant="secondary" onClick={() => adjustIcu(1)} style={{ padding: '0 12px', height: '36px' }}>
              <Plus size={14} />
            </Button>
          </div>
        </Card>

        {/* Ventilators */}
        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span className="medx-caption">Standby Ventilators</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800 }}>{ventAvailable}</span>
              <span className="medx-caption">/ {ventTotal} units</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => adjustVent(-1)} style={{ padding: '0 12px', height: '36px' }}>
              <Minus size={14} />
            </Button>
            <Button variant="secondary" onClick={() => adjustVent(1)} style={{ padding: '0 12px', height: '36px' }}>
              <Plus size={14} />
            </Button>
          </div>
        </Card>

        {/* Oxygen */}
        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span className="medx-caption">Oxygen Canisters (Liquified)</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800 }}>{oxygenCount}</span>
              <span className="medx-caption">canisters</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => adjustOxygen(-1)} style={{ padding: '0 12px', height: '36px' }}>
              <Minus size={14} />
            </Button>
            <Button variant="secondary" onClick={() => adjustOxygen(1)} style={{ padding: '0 12px', height: '36px' }}>
              <Plus size={14} />
            </Button>
          </div>
        </Card>

      </div>

      {/* Main Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: OTs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Operation Theater (OT) Schedules</h3>
          <Table 
            columns={theaterCols}
            data={theatersList}
            keyExtractor={(row) => row.id}
          />
        </div>

        {/* Right: Doctor/Nurse rosters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Clinical Staff Roster Duty</h3>
          <Table 
            columns={staffCols}
            data={staffList}
            keyExtractor={(row) => row.name}
          />
        </div>

      </div>
    </div>
  );
};
export default ResourceCenter;
