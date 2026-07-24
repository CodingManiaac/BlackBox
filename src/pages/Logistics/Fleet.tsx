import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Truck } from 'lucide-react';

interface FleetVehicle {
  id: string;
  name: string;
  fuel: number;
  maintenance: 'Optimal' | 'Service Required';
  capacityLimit: string;
}

export const Fleet: React.FC = () => {
  const toastManager = useToast();

  const [vehicles, setVehicles] = useState<FleetVehicle[]>([
    { id: 'VEH-01', name: 'Delivery Van A (Thermal)', fuel: 42, maintenance: 'Optimal', capacityLimit: '150 kg' },
    { id: 'VEH-02', name: 'Delivery Van B (Thermal)', fuel: 12, maintenance: 'Service Required', capacityLimit: '150 kg' },
    { id: 'VEH-03', name: 'Emergency Dispatch Bike #01', fuel: 84, maintenance: 'Optimal', capacityLimit: '30 kg' }
  ]);

  const handleRefuel = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return { ...v, fuel: 100 };
      }
      return v;
    }));
    toastManager.addToast(`Refueled vehicle ${vehicleId} successfully. Fuel at 100%.`, 'success');
  };

  const handleService = (vehicleId: string) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        return { ...v, maintenance: 'Optimal' };
      }
      return v;
    }));
    toastManager.addToast(`Vehicle ${vehicleId} serviced. Maintenance status set to Optimal.`, 'success');
  };

  const getMaintenanceBadge = (status: FleetVehicle['maintenance']) => {
    switch(status) {
      case 'Optimal':
        return <Badge variant="success">{status}</Badge>;
      default:
        return <Badge variant="danger">{status}</Badge>;
    }
  };

  const columns: Column<FleetVehicle>[] = [
    { 
      key: 'id', 
      header: 'Vehicle ID', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={16} style={{ color: 'var(--color-primary)' }} />
          <strong>{row.id}</strong>
        </div>
      )
    },
    { key: 'name', header: 'Vehicle Class' },
    { 
      key: 'fuel', 
      header: 'Fuel Reserve Level', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
          <div style={{ flex: 1, height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${row.fuel}%`, 
              backgroundColor: row.fuel < 20 ? 'var(--color-danger)' : row.fuel < 50 ? 'var(--color-warning)' : 'var(--color-success)',
              transition: 'width 0.4s ease'
            }}></div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600 }}>{row.fuel}%</span>
        </div>
      )
    },
    { key: 'capacityLimit', header: 'Payload Cargo Weight' },
    { key: 'maintenance', header: 'Service State', render: (row) => getMaintenanceBadge(row.maintenance) },
    {
      key: 'action',
      header: 'Replenish controls',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.fuel < 100 && (
            <Button 
              variant="secondary" 
              style={{ height: '32px', fontSize: '12px' }}
              onClick={() => handleRefuel(row.id)}
            >
              Refuel Tank
            </Button>
          )}

          {row.maintenance === 'Service Required' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '12px' }}
              onClick={() => handleService(row.id)}
            >
              Service Fleet
            </Button>
          )}

          {row.fuel === 100 && row.maintenance === 'Optimal' && (
            <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              Ready to Dispatch
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Fleet Registry Management" 
        description="Audit ground shipment logistics vehicles, monitor fuel reserve capacities, and schedule garage service."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="medx-section">Ground Fleet Registry</h3>
        <Table 
          columns={columns}
          data={vehicles}
          keyExtractor={(row) => row.id}
        />
      </div>

    </div>
  );
};
export default Fleet;
