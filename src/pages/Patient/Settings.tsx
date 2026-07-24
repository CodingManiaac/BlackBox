import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import { User, Shield, Info, Plus, X } from 'lucide-react';

export const Settings: React.FC = () => {
  const toastManager = useToast();
  const { theme, toggleTheme } = useTheme();

  // Profile State
  const [profileName, setProfileName] = useState('Vishu Kumar');
  const [profileEmail, setProfileEmail] = useState('vishu.kumar@medxnet.hq');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState('');
  const [language, setLanguage] = useState('en');

  // Allergies state list
  const [allergies, setAllergies] = useState<string[]>(['Penicillin', 'Sulfa Drugs', 'Aspirin']);
  const [newAllergy, setNewAllergy] = useState('');

  // DPDP privacy consent states
  const [consentActive, setConsentActive] = useState(true);
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // Notification toggles
  const [smsNotify, setSmsNotify] = useState(true);
  const [emailNotify, setEmailNotify] = useState(false);

  const getPatientId = () => {
    const session = localStorage.getItem('medx_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.associatedId || 'PAT-001';
      } catch (e) {}
    }
    return 'PAT-001';
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const patientId = getPatientId();
        const res = await fetch(`http://localhost:3001/api/patients/${patientId}`);
        const data = await res.json();
        if (data.success && data.patient) {
          const p = data.patient;
          setProfileName(p.name || '');
          setProfileEmail(p.email || '');
          setAddressLine(p.address_line || '');
          setCity(p.city || '');
          setZipCode(p.zip_code || '');
          setEmergencyContacts(p.emergency_contacts || '');
          setSmsNotify(p.sms_notify === 1);
          setEmailNotify(p.email_notify === 1);
          setLanguage(p.language || 'en');
          setConsentActive(p.consent_active === 1);
          if (p.allergies) {
            setAllergies(p.allergies.split(',').map((s: string) => s.trim()).filter(Boolean));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Add allergy tag
  const addAllergyTag = () => {
    const val = newAllergy.trim();
    if (!val) return;
    if (allergies.includes(val)) {
      toastManager.addToast(`Allergy "${val}" is already registered.`, 'warning');
      return;
    }
    setAllergies([...allergies, val]);
    setNewAllergy('');
    toastManager.addToast(`Added allergy: ${val}`, 'success');
  };

  // Remove allergy tag
  const removeAllergyTag = (target: string) => {
    setAllergies(allergies.filter(item => item !== target));
    toastManager.addToast(`Removed allergy: ${target}`, 'info');
  };

  // Save profile changes
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patientId = getPatientId();
      const res = await fetch(`http://localhost:3001/api/patients/${patientId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          addressLine,
          city,
          zipCode,
          emergencyContacts,
          smsNotify: smsNotify ? 1 : 0,
          emailNotify: emailNotify ? 1 : 0,
          language,
          consentActive: consentActive ? 1 : 0,
          allergies: allergies.join(', ')
        })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast('Settings profile changes saved successfully to SQLite.', 'success');
      } else {
        toastManager.addToast(data.message || 'Failed to save settings.', 'danger');
      }
    } catch (err) {
      toastManager.addToast('Network error saving settings.', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Settings & Health Registry" 
        description="Verify medical allergies histories, profile variables, data consent records, and notification targets."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Profile settings form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--color-primary)' }} />
              Personal Profile Info
            </h3>

            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Full Name" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)} 
              />
              <Input 
                label="Registered Email Address" 
                value={profileEmail} 
                onChange={(e) => setProfileEmail(e.target.value)} 
              />
              <Input 
                label="Address Line" 
                value={addressLine} 
                onChange={(e) => setAddressLine(e.target.value)} 
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    label="City" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input 
                    label="Zip Code" 
                    value={zipCode} 
                    onChange={(e) => setZipCode(e.target.value)} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569' }}>Emergency Contacts</label>
                <textarea
                  className="medx-input"
                  style={{ width: '100%', height: '60px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', fontSize: '13px', resize: 'vertical' }}
                  placeholder="Enter emergency contacts (e.g. Spouse: +123456)..."
                  value={emergencyContacts}
                  onChange={(e) => setEmergencyContacts(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button variant="primary" type="submit">
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* DPDP Consent Settings card */}
          <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)' }}>
                <Shield size={18} />
                <h4 className="medx-card-title" style={{ margin: 0, color: 'var(--color-secondary)' }}>DPDP Data Consent</h4>
              </div>
              <button 
                onClick={() => setConsentModalOpen(true)}
                className="medx-button medx-button-ghost"
                style={{ width: '32px', height: '32px', padding: 0 }}
                title="View Privacy Terms"
              >
                <Info size={16} />
              </button>
            </div>
            
            <p className="medx-caption" style={{ marginBottom: '16px', lineHeight: 1.4 }}>
              DPDP Act compliance. Authorize MedXNet to sync telemetry variables between hospitals, blood banks, and pharmacies for immediate care.
            </p>

            <label className="medx-switch-container">
              <span className="medx-switch">
                <input 
                  type="checkbox" 
                  checked={consentActive} 
                  onChange={(e) => {
                    setConsentActive(e.target.checked);
                    toastManager.addToast(`Privacy consent ${e.target.checked ? 'authorized' : 'revoked'}.`, e.target.checked ? 'success' : 'warning');
                  }}
                />
                <span className="medx-slider"></span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Health Data Sync Authorized</span>
            </label>
          </Card>

        </div>

        {/* Right Column: Allergies list tags, Notification settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Allergies list tags */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '8px' }}>Severe Medical Allergies List</h3>
            <p className="medx-caption" style={{ marginBottom: '16px' }}>These tags highlight critical alerts in search and doctor systems.</p>

            {/* Tags area */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {allergies.map(allg => (
                <span 
                  key={allg}
                  className="medx-badge"
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: 'var(--color-danger)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px'
                  }}
                >
                  {allg}
                  <button 
                    onClick={() => removeAllergyTag(allg)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Input tag send */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="medx-input" 
                placeholder="Add drug or food allergy (e.g. Peanuts)..."
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAllergyTag()}
                style={{ height: '38px', borderRadius: '8px' }}
              />
              <Button variant="secondary" onClick={addAllergyTag} style={{ height: '38px', width: '38px', padding: 0 }}>
                <Plus size={16} />
              </Button>
            </div>
          </Card>

          {/* System Toggles */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px' }}>Notification & Language Settings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <label className="medx-checkbox-container">
                <input 
                  type="checkbox" 
                  className="medx-checkbox"
                  checked={smsNotify}
                  onChange={(e) => setSmsNotify(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Alert Emergency Contacts via SMS on SOS trigger</span>
              </label>

              <label className="medx-checkbox-container">
                <input 
                  type="checkbox" 
                  className="medx-checkbox"
                  checked={emailNotify}
                  onChange={(e) => setEmailNotify(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Email PDF copies of completed order invoices</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569' }}>Preferred Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    fontWeight: 500
                  }}
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español (ES)</option>
                  <option value="hi">हिन्दी (IN)</option>
                  <option value="fr">Français (FR)</option>
                </select>
              </div>

            </div>
          </Card>

        </div>

      </div>

      {/* Consent Details Modal */}
      <Modal isOpen={consentModalOpen} onClose={() => setConsentModalOpen(false)} title="DPDP Privacy Consent Clause Details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <strong>Section 6 — Digital Personal Data Protection Act</strong>
          <p className="medx-caption" style={{ lineHeight: 1.4 }}>
            By enabling Data Sync, you consent to MedXNet sharing your registered medical history, severe drug allergies list, and real-time wearables telemetry metrics with:
          </p>
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }} className="medx-caption">
            <li>Dispatching ambulances during ECE emergency responses.</li>
            <li>Registered pharmacies verifying active prescription logs.</li>
            <li>Hospitals checking blood matching and admissions availability.</li>
          </ul>
          <p className="medx-caption" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Consent can be revoked at any time under the portal settings. This will immediately restrict data sync connections.
          </p>
        </div>
      </Modal>

    </div>
  );
};
export default Settings;
