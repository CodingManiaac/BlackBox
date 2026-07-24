import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useToast } from '../../hooks/useToast';
import { Droplet, Plus, Search } from 'lucide-react';

interface BloodTypeStock {
  group: string;
  wholeBlood: number;
  plasma: number;
  platelets: number;
  reserved: number;
}

export const BloodInventory: React.FC = () => {
  const toastManager = useToast();

  const [inventory, setInventory] = useState<BloodTypeStock[]>([
    { group: 'O-', wholeBlood: 4, plasma: 12, platelets: 8, reserved: 2 },
    { group: 'O+', wholeBlood: 18, plasma: 34, platelets: 25, reserved: 4 },
    { group: 'A-', wholeBlood: 3, plasma: 8, platelets: 6, reserved: 1 },
    { group: 'A+', wholeBlood: 22, plasma: 45, platelets: 30, reserved: 6 },
    { group: 'B-', wholeBlood: 2, plasma: 5, platelets: 4, reserved: 0 },
    { group: 'B+', wholeBlood: 15, plasma: 28, platelets: 18, reserved: 2 },
    { group: 'AB-', wholeBlood: 1, plasma: 3, platelets: 2, reserved: 0 },
    { group: 'AB+', wholeBlood: 8, plasma: 19, platelets: 12, reserved: 1 }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [restockOpen, setRestockOpen] = useState(false);

  // Form states for restocking
  const [restockGroup, setRestockGroup] = useState('O-');
  const [restockComponent, setRestockComponent] = useState<'wholeBlood' | 'plasma' | 'platelets'>('wholeBlood');
  const [restockQty, setRestockQty] = useState(5);

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    setInventory(prev => prev.map(item => {
      if (item.group === restockGroup) {
        return {
          ...item,
          [restockComponent]: item[restockComponent] + restockQty
        };
      }
      return item;
    }));

    toastManager.addToast(`Restocked ${restockQty} packs of ${restockGroup} (${restockComponent === 'wholeBlood' ? 'Whole Blood' : restockComponent === 'plasma' ? 'Plasma' : 'Platelets'}).`, 'success');
    setRestockOpen(false);
  };

  const getStockStatusBadge = (total: number) => {
    if (total === 0) return <Badge variant="danger">Stockout</Badge>;
    if (total < 10) return <Badge variant="warning">Critical</Badge>;
    return <Badge variant="success">Adequate</Badge>;
  };

  const columns: Column<BloodTypeStock>[] = [
    { 
      key: 'group', 
      header: 'Blood Group', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontWeight: 700, fontSize: '15px' }}>
          <Droplet size={16} />
          {row.group}
        </span>
      )
    },
    { key: 'wholeBlood', header: 'Whole Blood (Packs)' },
    { key: 'plasma', header: 'Plasma (Packs)' },
    { key: 'platelets', header: 'Platelets (Packs)' },
    { key: 'reserved', header: 'Reserved Allocated' },
    { 
      key: 'total', 
      header: 'Total Available', 
      render: (row) => {
        const total = row.wholeBlood + row.plasma + row.platelets - row.reserved;
        return <strong>{total} Packs</strong>;
      }
    },
    {
      key: 'status',
      header: 'Stock State',
      render: (row) => {
        const total = row.wholeBlood + row.plasma + row.platelets - row.reserved;
        return getStockStatusBadge(total);
      }
    }
  ];

  const filteredInventory = inventory.filter(item => 
    item.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Blood Inventory Vault" 
        description="Monitor reserves of clinical whole blood, fresh frozen plasma, and platelets across all group matrices."
        actions={
          <Button variant="primary" onClick={() => setRestockOpen(true)}>
            <Plus size={14} />
            Restock Inventory
          </Button>
        }
      />

      {/* Filter search bar */}
      <div style={{ position: 'relative', display: 'flex', gap: '12px', width: '100%', maxWidth: '320px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
        <input 
          type="text" 
          className="medx-input" 
          placeholder="Search blood group..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '38px', height: '40px' }}
        />
      </div>

      {/* Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Table 
          columns={columns}
          data={filteredInventory}
          keyExtractor={(row) => row.group}
        />
      </div>

      {/* Restock Inventory Modal */}
      <Modal
        isOpen={restockOpen}
        onClose={() => setRestockOpen(false)}
        title="Restock Blood Bank Supplies"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setRestockOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRestock}>Approve Restock</Button>
          </div>
        }
      >
        <form onSubmit={handleRestock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="medx-form-group">
            <label className="medx-label">Blood Group Target</label>
            <select 
              className="medx-select"
              value={restockGroup}
              onChange={(e) => setRestockGroup(e.target.value)}
              style={{ height: '40px' }}
            >
              {inventory.map(item => (
                <option key={item.group} value={item.group}>{item.group}</option>
              ))}
            </select>
          </div>

          <div className="medx-form-group">
            <label className="medx-label">Blood Component</label>
            <select 
              className="medx-select"
              value={restockComponent}
              onChange={(e) => setRestockComponent(e.target.value as any)}
              style={{ height: '40px' }}
            >
              <option value="wholeBlood">Whole Blood</option>
              <option value="plasma">Fresh Frozen Plasma</option>
              <option value="platelets">Platelets</option>
            </select>
          </div>

          <Input 
            label="Packs Count to Add" 
            type="number"
            value={restockQty} 
            onChange={(e) => setRestockQty(Number(e.target.value))} 
          />
        </form>
      </Modal>

    </div>
  );
};
export default BloodInventory;
