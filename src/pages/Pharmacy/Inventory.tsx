import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { useToast } from '../../hooks/useToast';
import { Plus, Camera, Search } from 'lucide-react';

interface StockItem {
  id: string;
  name: string;
  generic: string;
  units: number;
  batchCode: string;
  expiry: string;
  supplier: string;
  status: 'Adequate' | 'Low Stock' | 'Out of Stock';
}

export const Inventory: React.FC = () => {
  const toastManager = useToast();

  const [stock, setStock] = useState<StockItem[]>([
    { id: 'INV-01', name: 'Atorvastatin 20mg', generic: 'Lipitor', units: 12, batchCode: 'B-AT992', expiry: '2028-04-12', supplier: 'Aalee Pharma Distributors', status: 'Low Stock' },
    { id: 'INV-02', name: 'Metformin 500mg', generic: 'Glucophage', units: 145, batchCode: 'B-MET20', expiry: '2027-10-30', supplier: 'Global Drug Sync Corp', status: 'Adequate' },
    { id: 'INV-03', name: 'Lisinopril 10mg', generic: 'Zestril', units: 98, batchCode: 'B-LIS88', expiry: '2029-01-15', supplier: 'Apex Clinical Supplies', status: 'Adequate' },
    { id: 'INV-04', name: 'Insulin Glargine 100 U', generic: 'Lantus', units: 0, batchCode: 'B-INS02', expiry: '2026-09-08', supplier: 'MedX Prime Logistics', status: 'Out of Stock' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [purchaseOrderOpen, setPurchaseOrderOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerScanning, setScannerScanning] = useState(false);

  // Form states for Purchase Order
  const [poName, setPoName] = useState('');
  const [poQty, setPoQty] = useState(50);
  const [poSupplier, setPoSupplier] = useState('Aalee Pharma Distributors');

  // Barcode Scanner Simulator triggering restock
  const triggerScanner = () => {
    setScannerOpen(true);
    setScannerScanning(true);

    setTimeout(() => {
      setScannerScanning(false);
      setScannerOpen(false);
      
      // Simulate restocking Atorvastatin from 12 -> 62 units
      setStock(prev => prev.map(item => {
        if (item.name === 'Atorvastatin 20mg') {
          return { ...item, units: item.units + 50, status: 'Adequate' };
        }
        return item;
      }));

      toastManager.addToast('UPC-A Barcode read: Atorvastatin 20mg. Restocked 50 units in database.', 'success');
    }, 3000);
  };

  const handlePurchaseOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poName.trim()) return;

    // Simulate adding custom purchase order alert or updating matching drug stock
    setStock(prev => prev.map(item => {
      if (item.name.toLowerCase().includes(poName.toLowerCase())) {
        return { ...item, units: item.units + Number(poQty), status: 'Adequate' };
      }
      return item;
    }));

    toastManager.addToast(`Purchase order issued: ${poQty} units of ${poName} ordered from ${poSupplier}.`, 'success');
    setPurchaseOrderOpen(false);
    setPoName('');
  };

  const getStatusBadge = (status: StockItem['status']) => {
    switch(status) {
      case 'Adequate':
        return <Badge variant="success">{status}</Badge>;
      case 'Low Stock':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="danger">{status}</Badge>;
    }
  };

  const columns: Column<StockItem>[] = [
    { key: 'name', header: 'Medication', render: (row) => <strong>{row.name}</strong> },
    { key: 'generic', header: 'Active Generic' },
    { key: 'units', header: 'Quantity (Bottles)' },
    { key: 'batchCode', header: 'Batch Code' },
    { key: 'expiry', header: 'Expiry Date' },
    { key: 'status', header: 'Stock State', render: (row) => getStatusBadge(row.status) },
    { key: 'supplier', header: 'Registered Supplier' }
  ];

  const filteredStock = stock.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.generic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Drug Stock & Inventory" 
        description="Audit pharmacy stocks registers, monitor lot batch numbers, and schedule supplier replenishment shipments."
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={triggerScanner}>
              <Camera size={14} />
              Scan Box Barcode
            </Button>
            <Button variant="primary" onClick={() => setPurchaseOrderOpen(true)}>
              <Plus size={14} />
              Issue Purchase Order
            </Button>
          </div>
        }
      />

      {/* Filter search bar */}
      <div style={{ position: 'relative', display: 'flex', gap: '12px', width: '100%', maxWidth: '420px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-secondary)' }} />
        <input 
          type="text" 
          className="medx-input" 
          placeholder="Filter drugs in stock..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '38px', height: '40px' }}
        />
      </div>

      {/* Inventory table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Table 
          columns={columns}
          data={filteredStock}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* Purchase Order Modal */}
      <Modal 
        isOpen={purchaseOrderOpen} 
        onClose={() => setPurchaseOrderOpen(false)} 
        title="Generate Pharmacy Purchase Order"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setPurchaseOrderOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handlePurchaseOrderSubmit}>Issue PO Document</Button>
          </div>
        }
      >
        <form onSubmit={handlePurchaseOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Medication Name" 
            placeholder="e.g. Insulin Glargine" 
            value={poName} 
            onChange={(e) => setPoName(e.target.value)} 
          />
          <Input 
            label="Quantity Order (Units)" 
            type="number"
            value={poQty} 
            onChange={(e) => setPoQty(Number(e.target.value))} 
          />
          <div className="medx-form-group">
            <label className="medx-label">Preferred Supplier</label>
            <select 
              className="medx-select"
              value={poSupplier}
              onChange={(e) => setPoSupplier(e.target.value)}
            >
              <option value="Aalee Pharma Distributors">Aalee Pharma Distributors</option>
              <option value="Global Drug Sync Corp">Global Drug Sync Corp</option>
              <option value="Apex Clinical Supplies">Apex Clinical Supplies</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} title="Camera Barcode Scanner Simulator">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{
            height: '180px',
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            overflow: 'hidden',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '200px',
              height: '100px',
              border: '2px dashed var(--color-primary)',
              borderRadius: '8px',
              position: 'relative'
            }}>
              {scannerScanning && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: 'var(--color-success)',
                  animation: 'scannerLine 2s infinite linear'
                }}></div>
              )}
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes scannerLine {
                0% { top: 0px; }
                50% { top: 100px; }
                100% { top: 0px; }
              }
            `}} />
            <span style={{ position: 'absolute', bottom: '12px', fontSize: '11px', color: '#94A3B8' }}>
              Detecting drug shipment lot codes...
            </span>
          </div>
          <h4 className="medx-card-title">Scanning drug box lot barcodes...</h4>
          <p className="medx-caption" style={{ marginTop: '8px' }}>
            Simulating digital count updates. Atorvastatin 20mg lot B-AT992.
          </p>
        </div>
      </Modal>

    </div>
  );
};
export default Inventory;
