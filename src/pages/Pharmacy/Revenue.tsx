import React, { useState, useEffect } from 'react';
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

  const [dailySales, setDailySales] = useState(1840.0);
  const [expenses, setExpenses] = useState(420.0);
  const [profit, setProfit] = useState(1420.0);
  const [gstCollected, setGstCollected] = useState(331.2);
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [topDrugs, setTopDrugs] = useState<TopDrugSales[]>([]);
  const [exporting, setExporting] = useState(false);

  const getPharmacyName = () => {
    const session = localStorage.getItem('medx_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.name || 'Care Pharmacy';
      } catch (e) {}
    }
    return 'Care Pharmacy';
  };
  const pharmacyName = getPharmacyName();

  const fetchFinancials = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        const pharmacyOrders = data.orders.filter((o: any) => o.assigned_pharmacy === pharmacyName);
        
        // Sum total amount for dailySales
        const totalSales = pharmacyOrders.reduce((acc: number, o: any) => acc + (o.total_amount || 0), 0);
        const totalGst = pharmacyOrders.reduce((acc: number, o: any) => acc + (o.tax || 0), 0);
        const estimatedExpenses = totalSales * 0.25; // 25% cost of goods/overhead
        
        setDailySales(totalSales);
        setGstCollected(totalGst);
        setExpenses(estimatedExpenses);
        setProfit(totalSales - estimatedExpenses);

        // Map transactions
        const mappedTxns: SalesTransaction[] = pharmacyOrders.map((o: any, idx: number) => ({
          id: `TXN-0${idx + 100}`,
          item: o.medicine,
          qty: o.quantity,
          revenue: o.total_amount,
          gstPaid: o.tax,
          time: new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }));
        setTransactions(mappedTxns);

        // Map top drugs
        const drugSalesMap: Record<string, { packs: number; rev: number }> = {};
        for (const o of pharmacyOrders) {
          if (!drugSalesMap[o.medicine]) {
            drugSalesMap[o.medicine] = { packs: 0, rev: 0 };
          }
          drugSalesMap[o.medicine].packs += o.quantity;
          drugSalesMap[o.medicine].rev += o.total_amount;
        }
        const sortedDrugs: TopDrugSales[] = Object.entries(drugSalesMap)
          .map(([name, val]) => ({
            rank: 0,
            name,
            packsSold: val.packs,
            revenue: val.rev
          }))
          .sort((a, b) => b.packsSold - a.packsSold)
          .map((item, idx) => ({ ...item, rank: idx + 1 }));
        
        setTopDrugs(sortedDrugs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

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
