import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { FileText } from 'lucide-react';

interface PatientOrder {
  id: string;
  medication: string;
  date: string;
  status: string;
  cost: number;
  isCancellable: boolean;
  refundEligible: boolean;
  addressLine?: string;
  paymentMethod?: string;
  discount?: number;
  deliveryFee?: number;
  tax?: number;
}

export const Orders: React.FC = () => {
  const toastManager = useToast();

  const [orders, setOrders] = useState<PatientOrder[]>([]);

  const [selectedInvoice, setSelectedInvoice] = useState<PatientOrder | null>(null);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string>('Damaged item');

  const handleSubmitReturn = async () => {
    if (!returnOrderId) return;
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${returnOrderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: returnReason })
      });
      const data = await res.json();
      if (res.ok) {
        toastManager.addToast(data.message, 'success');
        setReturnOrderId(null);
      } else {
        toastManager.addToast(data.message || 'Failed to submit return.', 'danger');
      }
    } catch (e) {
      toastManager.addToast('Network error submitting return.', 'danger');
    }
  };

  useEffect(() => {
    const fetchRealOrders = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/orders');
        const data = await res.json();
        if (data.success) {
          const mapped: PatientOrder[] = data.orders.map((o: any) => ({
            id: o.id,
            medication: (o.medicine || '').includes('(x') ? o.medicine : `${o.medicine || ''} (Qty: ${o.quantity})`,
            date: new Date(o.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            status: o.status === 'Pending' ? 'Placed' : o.status === 'Dispatched' ? 'Out for Delivery' : o.status,
            cost: o.total_amount || 30.00,
            isCancellable: o.status === 'Pending',
            refundEligible: o.status === 'Delivered',
            addressLine: o.address_line || undefined,
            paymentMethod: o.payment_method || undefined,
            discount: o.discount || 0,
            deliveryFee: o.delivery_fee || 0,
            tax: o.tax || 0
          }));
          
          setOrders(mapped);
        }
      } catch (err) {
        console.error('Failed to load patient orders:', err);
      }
    };

    fetchRealOrders();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchRealOrders();
    };

    return () => eventSource.close();
  }, []);

  // Reorder medication
  const handleReorder = (order: PatientOrder) => {
    const newId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: PatientOrder = {
      id: newId,
      medication: order.medication,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      status: 'Placed',
      cost: order.cost,
      isCancellable: true,
      refundEligible: false
    };

    setOrders(prev => [newOrder, ...prev]);
    toastManager.addToast(`Reordered ${order.medication} successfully. Order ID: ${newId}`, 'success');
  };

  // Cancel order
  const handleCancel = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'Cancelled', isCancellable: false };
      }
      return o;
    }));
    toastManager.addToast(`Order ${orderId} cancelled successfully.`, 'info');
  };

  // Request Refund
  const handleRefund = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'Refund Pending', refundEligible: false };
      }
      return o;
    }));
    toastManager.addToast(`Refund requested for order ${orderId}.`, 'warning');
  };

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled' && o.status !== 'Refunded');

  const getStatusBadge = (status: PatientOrder['status']) => {
    switch(status) {
      case 'Delivered':
        return <Badge variant="success">{status}</Badge>;
      case 'Placed':
      case 'Verified':
      case 'Refund Pending':
        return <Badge variant="warning">{status}</Badge>;
      case 'Cancelled':
      case 'Refunded':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="info">{status}</Badge>;
    }
  };

  const columns: Column<PatientOrder>[] = [
    { key: 'id', header: 'Order ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'medication', header: 'Medication Details' },
    { key: 'date', header: 'Transaction Date' },
    { key: 'status', header: 'Delivery State', render: (row) => getStatusBadge(row.status) },
    { key: 'cost', header: 'Bill Value', render: (row) => <span>${row.cost.toFixed(2)}</span> },
    {
      key: 'actions',
      header: 'Actions Panel',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setSelectedInvoice(row)}
            className="medx-button medx-button-ghost"
            style={{ height: '32px', display: 'inline-flex', padding: '0 8px' }}
            title="Download Invoice"
          >
            <FileText size={14} />
          </button>
          
          {row.isCancellable && (
            <Button 
              variant="danger" 
              style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
              onClick={() => handleCancel(row.id)}
            >
              Cancel
            </Button>
          )}

          {row.refundEligible && (
            <Button 
              variant="secondary" 
              style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
              onClick={() => {
                setReturnOrderId(row.id);
                setReturnReason('Damaged item');
              }}
            >
              Return / Refund
            </Button>
          )}

          {row.status === 'Delivered' && (
            <Button 
              variant="secondary" 
              style={{ height: '32px', fontSize: '11px', padding: '0 8px' }}
              onClick={() => handleReorder(row)}
            >
              Reorder
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Orders & Shipments" 
        description="Fulfill order cancellations, process drug refunds, re-order prescriptions, and check shipping invoices."
      />

      {/* 1. Active deliveries timeline tracking */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="medx-section">Active Shipments In Transit</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activeOrders.map(order => (
              <Card key={order.id} shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h4 className="medx-card-title" style={{ fontSize: '15px' }}>
                      {order.medication}
                    </h4>
                    <span className="medx-caption">Order ID: <strong>{order.id}</strong> • Value: ${order.cost.toFixed(2)}</span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Simulated visual timeline progress bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '24px', paddingBottom: '8px' }}>
                  {/* Background link line */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '10%',
                    right: '10%',
                    height: '2px',
                    backgroundColor: '#E5E7EB',
                    zIndex: 1
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '10%',
                    width: order.status === 'Placed' ? '0%' : order.status === 'Verified' ? '40%' : '80%',
                    height: '2px',
                    backgroundColor: 'var(--color-primary)',
                    zIndex: 1,
                    transition: 'width 0.5s ease'
                  }}></div>

                  {['Placed', 'Verified', 'In Transit', 'Delivered'].map((step, idx) => {
                    let stepActive = false;
                    let stepDone = false;

                    if (order.status === 'Placed' && idx === 0) stepActive = true;
                    if (order.status === 'Verified' && idx <= 1) {
                      if (idx === 1) stepActive = true;
                      else stepDone = true;
                    }
                    if (order.status === 'Out for Delivery' && idx <= 2) {
                      if (idx === 2) stepActive = true;
                      else stepDone = true;
                    }

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: stepDone ? 'var(--color-primary)' : stepActive ? 'var(--color-surface)' : '#E5E7EB',
                          border: stepActive ? '2px solid var(--color-primary)' : 'none',
                          boxShadow: stepActive ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {stepDone && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }}></div>}
                        </div>
                        <span className="medx-caption" style={{ marginTop: '8px', fontWeight: stepActive || stepDone ? 600 : 400, color: stepActive || stepDone ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                          {step}
                        </span>
                      </div>
                    );
                  })}

                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2. Orders History table */}
      <div>
        <h3 className="medx-section">Order Transaction History</h3>
        <Table 
          columns={columns}
          data={orders}
          keyExtractor={(row) => row.id}
        />
      </div>

      {/* Invoice Generator Modal */}
      <Modal 
        isOpen={selectedInvoice !== null} 
        onClose={() => setSelectedInvoice(null)} 
        title="MedXNet Billing Invoice"
      >
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div>
                <strong>MEDXNET HEALTH CO.</strong>
                <div className="medx-caption" style={{ fontSize: '11px' }}>Global Health Exchange Core</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="medx-caption">Invoice ID:</span>
                <div><strong>INV-{selectedInvoice.id.substring(4)}</strong></div>
              </div>
            </div>

            <div>
              <span className="medx-caption">Billed To:</span>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Vishu Kumar (Patient Profile)</div>
              <div className="medx-caption" style={{ fontSize: '11px' }}>Date: {selectedInvoice.date}</div>
              {selectedInvoice.addressLine && (
                <div className="medx-caption" style={{ fontSize: '11px', marginTop: '4px' }}>
                  <strong>Shipping Address:</strong> {selectedInvoice.addressLine}
                </div>
              )}
              {selectedInvoice.paymentMethod && (
                <div className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>
                  <strong>Payment Method:</strong> {selectedInvoice.paymentMethod}
                </div>
              )}
            </div>

            <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', marginTop: '8px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }} className="medx-caption">
                <span>Description</span>
                <span>Amount</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)' }} className="medx-caption">
                <span>{selectedInvoice.medication}</span>
                <strong>${(selectedInvoice.cost - (selectedInvoice.deliveryFee || 0) - (selectedInvoice.tax || 0) + (selectedInvoice.discount || 0)).toFixed(2)}</strong>
              </div>
              {selectedInvoice.discount !== undefined && selectedInvoice.discount > 0 && (
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', color: 'var(--color-danger)' }} className="medx-caption">
                  <span>Discount Applied (10% OFF)</span>
                  <strong>-${selectedInvoice.discount.toFixed(2)}</strong>
                </div>
              )}
              {selectedInvoice.deliveryFee !== undefined && (
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }} className="medx-caption">
                  <span>Delivery Charges</span>
                  <strong>${selectedInvoice.deliveryFee.toFixed(2)}</strong>
                </div>
              )}
              {selectedInvoice.tax !== undefined && (
                <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }} className="medx-caption">
                  <span>GST/Taxes (12% Fused)</span>
                  <strong>${selectedInvoice.tax.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
              <span className="medx-caption" style={{ fontWeight: 600 }}>Total Paid:</span>
              <strong style={{ color: 'var(--color-success)', fontSize: '16px' }}>${selectedInvoice.cost.toFixed(2)}</strong>
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                window.print();
                toastManager.addToast('Preparing system printing layout context...', 'success');
              }}
              style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              📥 Download / Print Invoice
            </Button>
          </div>
        )}
      </Modal>

      {/* Return & Refund Reason Modal */}
      <Modal
        isOpen={returnOrderId !== null}
        onClose={() => setReturnOrderId(null)}
        title="⚠️ Request Order Return & Refund"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' }}>
          <p className="medx-caption" style={{ color: 'var(--color-text-secondary)' }}>
            Please select the reason for returning order <strong>{returnOrderId}</strong>. The request will be forwarded to the pharmacy review engine.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Reason for Return</label>
            <select
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              <option value="Damaged item">Damaged / Defective medicine pack</option>
              <option value="Wrong item received">Wrong item received</option>
              <option value="Expired product">Expired product delivered</option>
              <option value="Changed my mind">Changed my mind (Not eligible for refund)</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button variant="ghost" onClick={() => setReturnOrderId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmitReturn}>
              Submit Return Request
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
export default Orders;
