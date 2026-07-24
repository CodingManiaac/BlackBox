import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Shield, Thermometer } from 'lucide-react';

export const Settings: React.FC = () => {
  const toastManager = useToast();

  const [fridgeCode, setFridgeCode] = useState('FRG-COLD-01');
  const [license, setLicense] = useState('BB-RED-CROSS-99201');

  // Temp boundaries
  const [minTemp, setMinTemp] = useState(2.0);
  const [maxTemp, setMaxTemp] = useState(6.0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toastManager.addToast('Blood Bank storage settings updated successfully.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Storage Settings" 
        description="Verify licensing credentials, register refrigerator codes, and set storage safety temperature bounds."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Storage credentials */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            Licensing & Accreditation
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input 
              label="Accrediting Authority License ID" 
              value={license} 
              onChange={(e) => setLicense(e.target.value)} 
            />
            <Input 
              label="Primary Refrigerator Identifier Code" 
              value={fridgeCode} 
              onChange={(e) => setFridgeCode(e.target.value)} 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="primary" type="submit">
                Save Storage profiles
              </Button>
            </div>
          </form>
        </Card>

        {/* Right: Temp boundaries settings */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Thermometer size={18} style={{ color: 'var(--color-secondary)' }} />
            Storage Temperature Bounds
          </h3>
          <p className="medx-caption" style={{ marginBottom: '20px' }}>
            Set the lower and upper bounds of thermal tolerances. Deviations will trigger visual emergency dashboard alarms.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <Input 
                  label="Min Temperature Limit (°C)" 
                  type="number"
                  step="0.1"
                  value={minTemp}
                  onChange={(e) => setMinTemp(Number(e.target.value))}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Input 
                  label="Max Temperature Limit (°C)" 
                  type="number"
                  step="0.1"
                  value={maxTemp}
                  onChange={(e) => setMaxTemp(Number(e.target.value))}
                />
              </div>
            </div>

            <Button variant="secondary" onClick={() => {
              setMinTemp(2.0);
              setMaxTemp(6.0);
              toastManager.addToast('Temperature boundaries reset to clinic default (2.0°C - 6.0°C).', 'info');
            }}>
              Reset to Clinic Default
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
};
export default Settings;
