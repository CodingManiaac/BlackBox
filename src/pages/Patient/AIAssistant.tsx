import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useToast } from '../../hooks/useToast';
import { Send, Bot, Volume2, Globe, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

const GREETINGS: Record<string, string> = {
  en: 'Hello Vishu, I am your MedX AI Assistant. Ask me clinical dosage guides, symptom check directions, or prescription explanations.',
  es: 'Hola Vishu, soy tu Asistente de IA de MedX. Pregúntame sobre guías de dosis clínicas, síntomas o explicaciones de recetas.',
  hi: 'नमस्ते विशु, मैं आपका मेडएक्स एआई सहायक हूँ। मुझसे नैदानिक खुराक गाइड, लक्षण जांच निर्देश, या नुस्खे के स्पष्टीकरण पूछें।',
  fr: 'Bonjour Vishu, je suis votre assistant IA MedX. Demandez-moi des guides de dosage clinique, des bilans de symptômes ou des explications d\'ordonnances.'
};

export const AIAssistant: React.FC = () => {
  const toastManager = useToast();

  const [language, setLanguage] = useState<'en' | 'es' | 'hi' | 'fr'>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [speakerActive, setSpeakerActive] = useState(false);

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
    const saved = localStorage.getItem(`medx_chat_messages_${patientId}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    setMessages([
      { id: 'greet', sender: 'ai', text: GREETINGS[language] }
    ]);
  }, [language, patientId]);

  // Persist messages to localStorage on change
  useEffect(() => {
    if (messages.length > 0) {
      if (messages.length === 1 && messages[0].id === 'greet') {
        return;
      }
      localStorage.setItem(`medx_chat_messages_${patientId}`, JSON.stringify(messages));
    }
  }, [messages, patientId]);

  const handleSend = (text = inputText) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: trimmed
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    const prompt = `You are the MedX AI Assistant. You help the patient with:
1. Medicine Queries (dosages, side effects, interactions)
2. Symptom Guidance (basic health advice, non-diagnostic)
3. Order Help (checking orders, returns, refills)
4. Blood Availability Queries (blood groups like O+, O-, etc.)
5. Emergency Guidance (distress, SOS check, hospital routing)

Rules:
- Be concise, supportive, and professional.
- Refer the user to the SOS button if their symptoms sound urgent (e.g. chest pain, severe breathing difficulty).
- Respond in the requested language (current: ${language}).
- Here is the conversation history:
${messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

User: ${trimmed}
AI:`;

    (async () => {
      let responseText = '';
      try {
        const res = await fetch('http://localhost:3001/api/system/chat-assistant', {
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
        console.error('Gemini error:', err);
        responseText = `Gemini API Error: ${err.message || 'Connection failed'}. Please verify that the "Generative Language API" is enabled for your project key in Google AI Studio.`;
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: responseText
      };
      setMessages(prev => [...prev, aiMsg]);
    })();
  };

  // Preset query buttons
  const runPresetQuery = (queryText: string) => {
    handleSend(queryText);
  };

  // Toggle speech simulator
  const toggleVoiceAssistant = () => {
    if (speakerActive) {
      setSpeakerActive(false);
      toastManager.addToast('Voice Assistant speech engine deactivated.', 'info');
    } else {
      setSpeakerActive(true);
      toastManager.addToast('Voice Assistant activated. Synthesizing greeting speech...', 'success');
      // Speak greeting
      const utterance = new SpeechSynthesisUtterance(GREETINGS[language]);
      utterance.lang = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : language === 'hi' ? 'hi-IN' : 'fr-FR';
      utterance.onend = () => setSpeakerActive(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="🤖 AI Health Assistant" 
        description="Consult clinical Q&A models, translate prescription summaries, and synthesize speech diagnostics guides."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Language Toggler */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 12px', height: '40px' }}>
              <Globe size={16} style={{ color: 'var(--color-text-secondary)' }} />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', fontWeight: 600 }}
              >
                <option value="en">English (US)</option>
                <option value="es">Español (ES)</option>
                <option value="hi">हिन्दी (IN)</option>
                <option value="fr">Français (FR)</option>
              </select>
            </div>

            {/* Voice assistant trigger */}
            <Button variant="secondary" onClick={toggleVoiceAssistant}>
              <Volume2 size={16} className={speakerActive ? 'pulse-voice' : ''} />
              {speakerActive ? 'Voice Reading...' : 'Listen Voice AI'}
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Chat Area */}
        <Card shadow="sm" hoverLift={false} style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: '24px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px', flexShrink: 0 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37,99,235,0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '15px' }}>MedX-Agent-Core</strong>
                <Badge variant="info">Online</Badge>
              </div>
              <span className="medx-caption" style={{ fontSize: '11px' }}>Clinical Large Language Model v2.5</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 4px' }}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    backgroundColor: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isUser ? '#FFFFFF' : 'var(--color-text-primary)',
                    border: isUser ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    borderRadius: isUser ? '12px 12px 0 12px' : '0 12px 12px 12px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    maxWidth: '80%',
                    boxShadow: isUser ? 'none' : 'var(--shadow-xs)',
                    lineHeight: 1.4
                  }}
                >
                  {msg.text}
                </div>
              );
            })}
          </div>

          {/* Form input send */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', flexShrink: 0 }}>
            <input 
              type="text" 
              className="medx-input" 
              placeholder="Ask about side effects, check symptoms..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{ height: '40px', borderRadius: '10px' }}
            />
            <Button variant="primary" onClick={() => handleSend()} style={{ height: '40px', width: '44px', padding: 0 }}>
              <Send size={16} />
            </Button>
          </div>

        </Card>

        {/* Right Column: Predefined queries templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '12px' }}>
              <Sparkles size={18} />
              <h3 className="medx-card-title" style={{ margin: 0 }}>Common Care Prompts</h3>
            </div>
            <p className="medx-caption" style={{ marginBottom: '16px' }}>Select clinical queries to run immediate simulated analysis:</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={() => runPresetQuery('Explain my Metformin dosage side effects')}
                style={{ textAlign: 'left', cursor: 'pointer', padding: '12px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '8px', width: '100%' }}
                className="medx-button-ghost"
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>💊 Metformin Side Effects</div>
                <div className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>Check food interactions and dosage steps.</div>
              </button>

              <button 
                onClick={() => runPresetQuery('Symptom check: dry cough started yesterday')}
                style={{ textAlign: 'left', cursor: 'pointer', padding: '12px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '8px', width: '100%' }}
                className="medx-button-ghost"
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>🫁 Dry Cough Symptom Check</div>
                <div className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>Evaluate lisinopril/Zestril side-effects.</div>
              </button>

              <button 
                onClick={() => runPresetQuery('How do I process an order refund?')}
                style={{ textAlign: 'left', cursor: 'pointer', padding: '12px', backgroundColor: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '8px', width: '100%' }}
                className="medx-button-ghost"
              >
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>📦 Refund & Order Inquiries</div>
                <div className="medx-caption" style={{ fontSize: '11px', marginTop: '2px' }}>Guide to cancel orders or claim refunds.</div>
              </button>
            </div>
          </Card>

          <Card shadow="sm" hoverLift={false} style={{ backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }}>
            <h4 style={{ color: '#6B21A8', fontSize: '14px', fontWeight: 700, margin: 0 }}>Clinical Safety Boundary</h4>
            <p className="medx-caption" style={{ color: '#8B5CF6', marginTop: '6px', lineHeight: 1.4 }}>
              The AI Health Assistant provides diagnostic references and information. It is not an emergency dispatch dispatcher. In severe conditions, always trigger the SOS dispatch immediately.
            </p>
          </Card>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseVoice {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .pulse-voice {
          animation: pulseVoice 0.6s infinite alternate;
        }
      `}} />

    </div>
  );
};
export default AIAssistant;
