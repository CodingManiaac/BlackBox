import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import { Map, AlertCircle, Clock } from 'lucide-react';
import MapPlaceholder from '../../components/widgets/MapPlaceholder';

interface RouteRecord {
  id: string;
  routePath: string;
  durationMinutes: number;
  etaAccuracy: string;
  delaysIncident: string;
}

export const RouteHistory: React.FC = () => {
  const [routesData, setRoutesData] = useState([
    { week: 'Wk 24', duration: 18 },
    { week: 'Wk 25', duration: 14 },
    { week: 'Wk 26', duration: 22 },
    { week: 'Wk 27', duration: 12 },
    { week: 'Wk 28', duration: 15 }
  ]);

  const [historicRoutes, setHistoricRoutes] = useState<RouteRecord[]>([]);

  const fetchRouteHistory = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders');
      const data = await res.json();
      if (data.success) {
        // Filter out completed deliveries
        const completed = data.orders.filter((o: any) => o.status === 'Delivered' || o.status === 'Dispatched');
        const mappedRoutes: RouteRecord[] = completed.map((o: any, idx: number) => {
          const typeStr = o.ece_level <= 2 ? 'Drone Corridor' : 'Ground Route';
          const duration = o.ece_level <= 2 ? 8 + idx % 4 : 20 + idx % 15;
          const accuracy = o.ece_level <= 2 ? '100%' : `${90 - idx % 8}%`;
          const delays = o.ece_level <= 2 ? 'None (Clear air corridor)' : 'None (Traffic clear)';
          return {
            id: `RTE-${o.id.substring(4)}`,
            routePath: `Depot A → ${o.assigned_pharmacy || 'General Pharmacy'} (${typeStr})`,
            durationMinutes: duration,
            etaAccuracy: accuracy,
            delaysIncident: delays
          };
        });
        setHistoricRoutes(mappedRoutes);

        // Group weekly average duration
        const weekSums: Record<string, { total: number; count: number }> = {};
        completed.forEach((o: any, idx: number) => {
          const wk = `Wk ${24 + (idx % 5)}`;
          const dur = o.ece_level <= 2 ? 8 : 20;
          if (!weekSums[wk]) {
            weekSums[wk] = { total: 0, count: 0 };
          }
          weekSums[wk].total += dur;
          weekSums[wk].count += 1;
        });

        const grouped = Object.entries(weekSums).map(([week, v]) => ({
          week,
          duration: Math.round(v.total / v.count)
        }));
        if (grouped.length > 0) {
          setRoutesData(grouped.sort((a, b) => a.week.localeCompare(b.week)));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRouteHistory();
  }, []);

  const columns: Column<RouteRecord>[] = [
    { key: 'id', header: 'Route ID', render: (row) => <strong>{row.id}</strong> },
    { key: 'routePath', header: 'Dispatch Path' },
    { 
      key: 'durationMinutes', 
      header: 'Transit Duration', 
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          {row.durationMinutes} mins
        </span>
      )
    },
    { key: 'etaAccuracy', header: 'ETA Accuracy', render: (row) => <strong style={{ color: 'var(--color-primary)' }}>{row.etaAccuracy}</strong> },
    { key: 'delaysIncident', header: 'Delay Incidents' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Route History & Heatmaps" 
        description="Verify previous shipping logs, review traffic delay heatmaps, and audit ETA accuracies."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Previous Routes table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Historic Dispatch Routes</h3>
          <Table 
            columns={columns}
            data={historicRoutes}
            keyExtractor={(row) => row.id}
          />
        </div>

        {/* Right: AI optimization suggestions & CSS graph */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-warning)', backgroundColor: '#FEFBF0' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#92400E' }}>AI Route Optimization alerts</h4>
                <p className="medx-caption" style={{ color: '#B45309', marginTop: '6px', lineHeight: 1.4 }}>
                  Metro Bypass is experiencing 35% higher congestion volumes during peak hours (11:00 AM - 1:00 PM).
                </p>
                <p className="medx-caption" style={{ color: '#B45309', marginTop: '6px', lineHeight: 1.4 }}>
                  We recommend routing ground shipments via **Trauma Sector Corridor 4** to maintain ETA accuracy limits.
                </p>
              </div>
            </div>
          </Card>

          {/* Average transit duration graph */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Map size={18} style={{ color: 'var(--color-primary)' }} />
              Average Route Duration Trends
            </h3>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              height: '120px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '8px',
              paddingLeft: '16px',
              paddingRight: '16px',
              marginBottom: '12px'
            }}>
              {routesData.map((data, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                  <div 
                    style={{
                      width: '24px',
                      height: `${data.duration * 4}px`,
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      borderTop: '2px solid var(--color-primary)',
                      borderRadius: '4px 4px 0 0'
                    }}
                    title={`${data.duration} mins`}
                  ></div>
                  <span className="medx-caption" style={{ fontSize: '10px' }}>{data.week}</span>
                </div>
              ))}
            </div>
            <span className="medx-caption">Average Duration: <strong>16.2 Minutes</strong></span>
          </Card>

          <MapPlaceholder title="Live Dispatch Route Coordinates" description="Tracking active ground deliveries and drone corridors." />
        </div>

      </div>
    </div>
  );
};
export default RouteHistory;
