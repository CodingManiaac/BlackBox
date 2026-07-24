import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Thermometer, Clock, CheckCircle } from 'lucide-react';

interface BloodDispatch {
  id: string;
  reqId: string;
  facilityName: string;
  bloodType: string;
  quantity: number;
  rider: string;
  coolerTemp: number;
  status: 'Awaiting Rider' | 'In Transit' | 'Delivered';
  eta: string;
}

export const Dispatch: React.FC = () => {
  const toastManager = useToast();

  const [dispatches, setDispatches] = useState<BloodDispatch[]>([
    { id: 'DSP-990', reqId: 'BRQ-331', facilityName: 'St. Jude Pediatrics Clinic', bloodType: 'A+', quantity: 4, rider: 'Unassigned', coolerTemp: 4.0, status: 'Awaiting Rider', eta: 'Pending' },
    { id: 'DSP-102', reqId: 'BRQ-802', facilityName: 'City Trauma Emergency Room', bloodType: 'AB+', quantity: 1, rider: 'Courier Dave', coolerTemp: 3.8, status: 'In Transit', eta: '5 mins' },
    { id: 'DSP-054', reqId: 'BRQ-092', facilityName: 'Regional Oncology Center', bloodType: 'O+', quantity: 3, rider: 'Courier Sam', coolerTemp: 4.1, status: 'Delivered', eta: 'Arrived' }
  ]);

  const ridersList = ['Courier Dave', 'Courier Sam', 'Courier Emma', 'Courier Alex'];

  const handleAssignRider = (dispatchId: string, riderName: string) => {
    setDispatches(prev => prev.map(d => {
      if (d.id === dispatchId) {
        return {
          ...d,
          rider: riderName,
          status: 'In Transit',
          eta: '12 mins'
        };
      }
      return d;
    }));
    toastManager.addToast(`Assigned ${riderName} to dispatch ${dispatchId}. Shipment is In Transit.`, 'success');
  };

  const handleConfirmDelivery = (dispatchId: string) => {
    setDispatches(prev => prev.map(d => {
      if (d.id === dispatchId) {
        return {
          ...d,
          status: 'Delivered',
          eta: 'Arrived'
        };
      }
      return d;
    }));
    toastManager.addToast(`Delivery confirmed for dispatch ${dispatchId}. Cold chain validated.`, 'success');
  };

  const getStatusBadge = (status: BloodDispatch['status']) => {
    switch(status) {
      case 'Delivered':
        return <Badge variant="success">{status}</Badge>;
      case 'Awaiting Rider':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="info">In Transit</Badge>;
    }
  };

  const columns: Column<BloodDispatch>[] = [
    { key: 'id', header: 'Dispatch ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'facilityName', header: 'Ordering Facility' },
    { 
      key: 'bloodType', 
      header: 'Blood Type', 
      render: (row) => <strong style={{ color: 'var(--color-danger)' }}>{row.bloodType} ({row.quantity} Packs)</strong> 
    },
    { 
      key: 'rider', 
      header: 'Assigned Rider', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select 
            className="medx-select"
            value={row.rider}
            onChange={(e) => handleAssignRider(row.id, e.target.value)}
            disabled={row.status === 'Delivered'}
            style={{ height: '32px', fontSize: '12px', width: '150px', borderRadius: '6px' }}
          >
            <option value="Unassigned">Select Courier</option>
            {ridersList.map(rider => (
              <option key={rider} value={rider}>{rider}</option>
            ))}
          </select>
        </div>
      )
    },
    { 
      key: 'coolerTemp', 
      header: 'Cold Chain Temp', 
      render: (row) => (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px',
          color: row.coolerTemp > 6.0 || row.coolerTemp < 2.0 ? 'var(--color-danger)' : 'var(--color-success)',
          fontWeight: 600
        }}>
          <Thermometer size={14} />
          {row.coolerTemp.toFixed(1)}°C
        </span>
      )
    },
    { 
      key: 'eta', 
      header: 'ETA Track', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="medx-caption">
          <Clock size={12} />
          {row.eta}
        </span>
      )
    },
    { key: 'status', header: 'Status', render: (row) => getStatusBadge(row.status) },
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.status === 'In Transit' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px' }}
              onClick={() => handleConfirmDelivery(row.id)}
            >
              <CheckCircle size={12} />
              Confirm Delivery
            </Button>
          )}
          {row.status === 'Delivered' && (
            <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              Audit Complete
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Cold Chain Logistics Dispatch" 
        description="Assign delivery riders to dispatch-ready blood packs, track coordinate routes, and monitor cold chain status."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="medx-section">Logistics Courier Dispatches</h3>
        <Table 
          columns={columns}
          data={dispatches}
          keyExtractor={(row) => row.id}
        />
      </div>

    </div>
  );
};
export default Dispatch;
