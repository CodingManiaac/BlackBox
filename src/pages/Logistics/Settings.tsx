import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Shield, Navigation } from 'lucide-react';

export const Settings: React.FC = () => {
  const toastManager = useToast();

  const [deliveryRadius, setDeliveryRadius] = useState<number>(15);
  const [trafficProfile, setTrafficProfile] = useState('Dynamic AI Optimized');
  const [speedLimit, setSpeedLimit] = useState(50); // km/h

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toastManager.addToast('Logistics shipping parameters updated successfully.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Logistics Settings" 
        description="Verify geographical delivery radius bounds, adjust traffic profiles, and configure safety speed limits."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: General profiles */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            Shipping Coordinates Rules
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="medx-form-group">
              <label className="medx-label">Traffic Density Profile</label>
              <select 
                className="medx-select"
                value={trafficProfile}
                onChange={(e) => setTrafficProfile(e.target.value)}
                style={{ height: '40px' }}
              >
                <option value="Dynamic AI Optimized">Dynamic AI Optimized</option>
                <option value="Low Congestion Routes Only">Low Congestion Routes Only</option>
                <option value="Express Direct Channels">Express Direct Channels</option>
              </select>
            </div>

            <Input 
              label="Safety Speed Limits (km/h)" 
              type="number"
              value={speedLimit} 
              onChange={(e) => setSpeedLimit(Number(e.target.value))} 
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="primary" type="submit">
                Save Shipping Profile
              </Button>
            </div>
          </form>
        </Card>

        {/* Right: range sliders */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} style={{ color: 'var(--color-secondary)' }} />
            Geographical Shipping Range
          </h3>
          <p className="medx-caption" style={{ marginBottom: '20px' }}>
            Configure the maximum delivery range radius (in kilometers) allowed for automated drone mission authorizations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="medx-caption" style={{ fontWeight: 600 }}>Local Range</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>{deliveryRadius} km</span>
              <span className="medx-caption" style={{ fontWeight: 600 }}>Regional Range</span>
            </div>

            <input 
              type="range" 
              min="5" 
              max="50" 
              value={deliveryRadius}
              onChange={(e) => setDeliveryRadius(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '4px',
                accentColor: 'var(--color-secondary)',
                cursor: 'pointer'
              }}
            />
          </div>
        </Card>

      </div>
    </div>
  );
};
export default Settings;
