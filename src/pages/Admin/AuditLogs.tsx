import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { Clock, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  component: 'Patient' | 'Hospital' | 'Pharmacy' | 'BloodBank' | 'Logistics' | 'System';
  message: string;
  severity: 'Info' | 'Success' | 'Warning' | 'Danger';
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [componentFilter, setComponentFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/admin/audit-logs');
        const data = await res.json();
        if (data.success) {
          const mapped: AuditLog[] = data.logs.map((log: any) => {
            let severity: AuditLog['severity'] = 'Info';
            if (log.error) {
              severity = 'Danger';
            } else if (log.type.includes('SUCCESS') || log.type === 'COMMERCE_ORDER' || log.type.includes('FINISHED')) {
              severity = 'Success';
            } else if (log.type === 'STAGE_UPDATED') {
              severity = 'Warning';
            }
            return {
              id: `LOG-${log.id}`,
              timestamp: new Date(log.timestamp).toLocaleTimeString(),
              component: log.agent_id || log.type,
              message: log.message,
              severity
            };
          });
          setLogs(mapped);
        }
      } catch (err) {
        console.error('Failed loading audit logs:', err);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const compMatch = componentFilter === 'All' || log.component === componentFilter;
    const sevMatch = severityFilter === 'All' || log.severity === severityFilter;
    return compMatch && sevMatch;
  });

  const getSeverityBadge = (sev: AuditLog['severity']) => {
    switch(sev) {
      case 'Danger':
        return <Badge variant="danger">{sev}</Badge>;
      case 'Warning':
        return <Badge variant="warning">{sev}</Badge>;
      case 'Success':
        return <Badge variant="success">{sev}</Badge>;
      default:
        return <Badge variant="info">{sev}</Badge>;
    }
  };

  const columns: Column<AuditLog>[] = [
    { key: 'id', header: 'Log ID', render: (row) => <strong>{row.id}</strong> },
    { 
      key: 'timestamp', 
      header: 'Timestamp', 
      render: (row) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="medx-caption">
          <Clock size={12} />
          {row.timestamp}
        </span>
      )
    },
    { key: 'component', header: 'Module Component', render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.component}</strong> },
    { key: 'message', header: 'Audit Message Log' },
    { key: 'severity', header: 'Severity Code', render: (row) => getSeverityBadge(row.severity) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Event Audit Records" 
        description="Verify chronological ledger entries tracking clinical evaluations, logistical dispatches, and emergency alerts."
      />

      {/* Filter panel */}
      <Card shadow="sm" hoverLift={false}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
            <Filter size={16} />
            <strong style={{ fontSize: '13px' }}>Audit Filter Rules</strong>
          </div>

          <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
            
            <div style={{ flex: 1, minWidth: '150px' }}>
              <select 
                className="medx-select"
                value={componentFilter}
                onChange={(e) => setComponentFilter(e.target.value)}
                style={{ height: '36px', fontSize: '12px' }}
              >
                <option value="All">All Components</option>
                <option value="Patient">Patient Workspace</option>
                <option value="Hospital">Hospital Portal</option>
                <option value="Pharmacy">Pharmacy Portal</option>
                <option value="BloodBank">Blood Bank</option>
                <option value="Logistics">Logistics Hub</option>
                <option value="System">System core</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: '150px' }}>
              <select 
                className="medx-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{ height: '36px', fontSize: '12px' }}
              >
                <option value="All">All Severities</option>
                <option value="Info">Info logs</option>
                <option value="Success">Success logs</option>
                <option value="Warning">Warning logs</option>
                <option value="Danger">Danger alarms</option>
              </select>
            </div>

          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Table 
          columns={columns}
          data={filteredLogs}
          keyExtractor={(row) => row.id}
          emptyMessage="No audit logs matched active filter rules."
        />
      </div>

    </div>
  );
};
export default AuditLogs;
