import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table, { Column } from '../../components/common/Table';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface MedicineUsage {
  drug: string;
  qtyDispensed: number;
  costValue: number;
}

interface UtilityStats {
  indicator: string;
  utilizationRate: string;
  comparison: string;
}

export const Reports: React.FC = () => {
  const intakeWeeklyData = [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 18 },
    { day: 'Wed', count: 24 },
    { day: 'Thu', count: 15 },
    { day: 'Fri', count: 32 },
    { day: 'Sat', count: 45 },
    { day: 'Sun', count: 20 }
  ];

  const drugUsage: MedicineUsage[] = [
    { drug: 'Metformin 500mg', qtyDispensed: 840, costValue: 1250.00 },
    { drug: 'Atorvastatin 20mg', qtyDispensed: 620, costValue: 2400.00 },
    { drug: 'Insulin Glargine 100 U', qtyDispensed: 95, costValue: 3800.00 }
  ];

  const utilityData: UtilityStats[] = [
    { indicator: 'ICU Beds Occupancy', utilizationRate: '80.0%', comparison: '+4.5% vs last week' },
    { indicator: 'Ventilator Utilization', utilizationRate: '66.6%', comparison: '-2.1% vs last week' },
    { indicator: 'OT Slot Occupancy', utilizationRate: '75.0%', comparison: 'Stable' }
  ];

  const drugCols: Column<MedicineUsage>[] = [
    { key: 'drug', header: 'Medication Name', render: (row) => <strong>{row.drug}</strong> },
    { key: 'qtyDispensed', header: 'Total Dose Packs Dispensed' },
    { key: 'costValue', header: 'Requisition Cost Value', render: (row) => <span>${row.costValue.toFixed(2)}</span> }
  ];

  const utilityCols: Column<UtilityStats>[] = [
    { key: 'indicator', header: 'Resource Indicator', render: (row) => <strong>{row.indicator}</strong> },
    { key: 'utilizationRate', header: 'Utilization Rate', render: (row) => <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{row.utilizationRate}</span> },
    { key: 'comparison', header: 'Census Trend' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Clinical Census Reports" 
        description="Verify monthly bed utilization rates, evaluate operational mortality metrics, and audit drug requisition logs."
      />

      {/* Grid of CSS Visual graphs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* ER Admissions */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-danger)' }} />
            Weekly ER Admissions Intake
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
            {intakeWeeklyData.map((data, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '8px' }}>
                <div 
                  style={{
                    width: '24px',
                    height: `${data.count * 3}px`,
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    borderTop: '2px solid var(--color-danger)',
                    borderRadius: '4px 4px 0 0'
                  }}
                  title={`${data.count} cases`}
                ></div>
                <span className="medx-caption" style={{ fontSize: '10px' }}>{data.day}</span>
              </div>
            ))}
          </div>
          <span className="medx-caption">Weekly Total Intake: <strong>166 Admissions</strong></span>
        </Card>

        {/* General mortality summary */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
            Operational Mortality benchmarks (Monthly)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="medx-caption">Clinical Safety Target</span>
                <span className="medx-caption" style={{ fontWeight: 600 }}>&lt; 0.5%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '38%', backgroundColor: 'var(--color-success)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="medx-caption">Actual Register (Current Month)</span>
                <span className="medx-caption" style={{ fontWeight: 600 }}>0.19%</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '38%', backgroundColor: 'var(--color-success)' }}></div>
              </div>
            </div>
          </div>
          <span className="medx-caption" style={{ color: 'var(--color-success)', fontWeight: 600 }}>Status: Satisfies clinical safety standards</span>
        </Card>

      </div>

      {/* Tables Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Bed utilization stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Bed & Facility Utilization Ratios</h3>
          <Table 
            columns={utilityCols}
            data={utilityData}
            keyExtractor={(row) => row.indicator}
          />
        </div>

        {/* Right: Drug usage audit logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 className="medx-section">Medication Usage Log Volumes</h3>
          <Table 
            columns={drugCols}
            data={drugUsage}
            keyExtractor={(row) => row.drug}
          />
        </div>

      </div>
    </div>
  );
};
export default Reports;
