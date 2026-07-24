import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import { BarChart2, TrendingUp } from 'lucide-react';

interface MedicineDemand {
  name: string;
  category: string;
  monthlyGrowth: string;
  turnoverRate: string;
}

interface InventoryForecast {
  name: string;
  currentStock: number;
  dailyBurnRate: number;
  estOutDays: number;
  restockDate: string;
}

export const Analytics: React.FC = () => {
  const trendData = [
    { day: 'Mon', sales: 420 },
    { day: 'Tue', sales: 680 },
    { day: 'Wed', sales: 950 },
    { day: 'Thu', sales: 820 },
    { day: 'Fri', sales: 1100 },
    { day: 'Sat', sales: 1400 },
    { day: 'Sun', sales: 900 }
  ];

  const peakHourData = [
    { hour: '08 AM', orders: 12 },
    { hour: '11 AM', orders: 40 },
    { hour: '02 PM', orders: 25 },
    { hour: '05 PM', orders: 35 },
    { hour: '08 PM', orders: 15 }
  ];

  const medicineDemands: MedicineDemand[] = [
    { name: 'Metformin 500mg', category: 'Antidiabetic', monthlyGrowth: '+12%', turnoverRate: '1.4 weeks' },
    { name: 'Atorvastatin 20mg', category: 'Cardiovascular', monthlyGrowth: '+8%', turnoverRate: '2.1 weeks' },
    { name: 'Lisinopril 10mg', category: 'Antihypertensive', monthlyGrowth: '+4%', turnoverRate: '3.5 weeks' }
  ];

  const forecasts: InventoryForecast[] = [
    { name: 'Atorvastatin 20mg', currentStock: 12, dailyBurnRate: 4, estOutDays: 3, restockDate: 'July 18, 2026' },
    { name: 'Insulin Glargine', currentStock: 0, dailyBurnRate: 6, estOutDays: 0, restockDate: 'IMMEDIATE' },
    { name: 'Metformin 500mg', currentStock: 145, dailyBurnRate: 12, estOutDays: 12, restockDate: 'July 27, 2026' }
  ];

  const demandCols: Column<MedicineDemand>[] = [
    { key: 'name', header: 'Medication Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'category', header: 'Therapeutic Class' },
    { key: 'monthlyGrowth', header: 'Growth Rate', render: (row) => <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{row.monthlyGrowth}</span> },
    { key: 'turnoverRate', header: 'Inventory Turnover' }
  ];

  const forecastCols: Column<InventoryForecast>[] = [
    { key: 'name', header: 'Medication Name', render: (row) => <strong>{row.name}</strong> },
    { key: 'currentStock', header: 'Current Units' },
    { key: 'dailyBurnRate', header: 'Daily Burn Rate' },
    { 
      key: 'estOutDays', 
      header: 'Stock Runout', 
      render: (row) => (
        <span style={{ color: row.estOutDays <= 3 ? 'var(--color-danger)' : 'var(--color-text-primary)', fontWeight: row.estOutDays <= 3 ? 600 : 400 }}>
          {row.estOutDays === 0 ? 'Stockout' : `${row.estOutDays} days`}
        </span>
      )
    },
    { key: 'restockDate', header: 'Scheduled Delivery', render: (row) => <span style={{ color: row.restockDate === 'IMMEDIATE' ? 'var(--color-danger)' : 'var(--color-text-secondary)', fontWeight: 600 }}>{row.restockDate}</span> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Pharmacy Analytics & Demand Forecast" 
        description="Monitor sales trends, check peak hourly order volume rates, and audit inventory depletion forecasts."
      />

      {/* Grid of CSS charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Sales trend bar chart */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
            Weekly Sales Revenue Trends
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
            {trendData.map((data, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div 
                  style={{
                    width: '24px',
                    height: `${data.sales * 0.1}px`,
                    backgroundColor: 'rgba(37,99,235,0.08)',
                    borderTop: '2px solid var(--color-primary)',
                    borderRadius: '4px 4px 0 0'
                  }}
                  title={`$${data.sales}`}
                ></div>
                <span className="medx-caption" style={{ fontSize: '10px' }}>{data.day}</span>
              </div>
            ))}
          </div>
          <span className="medx-caption">Weekly Total Revenue: <strong>$6,750.00</strong></span>
        </Card>

        {/* Peak hours order volume chart */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: 'var(--color-secondary)' }} />
            Peak Order Intake Hours
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
            {peakHourData.map((data, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div 
                  style={{
                    width: '24px',
                    height: `${data.orders * 3}px`,
                    backgroundColor: 'rgba(20,184,166,0.08)',
                    borderTop: '2px solid var(--color-secondary)',
                    borderRadius: '4px 4px 0 0'
                  }}
                  title={`${data.orders} orders`}
                ></div>
                <span className="medx-caption" style={{ fontSize: '10px' }}>{data.hour}</span>
              </div>
            ))}
          </div>
          <span className="medx-caption">Peak Demand: <strong>11:00 AM - 1:00 PM</strong></span>
        </Card>

      </div>

      {/* Tables splits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Demands list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Fast Moving Medications</h3>
          <Table 
            columns={demandCols}
            data={medicineDemands}
            keyExtractor={(row) => row.name}
          />
        </div>

        {/* Right: Forecast out times */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Inventory Depletion & Restock Forecast</h3>
          <Table 
            columns={forecastCols}
            data={forecasts}
            keyExtractor={(row) => row.name}
          />
        </div>

      </div>
    </div>
  );
};
export default Analytics;
