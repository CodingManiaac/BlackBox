import React, { useState, useRef, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useToast } from '../../hooks/useToast';
import { useNavigation } from '../../hooks/useNavigation';
import { ShieldAlert, Clock, Send } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const EmergencyRequest: React.FC = () => {
  const toastManager = useToast();
  const { navigateTo } = useNavigation();

  // Severity Level: ECE-1 to ECE-5
  const [severity, setSeverity] = useState<number>(3);

  // SOS Countdown states
  const [sosCounting, setSosCounting] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);
  const [sosTriggered, setSosTriggered] = useState(false);
  const timerRef = useRef<any>(null);

  const triggerSosApi = async () => {
    try {
      const session = localStorage.getItem('medx_session');
      let patientId = 'PAT-001';
      if (session) {
        const parsed = JSON.parse(session);
        patientId = parsed.associatedId || 'PAT-001';
      }
      const res = await fetch('http://localhost:3001/api/orders/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });
      const data = await res.json();
      if (res.ok) {
        toastManager.addToast('Ambulance dispatch tracked. Redirecting to live map...', 'success');
        setTimeout(() => {
          navigateTo(`/patient/tracking?orderId=${data.orderId}`);
        }, 1500);
      } else {
        toastManager.addToast(data.message || 'Failed to dispatch SOS.', 'danger');
      }
    } catch (e) {
      toastManager.addToast('Network error triggering SOS.', 'danger');
    }
  };

  // Emergency Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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
  
  const patientId = getPatientId();

  // Load initial messages from localStorage or default greeting
  useEffect(() => {
    const saved = localStorage.getItem(`medx_emergency_chat_messages_${patientId}`);
    if (saved) {
      try {
        setChatMessages(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setChatMessages([
      { sender: 'ai', text: 'State your clinical symptoms. I can guide you through immediate safety procedures while we evaluate your telemetry.' }
    ]);
  }, [patientId]);

  // Persist messages to localStorage on change
  useEffect(() => {
    if (chatMessages.length > 0) {
      if (chatMessages.length === 1 && chatMessages[0].text.startsWith('State your clinical symptoms')) {
        return;
      }
      localStorage.setItem(`medx_emergency_chat_messages_${patientId}`, JSON.stringify(chatMessages));
    }
  }, [chatMessages, patientId]);

  // Handle SOS button click
  const triggerSOS = () => {
    if (sosCounting) {
      // Cancel sequence
      if (timerRef.current) clearInterval(timerRef.current);
      setSosCounting(false);
      setSosCountdown(3);
      toastManager.addToast('SOS Countdown cancelled.', 'info');
    } else {
      setSosCounting(true);
      setSosCountdown(3);
      
      timerRef.current = setInterval(() => {
        setSosCountdown(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setSosCounting(false);
            setSosTriggered(true);
            toastManager.addToast('SOS CRITICAL DISPATCH INITIATED!', 'error');
            triggerSosApi();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetSOSState = () => {
    setSosTriggered(false);
    setSosCountdown(3);
  };

  // Preset Symptoms trigger
  const handlePresetSymptom = async (symptom: string) => {
    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: symptom }
    ]);

    const prompt = `You are a clinical guidance assistant. A patient is in a potential emergency situation.
Provide immediate safety precautions, explanation of symptoms, and medical guidance based on their input.
Be concise, clear, and reassuring. If it is life-threatening, tell them to remain calm and prepare for the arriving ambulance.

User: ${symptom}
AI:`;

    try {
      const res = await fetch('http://localhost:3001/api/system/chat-emergency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setChatMessages(prev => [
          ...prev,
          { sender: 'ai', text: data.text }
        ]);
      } else {
        throw new Error(data.message || 'Failed to fetch AI response');
      }
    } catch (err: any) {
      console.error('Gemini failed:', err);
      const errText = `Gemini API Error: ${err.message || 'Connection failed'}. Please verify that the "Generative Language API" is active for your project key in Google AI Studio.`;
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: errText }
      ]);
    }
  };

  // Send Custom Message
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    (async () => {
      let responseText = '';
      try {
        const prompt = `You are a clinical guidance assistant. A patient is in a potential emergency situation.
Provide immediate safety precautions, explanation of symptoms, and medical guidance based on their input.
Be concise, clear, and reassuring. If it is life-threatening, tell them to remain calm and prepare for the arriving ambulance.

User: ${userText}
AI:`;
        const res = await fetch('http://localhost:3001/api/system/chat-emergency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        if (data.success && data.text) {
          responseText = data.text;
        } else {
          throw new Error(data.message || 'Failed to fetch AI response');
        }
      } catch (err: any) {
        console.error('Gemini failed:', err);
        responseText = `Gemini API Error: ${err.message || 'Connection failed'}. Please verify that the "Generative Language API" is active for your project key in Google AI Studio.`;
      }

      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: responseText }
      ]);
    })();
  };

  // Severity Metadata
  const getSeverityMeta = (level: number) => {
    switch(level) {
      case 1:
        return { label: 'ECE-1: Resuscitation (Immediate Life Threat)', color: 'var(--color-danger)', eta: '3 - 5 mins', desc: 'Cardiac arrest, trauma, unconsciousness.' };
      case 2:
        return { label: 'ECE-2: Emergent (High Risk)', color: '#EA580C', eta: '5 - 10 mins', desc: 'Severe chest pains, stroke symptoms, major bleeding.' };
      case 3:
        return { label: 'ECE-3: Urgent (Medium Risk)', color: 'var(--color-warning)', eta: '15 - 25 mins', desc: 'Moderate shortness of breath, fractures, high fevers.' };
      case 4:
        return { label: 'ECE-4: Less Urgent', color: 'var(--color-primary)', eta: '30 - 45 mins', desc: 'Minor fractures, cuts requiring stitches, asthma flareups.' };
      default:
        return { label: 'ECE-5: Non-Urgent (Minor)', color: 'var(--color-success)', eta: '60+ mins', desc: 'Cold/flu checks, dressing replacements, general consults.' };
    }
  };

  const severityMeta = getSeverityMeta(severity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="🚨 SOS Emergency Command" 
        description="Dispatch ambulance coordinates, notify family contacts, and follow clinical AI instructions."
      />

      {/* Main Splits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left column: SOS Trigger & Severity Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SOS Pulsing Button Card */}
          <Card shadow="md" hoverLift={false} style={{ textAlign: 'center', padding: '40px 24px', position: 'relative' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              backgroundColor: sosCounting ? '#EA580C' : '#DC2626',
              border: '8px solid rgba(239, 68, 68, 0.15)',
              boxShadow: sosCounting ? '0 0 0 16px rgba(239, 68, 68, 0.25)' : '0 0 0 8px rgba(239, 68, 68, 0.15)',
              color: 'white',
              cursor: 'pointer',
              marginBottom: '24px',
              transition: 'all 0.3s ease',
              animation: sosCounting ? 'pulse 1s infinite alternate' : 'none'
            }}
            onClick={triggerSOS}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ShieldAlert size={40} />
                <span style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', letterSpacing: '0.02em' }}>
                  {sosCounting ? `CANCEL (${sosCountdown})` : 'TRIGGER SOS'}
                </span>
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes pulse {
                0% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.15); }
                100% { box-shadow: 0 0 0 24px rgba(239, 68, 68, 0.35); }
              }
            `}} />

            {sosTriggered ? (
              <div className="medx-fade-in" style={{ backgroundColor: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--color-danger)', fontSize: '16px', fontWeight: 700, margin: 0 }}>Ambulance Dispatch Confirmed</h4>
                <p className="medx-caption" style={{ marginTop: '4px', lineHeight: 1.4 }}>
                  Vehicle <strong>AMB-201</strong> out for dispatch. GPS location shared. Family members notified via SMS sync.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px' }}>
                  <Badge variant="danger">ETA: 6 mins</Badge>
                  <button className="medx-button medx-button-ghost" style={{ height: '28px', color: 'var(--color-text-primary)' }} onClick={resetSOSState}>
                    Reset Console
                  </button>
                </div>
              </div>
            ) : (
              <p className="medx-caption">
                {sosCounting ? 'Countdown active. Press again to cancel immediate ambulance dispatch.' : 'In an emergency, click the SOS button. A 3-second countdown will start.'}
              </p>
            )}
          </Card>

          {/* Severity slider card */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px' }}>Select Emergency Severity Level</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="medx-caption" style={{ fontWeight: 600 }}>Critical Care</span>
              <span className="medx-caption" style={{ fontWeight: 600 }}>Minor Care</span>
            </div>

            <input 
              type="range" 
              min="1" 
              max="5" 
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '4px',
                accentColor: severityMeta.color,
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            />

            {/* Severity Card Details */}
            <div style={{
              borderLeft: `4px solid ${severityMeta.color}`,
              backgroundColor: '#F8FAFC',
              padding: '16px',
              borderRadius: '0 8px 8px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {severityMeta.label}
              </span>
              <span className="medx-caption" style={{ fontSize: '12px' }}>{severityMeta.desc}</span>
              <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                <span className="medx-caption" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  <Clock size={12} />
                  Est Response: {severityMeta.eta}
                </span>
              </div>
            </div>
          </Card>

        </div>

        {/* Right column: Emergency AI Chat & Nearby Facilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Emergency Chat Box */}
          <Card shadow="sm" hoverLift={false} style={{ height: '360px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="medx-card-title" style={{ marginBottom: '12px' }}>Simulated Clinical Guidance Chat</h3>
            
            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px', flexShrink: 0 }}>
              <button 
                onClick={() => handlePresetSymptom('Heavy chest pain')}
                className="medx-badge medx-badge-danger"
                style={{ cursor: 'pointer', border: '1px solid var(--color-danger-border)', background: 'none' }}
              >
                Heavy chest pain
              </button>
              <button 
                onClick={() => handlePresetSymptom('Severe burns')}
                className="medx-badge medx-badge-warning"
                style={{ cursor: 'pointer', border: '1px solid var(--color-warning-border)', background: 'none' }}
              >
                Severe burns
              </button>
              <button 
                onClick={() => handlePresetSymptom('Severe asthma flareup')}
                className="medx-badge medx-badge-info"
                style={{ cursor: 'pointer', border: '1px solid var(--color-primary-border)', background: 'none' }}
              >
                Asthma flareup
              </button>
            </div>

            {/* Messages Feed */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0', borderTop: '1px solid var(--color-border)' }}>
              {chatMessages.map((msg, idx) => {
                const isUser = msg.sender === 'user';
                return (
                  <div 
                    key={idx} 
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      backgroundColor: isUser ? 'var(--color-primary-soft)' : '#F1F5F9',
                      color: isUser ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      border: isUser ? '1px solid var(--color-primary-border)' : '1px solid var(--color-border)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      maxWidth: '80%'
                    }}
                  >
                    {msg.text}
                  </div>
                );
              })}
            </div>

            {/* Input Send footer */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexShrink: 0 }}>
              <input 
                type="text" 
                className="medx-input" 
                placeholder="Ask clinical safety questions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                style={{ height: '36px' }}
              />
              <Button variant="primary" onClick={sendChatMessage} style={{ width: '40px', height: '36px', padding: 0 }}>
                <Send size={16} />
              </Button>
            </div>
          </Card>

          {/* Nearby Emergency Services list */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px' }}>Nearby Emergency Care Centers</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🏥</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Metro General Hospital</div>
                    <div className="medx-caption" style={{ fontSize: '11px' }}>Trauma Unit Tier 1 • 2.4 km</div>
                  </div>
                </div>
                <Badge variant="success">ETA: 8 mins</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🩸</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Regional Blood Bank Depot</div>
                    <div className="medx-caption" style={{ fontSize: '11px' }}>Red Cross Synced • 3.1 km</div>
                  </div>
                </div>
                <Badge variant="success">ETA: 12 mins</Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>💊</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Aalee 24/7 Pharmacy Store</div>
                    <div className="medx-caption" style={{ fontSize: '11px' }}>Oxygen supplies available • 1.2 km</div>
                  </div>
                </div>
                <Badge variant="success">ETA: 4 mins</Badge>
              </div>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
export default EmergencyRequest;
