import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useToast } from '../../hooks/useToast';
import { Shield, AlertTriangle, Database } from 'lucide-react';

export const Settings: React.FC = () => {
  const toastManager = useToast();

  const [apiKey, setApiKey] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  // Feature Flags states
  const [enableDrones, setEnableDrones] = useState(true);
  const [enableAICache, setEnableAICache] = useState(true);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/system/config');
        const data = await res.json();
        if (data.success) {
          setApiKey(data.geminiKey || '');
        }
      } catch (err) {
        console.error('Failed to load system config:', err);
      }
    };
    fetchConfig();
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: apiKey })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast('Admin settings parameters saved and persisted successfully.', 'success');
      } else {
        toastManager.addToast(data.message || 'Failed to save settings.', 'danger');
      }
    } catch (err) {
      toastManager.addToast('Network error saving settings.', 'danger');
    }
  };

  const executeDatabaseReset = () => {
    // Simulate reset flushes
    localStorage.clear();
    toastManager.addToast('All local storage mock datasets flushed. Systems re-initialized.', 'success');
    setResetOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Admin Settings" 
        description="Verify backend integration credentials, configure feature flags, and manage database resets."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: General inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--color-primary)' }} />
              Integration Credentials
            </h3>

            <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Gemini API Key Parameter" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
              />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button variant="primary" type="submit">
                  Save Credentials
                </Button>
              </div>
            </form>
          </Card>

          {/* Feature Flags */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px' }}>System Feature Flags</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Enable Autonomous Drone Flights</strong>
                  <div className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>Authorizes quadcopter dispatch missions</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={enableDrones} 
                  onChange={(e) => setEnableDrones(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Enable AI Semantic Caching</strong>
                  <div className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>Caches LLM prompts responses locally</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={enableAICache} 
                  onChange={(e) => setEnableAICache(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </Card>

        </div>

        {/* Right: Danger Zone database flushes */}
        <Card shadow="sm" hoverLift={false} style={{ borderLeft: '4px solid var(--color-danger)', backgroundColor: '#FEF2F2' }}>
          <h3 className="medx-card-title" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
            System Danger Zone
          </h3>
          <p className="medx-caption" style={{ color: '#B91C1C', marginBottom: '20px', lineHeight: 1.4 }}>
            Performing database resets clears all simulated state changes, reloads, and custom mock inventories.
          </p>

          <Button variant="danger" onClick={() => setResetOpen(true)} style={{ display: 'inline-flex', gap: '6px' }}>
            <Database size={14} />
            Reset System Database
          </Button>
        </Card>

      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Confirm System Database Reset"
        footer={
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={executeDatabaseReset}>Approve Reset</Button>
          </div>
        }
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <AlertTriangle size={24} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          <div>
            <p className="medx-caption" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
              Are you sure you want to re-initialize the database?
            </p>
            <p className="medx-caption" style={{ marginTop: '8px', lineHeight: 1.4 }}>
              This will clear all pending order dispatches, reset quadcopter batteries to base defaults, and wipe custom symptom listings.
            </p>
          </div>
        </div>
      </Modal>

    </div>
  );
};
export default Settings;
