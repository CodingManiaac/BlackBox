import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { Battery, Zap } from 'lucide-react';

interface DroneMission {
  id: string;
  name: string;
  battery: number;
  missionStatus: 'Standby' | 'Active Flight' | 'Charging';
  payloadWeight: string;
  flightHistory: string;
}

export const DroneFleet: React.FC = () => {
  const toastManager = useToast();

  const [drones, setDrones] = useState<DroneMission[]>([
    { id: 'DRN-01', name: 'Quadcopter D-01', battery: 94, missionStatus: 'Standby', payloadWeight: '5 kg (Max)', flightHistory: '12 flights today' },
    { id: 'DRN-02', name: 'Quadcopter D-02', battery: 14, missionStatus: 'Standby', payloadWeight: '5 kg (Max)', flightHistory: '8 flights today' },
    { id: 'DRN-03', name: 'Quadcopter D-03', battery: 65, missionStatus: 'Active Flight', payloadWeight: '5 kg (Max)', flightHistory: '15 flights today' },
    { id: 'DRN-04', name: 'Quadcopter D-04', battery: 100, missionStatus: 'Charging', payloadWeight: '5 kg (Max)', flightHistory: '6 flights today' }
  ]);

  const [chargingDrone, setChargingDrone] = useState<DroneMission | null>(null);

  const startCharging = (drone: DroneMission) => {
    setChargingDrone(drone);
    toastManager.addToast(`Connecting ${drone.name} to rapid charging dock...`, 'info');

    // Simulate charging sequence
    setTimeout(() => {
      setDrones(prev => prev.map(d => {
        if (d.id === drone.id) {
          return { ...d, battery: 100, missionStatus: 'Standby' };
        }
        return d;
      }));
      toastManager.addToast(`${drone.name} fully charged to 100%. Ready for flight missions.`, 'success');
      setChargingDrone(null);
    }, 3000);
  };

  const getMissionBadge = (status: DroneMission['missionStatus']) => {
    switch(status) {
      case 'Active Flight':
        return <Badge variant="danger">{status}</Badge>;
      case 'Charging':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="success">{status}</Badge>;
    }
  };

  const columns: Column<DroneMission>[] = [
    { key: 'id', header: 'Drone ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'name', header: 'Quadcopter Unit' },
    { 
      key: 'battery', 
      header: 'Battery Charge', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
          <Battery size={14} style={{ color: row.battery < 20 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }} />
          <div style={{ flex: 1, height: '6px', backgroundColor: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              width: `${row.battery}%`, 
              backgroundColor: row.battery < 20 ? 'var(--color-danger)' : row.battery < 50 ? 'var(--color-warning)' : 'var(--color-success)',
              transition: 'width 0.4s ease'
            }}></div>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 600 }}>{row.battery}%</span>
        </div>
      )
    },
    { key: 'payloadWeight', header: 'Max Payload Limit' },
    { key: 'flightHistory', header: 'Logs Today' },
    { key: 'missionStatus', header: 'Mission State', render: (row) => getMissionBadge(row.missionStatus) },
    {
      key: 'action',
      header: 'Power Station controls',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.battery < 100 && row.missionStatus !== 'Active Flight' && row.missionStatus !== 'Charging' && (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px', display: 'inline-flex', gap: '4px' }}
              onClick={() => startCharging(row)}
            >
              <Zap size={10} />
              Quick Charge
            </Button>
          )}
          {row.missionStatus === 'Charging' && (
            <span className="medx-caption" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
              Charging...
            </span>
          )}
          {row.missionStatus === 'Active Flight' && (
            <span className="medx-caption" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
              In Flight
            </span>
          )}
          {row.battery === 100 && row.missionStatus === 'Standby' && (
            <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
              Fully Charged
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Autonomous Quadcopter Drone Fleet" 
        description="Monitor flight statuses of autonomous quadcopter delivery units, check payload bounds, and restock power stations."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Drone list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="medx-section">Quadcopter Fleet Database</h3>
          <Table 
            columns={columns}
            data={drones}
            keyExtractor={(row) => row.id}
          />
        </div>

      </div>

      {/* Charging Simulation Modal */}
      <Modal isOpen={chargingDrone !== null} onClose={() => {}} title="Quadcopter Rapid Power Charger">
        {chargingDrone && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(234, 179, 8, 0.1)',
              color: '#EA580C',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulseCharge 1s infinite alternate',
              marginBottom: '16px'
            }}>
              <Zap size={28} />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes pulseCharge {
                0% { transform: scale(1); opacity: 0.8; }
                100% { transform: scale(1.15); opacity: 1; }
              }
            `}} />
            <h4 className="medx-card-title">Charging {chargingDrone.name}</h4>
            <p className="medx-caption" style={{ marginTop: '8px' }}>
              Simulating fast charge grid cycles. Ground coordinates locked.
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};
export default DroneFleet;
