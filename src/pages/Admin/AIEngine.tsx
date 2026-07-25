import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Sparkles, Save, Database, Shield } from 'lucide-react';

export const AIEngine: React.FC = () => {
  const toastManager = useToast();

  const [activeModel, setActiveModel] = useState('Gemini 1.5 Pro');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(85);
  
  // Prompts config
  const [triagePrompt, setTriagePrompt] = useState(
    'You are a clinical triage agent. Evaluate patient symptoms and extract severity levels from ECE-1 to ECE-5.'
  );
  const [gisPrompt, setGisPrompt] = useState(
    'Optimize transport coordinates routing. Verify hospital and blood bank locations within delivery boundaries.'
  );

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/system/ai-config');
        const data = await res.json();
        if (data.success && data.config) {
          const cfg = data.config;
          if (cfg.active_model) setActiveModel(cfg.active_model);
          if (cfg.confidence_threshold) setConfidenceThreshold(Number(cfg.confidence_threshold));
          if (cfg.triage_prompt) setTriagePrompt(cfg.triage_prompt);
          if (cfg.gis_prompt) setGisPrompt(cfg.gis_prompt);
        }
      } catch (err) {
        console.error('Failed to fetch AI configurations:', err);
      }
    };
    fetchConfig();
  }, []);

  const saveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/system/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeModel,
          confidenceThreshold,
          triagePrompt,
          gisPrompt
        })
      });
      const data = await res.json();
      if (data.success) {
        toastManager.addToast('AI Engine configurations saved successfully to SQLite.', 'success');
      } else {
        toastManager.addToast('Failed to save AI configurations.', 'danger');
      }
    } catch (err) {
      console.error(err);
      toastManager.addToast('Failed to save AI configurations.', 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="AI Engine Configuration" 
        description="Verify LLM model provider profiles, manage core system prompt instructions, and adjust confidence thresholds."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: Model config */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
              Model Provider Parameters
            </h3>

            <form onSubmit={saveConfiguration} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="medx-form-group">
                <label className="medx-label">Active LLM Model</label>
                <select 
                  className="medx-select"
                  value={activeModel}
                  onChange={(e) => {
                    setActiveModel(e.target.value);
                    toastManager.addToast(`Model provider switched to ${e.target.value}`, 'info');
                  }}
                  style={{ height: '40px' }}
                >
                  <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Clinical Fine-tuned)</option>
                  <option value="Gemini 1.5 Flash">Gemini 1.5 Flash (Low Latency)</option>
                  <option value="Gemini 1.0 Ultra">Gemini 1.0 Ultra</option>
                </select>
              </div>

              {/* Confidence Threshold slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="medx-label" style={{ margin: 0 }}>Minimum Confidence Threshold</label>
                  <strong style={{ fontSize: '15px', color: 'var(--color-primary)' }}>{confidenceThreshold}%</strong>
                </div>
                
                <input 
                  type="range" 
                  min="50" 
                  max="98" 
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '4px',
                    accentColor: 'var(--color-primary)',
                    cursor: 'pointer'
                  }}
                />
                <span className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>
                  Determines when AI validations fall back to double pharmacist or doctor verification gates.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <Button variant="primary" type="submit">
                  <Save size={14} />
                  Save AI Rules
                </Button>
              </div>
            </form>
          </Card>

          {/* Cache info */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} style={{ color: 'var(--color-secondary)' }} />
              LLM Semantic Cache Ledger
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span className="medx-caption">Cache Hit Rate</span>
                <strong>78.4% (Semantic Sync)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span className="medx-caption">Active Entries Index</span>
                <strong>1,842 prompts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="medx-caption">Tokens Saved (Monthly)</span>
                <strong style={{ color: 'var(--color-success)' }}>284k tokens ($142 saving)</strong>
              </div>
            </div>
          </Card>

        </div>

        {/* Right: Prompts Manager */}
        <Card shadow="sm" hoverLift={false}>
          <h3 className="medx-card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: 'var(--color-primary)' }} />
            System Instructions (Prompt Manager)
          </h3>
          <p className="medx-caption" style={{ marginBottom: '20px' }}>
            Modify system instructions parsed before clinical telemetry evaluations.
          </p>

          <form onSubmit={saveConfiguration} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="medx-form-group">
              <label className="medx-label">Triage Agent System Prompt</label>
              <textarea 
                className="medx-input"
                value={triagePrompt}
                onChange={(e) => setTriagePrompt(e.target.value)}
                style={{ height: '100px', padding: '12px', fontSize: '13px', lineHeight: 1.4, borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            <div className="medx-form-group">
              <label className="medx-label">GIS Routing Agent System Prompt</label>
              <textarea 
                className="medx-input"
                value={gisPrompt}
                onChange={(e) => setGisPrompt(e.target.value)}
                style={{ height: '100px', padding: '12px', fontSize: '13px', lineHeight: 1.4, borderRadius: '8px', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" type="submit">
                <Save size={14} />
                Save Prompts
              </Button>
            </div>

          </form>
        </Card>

      </div>
    </div>
  );
};
export default AIEngine;
