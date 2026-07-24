import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Shield, Plus, X, Users, MapPin, Clock } from 'lucide-react';

export const Settings: React.FC = () => {
  const toastManager = useToast();

  // License details
  const [license, setLicense] = useState('PH-99201-RX');
  const [pharmacyName, setPharmacyName] = useState('Central Apothecary Plaza');

  // Pharmacists list
  const [pharmacists, setPharmacists] = useState<string[]>(['Dr. Sarah Jenkins', 'Dr. Rajesh Gupta']);
  const [newPharmacist, setNewPharmacist] = useState('');

  // Working hours
  const [workingHours, setWorkingHours] = useState('24 Hours (Open Daily)');

  // Delivery Radius slider
  const [deliveryRadius, setDeliveryRadius] = useState<number>(8);

  const addPharmacistTag = () => {
    const val = newPharmacist.trim();
    if (!val) return;
    if (pharmacists.includes(val)) {
      toastManager.addToast(`${val} is already registered.`, 'warning');
      return;
    }
    setPharmacists([...pharmacists, val]);
    setNewPharmacist('');
    toastManager.addToast(`Added pharmacist: ${val}`, 'success');
  };

  const removePharmacistTag = (target: string) => {
    setPharmacists(pharmacists.filter(p => p !== target));
    toastManager.addToast(`Removed pharmacist: ${target}`, 'info');
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toastManager.addToast('Pharmacy profile settings updated successfully.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Pharmacy Settings" 
        description="Verify active drug dispensing licenses, edit on-duty pharmacists, and adjust delivery dispatch radius."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: License & hours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--color-primary)' }} />
              Dispensing License Credentials
            </h3>

            <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Pharmacy Facility Name" 
                value={pharmacyName} 
                onChange={(e) => setPharmacyName(e.target.value)} 
              />
              <Input 
                label="Drug Retail License Registration ID" 
                value={license} 
                onChange={(e) => setLicense(e.target.value)} 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button variant="primary" type="submit">
                  Save License Profiles
                </Button>
              </div>
            </form>
          </Card>

          {/* Delivery radius slider */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} style={{ color: 'var(--color-secondary)' }} />
              Shipment Dispatch Radius
            </h3>
            
            <p className="medx-caption" style={{ marginBottom: '20px' }}>
              Adjust the geographical delivery bounds (in kilometers) for routing courier coordinates.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="medx-caption" style={{ fontWeight: 600 }}>Local Range</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-secondary)' }}>{deliveryRadius} km</span>
              <span className="medx-caption" style={{ fontWeight: 600 }}>Extended Range</span>
            </div>

            <input 
              type="range" 
              min="2" 
              max="25" 
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
          </Card>

        </div>

        {/* Right Column: Pharmacists tags, Working hours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Pharmacists registry tags */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              Authorized Pharmacists
            </h3>
            <p className="medx-caption" style={{ marginBottom: '16px' }}>Registered clinical pharmacists authorized to sign double verifications.</p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {pharmacists.map(name => (
                <span 
                  key={name}
                  className="medx-badge"
                  style={{
                    backgroundColor: 'var(--color-primary-soft)',
                    border: '1px solid var(--color-primary-border)',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px'
                  }}
                >
                  {name}
                  <button 
                    onClick={() => removePharmacistTag(name)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Input tag */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="medx-input" 
                placeholder="Enter pharmacist name..."
                value={newPharmacist}
                onChange={(e) => setNewPharmacist(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPharmacistTag()}
                style={{ height: '38px', borderRadius: '8px' }}
              />
              <Button variant="secondary" onClick={addPharmacistTag} style={{ height: '38px', width: '38px', padding: 0 }}>
                <Plus size={16} />
              </Button>
            </div>
          </Card>

          {/* Working hours details */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--color-warning)' }} />
              Facility Schedule Bounds
            </h3>

            <div className="medx-form-group">
              <label className="medx-label">Dispensation Working Hours</label>
              <select 
                className="medx-select"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                style={{ height: '40px' }}
              >
                <option value="24 Hours (Open Daily)">24 Hours (Open Daily)</option>
                <option value="08:00 AM - 10:00 PM">08:00 AM - 10:00 PM</option>
                <option value="09:00 AM - 06:00 PM">09:00 AM - 06:00 PM</option>
              </select>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
export default Settings;
