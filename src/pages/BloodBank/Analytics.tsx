import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import { Droplet, BarChart2, TrendingUp } from 'lucide-react';

interface UsageAudit {
  group: string;
  unitsCollected: number;
  unitsTranscharged: number;
  expiryRate: string;
}

export const Analytics: React.FC = () => {
  const collectionData = [
    { month: 'Jan', packs: 84 },
    { month: 'Feb', packs: 96 },
    { month: 'Mar', packs: 120 },
    { month: 'Apr', packs: 110 },
    { month: 'May', packs: 135 },
    { month: 'Jun', packs: 154 }
  ];

  const wasteData = [
    { month: 'Jan', packs: 4 },
    { month: 'Feb', packs: 2 },
    { month: 'Mar', packs: 8 },
    { month: 'Apr', packs: 3 },
    { month: 'May', packs: 1 },
    { month: 'Jun', packs: 0 }
  ];

  const usageTable: UsageAudit[] = [
    { group: 'O-', unitsCollected: 120, unitsTranscharged: 118, expiryRate: '0.8%' },
    { group: 'A+', unitsCollected: 310, unitsTranscharged: 295, expiryRate: '1.2%' },
    { group: 'AB-', unitsCollected: 45, unitsTranscharged: 38, expiryRate: '8.4%' }
  ];

  const usageCols: Column<UsageAudit>[] = [
    { 
      key: 'group', 
      header: 'Blood Group', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', fontWeight: 700 }}>
          <Droplet size={14} />
          {row.group}
        </span>
      )
    },
    { key: 'unitsCollected', header: 'Units Collected' },
    { key: 'unitsTranscharged', header: 'Units Transcharged' },
    { 
      key: 'expiryRate', 
      header: 'Wastage Expiry Rate', 
      render: (row) => (
        <span style={{ color: Number(row.expiryRate.replace('%','')) > 5 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
          {row.expiryRate}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Blood Bank Census Analytics" 
        description="Monitor regional blood collections trend lines, audit wastage ratios, and examine usage demands."
      />

      {/* Grid of CSS Visual graphs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Collections */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-danger)' }} />
            Monthly Blood Packs Collections
          </h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            height: '160px',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '8px',
            paddingLeft: '8px',
            paddingRight: '8px',
            marginBottom: '12px'
          }}>
            {collectionData.map((data, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div 
                  style={{
                    width: '24px',
                    height: `${data.packs * 0.9}px`,
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderTop: '2px solid var(--color-danger)',
                    borderRadius: '4px 4px 0 0'
                  }}
                  title={`${data.packs} packs`}
                ></div>
                <span className="medx-caption" style={{ fontSize: '10px' }}>{data.month}</span>
              </div>
            ))}
          </div>
          <span className="medx-caption">Year-To-Date Collected: <strong>699 Packs</strong></span>
        </Card>

        {/* Wastage */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
            Monthly Disposed / Expired Packs
          </h3>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            height: '160px',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '8px',
            paddingLeft: '8px',
            paddingRight: '8px',
            marginBottom: '12px'
          }}>
            {wasteData.map((data, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div 
                  style={{
                    width: '24px',
                    height: `${data.packs * 15}px`,
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderTop: '2px solid var(--color-primary)',
                    borderRadius: '4px 4px 0 0'
                  }}
                  title={`${data.packs} packs`}
                ></div>
                <span className="medx-caption" style={{ fontSize: '10px' }}>{data.month}</span>
              </div>
            ))}
          </div>
          <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>Wastage Trend: Decreasing (0.0% last month)</span>
        </Card>

      </div>

      {/* Grid splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Usage table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Operational Usage & Wastage audits</h3>
          <Table 
            columns={usageCols}
            data={usageTable}
            keyExtractor={(row) => row.group}
          />
        </div>

      </div>
    </div>
  );
};
export default Analytics;
