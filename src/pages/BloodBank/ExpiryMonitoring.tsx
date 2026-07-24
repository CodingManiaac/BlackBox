import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { AlertCircle, Trash2, Send } from 'lucide-react';

interface ExpiringBloodPack {
  id: string;
  bloodType: string;
  expiryState: 'Expired' | 'Expiring Today' | 'Expiring Next Week';
  packsCount: number;
  date: string;
}

export const ExpiryMonitoring: React.FC = () => {
  const toastManager = useToast();

  const [packs, setPacks] = useState<ExpiringBloodPack[]>([
    { id: 'LOT-99201', bloodType: 'AB-', expiryState: 'Expired', packsCount: 1, date: 'Expired July 14' },
    { id: 'LOT-11024', bloodType: 'O-', expiryState: 'Expiring Today', packsCount: 2, date: 'Expires 11:59 PM' },
    { id: 'LOT-43990', bloodType: 'A+', expiryState: 'Expiring Next Week', packsCount: 4, date: 'Expires July 22' }
  ]);

  const handleDispose = (id: string) => {
    setPacks(prev => prev.filter(p => p.id !== id));
    toastManager.addToast(`Expired blood pack lot ${id} safely chemically disposed. Waste ledger updated.`, 'info');
  };

  const handleRedistribute = (id: string, type: string, qty: number) => {
    setPacks(prev => prev.filter(p => p.id !== id));
    toastManager.addToast(`AI Redistribution: Transferred ${qty} packs of ${type} (lot ${id}) to Metro Intensive Care Unit.`, 'success');
  };

  const getExpiryBadge = (state: ExpiringBloodPack['expiryState']) => {
    switch(state) {
      case 'Expired':
        return <Badge variant="danger">{state}</Badge>;
      case 'Expiring Today':
        return <Badge variant="warning">{state}</Badge>;
      default:
        return <Badge variant="info">{state}</Badge>;
    }
  };

  const columns: Column<ExpiringBloodPack>[] = [
    { key: 'id', header: 'Lot Lot ID', render: (row) => <strong>{row.id}</strong> },
    { 
      key: 'bloodType', 
      header: 'Blood Type', 
      render: (row) => <strong style={{ color: 'var(--color-danger)' }}>{row.bloodType}</strong> 
    },
    { key: 'packsCount', header: 'Packs count' },
    { key: 'date', header: 'Limit Date' },
    { key: 'expiryState', header: 'Expiry Status', render: (row) => getExpiryBadge(row.expiryState) },
    {
      key: 'action',
      header: 'Actions Controls',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {row.expiryState === 'Expired' ? (
            <Button 
              variant="danger" 
              style={{ height: '32px', fontSize: '11px', display: 'inline-flex', gap: '4px' }}
              onClick={() => handleDispose(row.id)}
            >
              <Trash2 size={12} />
              Safely Dispose
            </Button>
          ) : (
            <Button 
              variant="primary" 
              style={{ height: '32px', fontSize: '11px', display: 'inline-flex', gap: '4px' }}
              onClick={() => handleRedistribute(row.id, row.bloodType, row.packsCount)}
            >
              <Send size={12} />
              AI Redistribute
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Lot Expiry Monitoring" 
        description="Audit expiring blood packs, trigger safe chemical disposal, and execute pre-emptive AI redistribution."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Disposal lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Expiry Watch & Disposal queue</h3>
          <Table 
            columns={columns}
            data={packs}
            keyExtractor={(row) => row.id}
            emptyMessage="All blood packs lot lines are fresh and safe."
          />
        </div>

        {/* Right: AI redistribution guidelines */}
        <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-secondary)', backgroundColor: '#F0FDFA' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#115E59' }}>AI Redistribution Alerts</h4>
              <p className="medx-caption" style={{ color: '#0F766E', marginTop: '6px', lineHeight: 1.4 }}>
                A lot of 2 packs of **O- Negative** is expiring today. High-usage reports indicate Metro General Hospital ICU has empty stocks of O- blood types.
              </p>
              <p className="medx-caption" style={{ color: '#0F766E', marginTop: '6px', lineHeight: 1.4 }}>
                Click **AI Redistribute** in the table to authorize rider dispatch, preventing clinical wastage.
              </p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};
export default ExpiryMonitoring;
