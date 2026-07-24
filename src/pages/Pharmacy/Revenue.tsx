import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { DollarSign, FileText, Download } from 'lucide-react';

interface SalesTransaction {
  id: string;
  item: string;
  qty: number;
  revenue: number;
  gstPaid: number;
  time: string;
}

interface TopDrugSales {
  rank: number;
  name: string;
  packsSold: number;
  revenue: number;
}

export const Revenue: React.FC = () => {
  const toastManager = useToast();

  // Simulated financials
  const dailySales = 1840.00;
  const expenses = 420.00;
  const profit = dailySales - expenses;
  const gstCollected = dailySales * 0.18; // 18% GST

  const [exporting, setExporting] = useState(false);

  const transactions: SalesTransaction[] = [
    { id: 'TXN-0992', item: 'Atorvastatin 20mg', qty: 2, revenue: 49.00, gstPaid: 8.82, time: '11:15 AM' },
    { id: 'TXN-0883', item: 'Metformin 500mg', qty: 5, revenue: 94.50, gstPaid: 17.01, time: '11:02 AM' },
    { id: 'TXN-0742', item: 'Lisinopril 10mg', qty: 1, revenue: 10.20, gstPaid: 1.84, time: '10:45 AM' },
    { id: 'TXN-0504', item: 'Insulin Glargine 100 U', qty: 3, revenue: 255.00, gstPaid: 45.90, time: '09:30 AM' }
  ];

  const topDrugs: TopDrugSales[] = [
    { rank: 1, name: 'Metformin 500mg', packsSold: 42, revenue: 793.80 },
    { rank: 2, name: 'Atorvastatin 20mg', packsSold: 28, revenue: 686.00 },
    { rank: 3, name: 'Lisinopril 10mg', packsSold: 15, revenue: 153.00 }
  ];

  const handleExport = () => {
    setExporting(true);
    toastManager.addToast('Generating pharmacy ledger audit report...', 'info');

    setTimeout(() => {
      setExporting(false);
      toastManager.addToast('Ledger audit report downloaded successfully (INV-Ledger.pdf).', 'success');
    }, 2000);
  };

  const txnCols: Column<SalesTransaction>[] = [
    { key: 'id', header: 'Txn ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'item', header: 'Medication' },
    { key: 'qty', header: 'Qty' },
    { key: 'revenue', header: 'Revenue', render: (row) => <span>${row.revenue.toFixed(2)}</span> },
    { key: 'gstPaid', header: 'GST (18%)', render: (row) => <span>${row.gstPaid.toFixed(2)}</span> },
    { key: 'time', header: 'Time' }
  ];

  const topCols: Column<TopDrugSales>[] = [
    { key: 'rank', header: 'Rank', render: (row) => <span>#{row.rank}</span> },
    { key: 'name', header: 'Medication Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'packsSold', header: 'Units Sold' },
    { key: 'revenue', header: 'Sales Revenue', render: (row) => <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>${row.revenue.toFixed(2)}</span> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Revenue Ledger & Auditing" 
        description="Review drug sales invoices, check GST tax collections, and export daily ledger reports."
        actions={
          <Button variant="primary" onClick={handleExport} disabled={exporting}>
            <Download size={14} />
            {exporting ? 'Generating PDF...' : 'Export Financial Report'}
          </Button>
        }
      />

      {/* Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        
        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--color-primary-soft)', padding: '12px', borderRadius: '12px', color: 'var(--color-primary)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span className="medx-caption">Daily Sales</span>
            <h3 className="medx-title" style={{ fontSize: '24px', margin: 0 }}>${dailySales.toFixed(2)}</h3>
          </div>
        </Card>

        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '12px', borderRadius: '12px', color: 'var(--color-danger)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span className="medx-caption">Operational Expenses</span>
            <h3 className="medx-title" style={{ fontSize: '24px', margin: 0 }}>${expenses.toFixed(2)}</h3>
          </div>
        </Card>

        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--color-success-soft)', padding: '12px', borderRadius: '12px', color: 'var(--color-success)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span className="medx-caption">Net Profit</span>
            <h3 className="medx-title" style={{ fontSize: '24px', margin: 0 }}>${profit.toFixed(2)}</h3>
          </div>
        </Card>

        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.08)', padding: '12px', borderRadius: '12px', color: '#8B5CF6' }}>
            <FileText size={24} />
          </div>
          <div>
            <span className="medx-caption">GST Tax (18% collected)</span>
            <h3 className="medx-title" style={{ fontSize: '24px', margin: 0 }}>${gstCollected.toFixed(2)}</h3>
          </div>
        </Card>

      </div>

      {/* Main Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Side: Recent Sales Ledger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Daily Sales Audit Register</h3>
          <Table 
            columns={txnCols}
            data={transactions}
            keyExtractor={(row) => row.id}
          />
        </div>

        {/* Right Side: Top Selling Drugs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Top Selling Medications</h3>
          <Table 
            columns={topCols}
            data={topDrugs}
            keyExtractor={(row) => row.rank}
          />
        </div>

      </div>
    </div>
  );
};
export default Revenue;
