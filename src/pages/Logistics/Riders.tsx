import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { useToast } from '../../hooks/useToast';
import { User, Star, MapPin } from 'lucide-react';

interface RiderRoster {
  id: string;
  name: string;
  status: 'On Duty' | 'On Break' | 'Offline';
  rating: number;
  shift: string;
  attendance: 'Present' | 'Absent';
  location: string;
}

export const Riders: React.FC = () => {
  const toastManager = useToast();

  const [riders, setRiders] = useState<RiderRoster[]>(
    [
      { id: 'RD-01', name: 'Dave Sterling', status: 'On Duty', rating: 4.9, shift: 'Day Shift (08:00 - 16:00)', attendance: 'Present', location: 'Near Trauma ER' },
      { id: 'RD-02', name: 'Sam Henderson', status: 'On Duty', rating: 4.8, shift: 'Day Shift (08:00 - 16:00)', attendance: 'Present', location: 'Main Depot' },
      { id: 'RD-03', name: 'Emma Watson', status: 'On Break', rating: 4.7, shift: 'Day Shift (08:00 - 16:00)', attendance: 'Present', location: 'Rest Lounge' },
      { id: 'RD-04', name: 'Alex Cooper', status: 'Offline', rating: 4.9, shift: 'Night Shift (16:00 - 00:00)', attendance: 'Absent', location: 'Home' }
    ]
  );

  const handleStatusChange = (riderId: string, status: RiderRoster['status']) => {
    setRiders(prev => prev.map(r => {
      if (r.id === riderId) {
        return { ...r, status };
      }
      return r;
    }));
    toastManager.addToast(`Rider ${riderId} status changed to ${status}`, 'info');
  };

  const getStatusBadge = (status: RiderRoster['status']) => {
    switch(status) {
      case 'On Duty':
        return <Badge variant="success">{status}</Badge>;
      case 'On Break':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="info">Offline</Badge>;
    }
  };

  const columns: Column<RiderRoster>[] = [
    { 
      key: 'name', 
      header: 'Rider Profile', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} style={{ color: 'var(--color-primary)' }} />
          <strong>{row.name}</strong>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Roster Status', 
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getStatusBadge(row.status)}
          <select 
            value={row.status}
            onChange={(e) => handleStatusChange(row.id, e.target.value as any)}
            className="medx-select"
            style={{ width: '100px', height: '24px', padding: '0 4px', fontSize: '10px', borderRadius: '4px' }}
          >
            <option value="On Duty">On Duty</option>
            <option value="On Break">On Break</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
      )
    },
    { 
      key: 'rating', 
      header: 'Rating', 
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
          <Star size={12} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
          {row.rating.toFixed(1)}
        </span>
      )
    },
    { key: 'shift', header: 'Active Shift Block' },
    { key: 'attendance', header: 'Attendance', render: (row) => <Badge variant={row.attendance === 'Present' ? 'success' : 'danger'}>{row.attendance}</Badge> },
    { 
      key: 'location', 
      header: 'Live GPS coordinate zone', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="medx-caption">
          <MapPin size={12} />
          {row.location}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Rider Roster Registry" 
        description="Verify courier dispatch rider duty attendance sheets, log ratings, and update active breaks."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="medx-section">Courier Roster List</h3>
        <Table 
          columns={columns}
          data={riders}
          keyExtractor={(row) => row.id}
        />
      </div>

    </div>
  );
};
export default Riders;
