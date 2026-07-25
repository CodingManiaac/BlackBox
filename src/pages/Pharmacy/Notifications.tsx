import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Bell, Flame, ShieldAlert, CheckCircle, Trash2 } from 'lucide-react';

interface PharmacyNotification {
  id: string;
  title: string;
  category: 'Emergency' | 'Low Stock' | 'Expiry Warning' | 'System';
  description: string;
  time: string;
}

export const Notifications: React.FC = () => {
  const toastManager = useToast();
  const [alerts, setAlerts] = useState<PharmacyNotification[]>([]);

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

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/workflow/notifications/role?role=pharmacy&recipientId=${encodeURIComponent(pharmacyName)}`);
      const data = await res.json();
      if (data.success) {
        const mapped: PharmacyNotification[] = data.notifications.map((n: any) => {
          let category: 'Emergency' | 'Low Stock' | 'Expiry Warning' | 'System' = 'System';
          let title = 'System Update';
          if (n.message.toLowerCase().includes('emergency') || n.message.toLowerCase().includes('critical') || n.message.toLowerCase().includes('life threatening')) {
            category = 'Emergency';
            title = 'Emergency Notification';
          } else if (n.message.toLowerCase().includes('low stock') || n.message.toLowerCase().includes('inventory shortage') || n.message.toLowerCase().includes('buffer limit')) {
            category = 'Low Stock';
            title = 'Low Stock Alert';
          } else if (n.message.toLowerCase().includes('expiry') || n.message.toLowerCase().includes('vials') || n.message.toLowerCase().includes('expired')) {
            category = 'Expiry Warning';
            title = 'Expiry Warning Watch';
          } else if (n.message.toLowerCase().includes('order') || n.message.toLowerCase().includes('request') || n.message.toLowerCase().includes('accepted') || n.message.toLowerCase().includes('cancell')) {
            category = 'Emergency';
            title = 'Order Status Change';
          }
          return {
            id: n.id,
            title: title,
            category: category,
            description: n.message,
            time: new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });
        setAlerts(mapped);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const eventSource = new EventSource('http://localhost:3001/api/workflow/stream');
    eventSource.onmessage = () => {
      fetchNotifications();
    };

    return () => eventSource.close();
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/workflow/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
      toastManager.addToast('Notification dismissed.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllAlerts = async () => {
    try {
      await fetch('http://localhost:3001/api/workflow/notifications/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'pharmacy', recipientId: pharmacyName })
      });
      fetchNotifications();
      toastManager.addToast('All pharmacy notifications cleared.', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (category: PharmacyNotification['category']) => {
    switch(category) {
      case 'Emergency':
        return <Flame size={18} style={{ color: 'var(--color-danger)' }} />;
      case 'Low Stock':
        return <ShieldAlert size={18} style={{ color: 'var(--color-warning)' }} />;
      case 'Expiry Warning':
        return <Bell size={18} style={{ color: '#EA580C' }} />;
      default:
        return <CheckCircle size={18} style={{ color: 'var(--color-primary)' }} />;
    }
  };

  const getCategoryBadge = (category: PharmacyNotification['category']) => {
    switch(category) {
      case 'Emergency':
        return <Badge variant="danger">{category}</Badge>;
      case 'Low Stock':
        return <Badge variant="warning">{category}</Badge>;
      case 'Expiry Warning':
        return <Badge variant="warning">Expiry</Badge>;
      default:
        return <Badge variant="info">{category}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Alarms & Notifications" 
        description="Address system notifications, low stock warnings, batch expiry dates, and emergency broadcasts."
        actions={
          alerts.length > 0 && (
            <Button variant="secondary" onClick={clearAllAlerts}>
              <Trash2 size={14} />
              Clear All Alarms
            </Button>
          )
        }
      />

      {alerts.length === 0 ? (
        <Card hoverLift={false} style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-secondary)' }}>
            <CheckCircle size={48} style={{ margin: '0 auto 16px auto', color: 'var(--color-success)' }} />
            <h4 className="medx-card-title">All alarms resolved!</h4>
            <p className="medx-caption" style={{ marginTop: '4px' }}>No active stock or emergency notifications pending check.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '720px' }}>
          {alerts.map(alert => (
            <Card 
              key={alert.id} 
              shadow="sm" 
              hoverLift={false} 
              style={{
                borderLeft: alert.category === 'Emergency' ? '4px solid var(--color-danger)' : '1px solid var(--color-border)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                padding: '16px 20px'
              }}
            >
              {/* Visual Category Icon */}
              <div style={{
                backgroundColor: '#F8FAFC',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getAlertIcon(alert.category)}
              </div>

              {/* Text content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)' }}>{alert.title}</strong>
                    {getCategoryBadge(alert.category)}
                  </div>
                  <span className="medx-caption" style={{ fontSize: '11px' }}>{alert.time}</span>
                </div>
                <p className="medx-caption" style={{ fontSize: '12px', lineHeight: 1.4 }}>{alert.description}</p>
              </div>

              {/* Action Close */}
              <Button 
                variant="ghost" 
                style={{ height: '32px', padding: '0 8px', fontSize: '11px', flexShrink: 0 }}
                onClick={() => handleDismiss(alert.id)}
              >
                Dismiss
              </Button>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
export default Notifications;
