import React, { useState } from 'react';
import { useNavigation } from '../../hooks/useNavigation';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/common/Button';
import * as Icons from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { currentPath, navigateTo } = useNavigation();
  const { addToast } = useToast();

  // State variables for inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Map subpaths to role names
  const roleMapping: Record<string, { label: string; desc: string; iconName: string; color: string; defaultUser: string }> = {
    '/login/patient': { label: 'Patient Portal', desc: 'Secure patient diagnostic intake & retail prescription checkout.', iconName: 'Heart', color: '#EF4444', defaultUser: 'patient_demo' },
    '/login/pharmacy': { label: 'Pharmacy Portal', desc: 'Prescription inventory control & checkout dispatch processing.', iconName: 'Pills', color: '#14B8A6', defaultUser: 'pharmacy_demo' },
    '/login/hospital': { label: 'Hospital Portal', desc: 'ICU referrals triage & active emergency clinic coordination.', iconName: 'Activity', color: '#3B82F6', defaultUser: 'hospital_demo' },
    '/login/bloodbank': { label: 'Blood Bank Portal', desc: 'Blood bank request validations & cold-chain stock control.', iconName: 'Droplet', color: '#DC2626', defaultUser: 'bloodbank_demo' },
    '/login/logistics': { label: 'Logistics Portal', desc: 'Dispatch route navigation & active delivery fleet monitoring.', iconName: 'Truck', color: '#F59E0B', defaultUser: 'logistics_demo' },
    '/login/admin': { label: 'Admin Command Center', desc: 'Secure centralized dashboard oversight & AI pipeline monitoring.', iconName: 'Shield', color: '#1E293B', defaultUser: 'admin_demo' }
  };

  const selectedRoleKey = Object.keys(roleMapping).find(path => currentPath.startsWith(path));
  const currentRole = selectedRoleKey ? roleMapping[selectedRoleKey] : null;

  // Retrieve matching standard role key
  const getRoleKey = (path: string): 'Patient' | 'Pharmacy' | 'Hospital' | 'BloodBank' | 'Logistics' | 'Admin' => {
    if (path.includes('patient')) return 'Patient';
    if (path.includes('pharmacy')) return 'Pharmacy';
    if (path.includes('hospital')) return 'Hospital';
    if (path.includes('bloodbank')) return 'BloodBank';
    if (path.includes('logistics')) return 'Logistics';
    return 'Admin';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRole || !selectedRoleKey) return;
    if (!username || !password) {
      addToast('Please enter both username and password.', 'warning');
      return;
    }

    setIsLoading(true);
    const targetRole = getRoleKey(selectedRoleKey);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: targetRole })
      });
      
      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        localStorage.setItem('medx_session', JSON.stringify(data.user));
        addToast(`Successfully authenticated as ${data.user.name}`, 'success');
        navigateTo(`/${targetRole.toLowerCase()}`);
      } else {
        addToast(data.message || 'Authentication failed', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      console.error('[Login] Auth endpoint call failed:', err);
      addToast('Cannot connect to authentication service.', 'error');
    }
  };

  const handleAutofillDemo = () => {
    if (!currentRole) return;
    setUsername(currentRole.defaultUser);
    setPassword('password');
    addToast('Pre-populated demo credentials.', 'info');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* Split screen content container */}
      <div style={{ display: 'flex', flex: 1, flexWrap: 'wrap' }}>
        
        {/* Left Column (55% width) */}
        <div style={{
          flex: '1.2 1 500px',
          backgroundColor: '#F8FAFC',
          borderRight: '1px solid #E2E8F0',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '40px'
        }}>
          
          {/* Top Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Icons.HeartPulse size={20} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>MedXNet</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', letterSpacing: '0.3px' }}>AI-Powered Healthcare Network</div>
            </div>
          </div>

          {/* Main Title, Badge & Isometric Illustration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Pill badge */}
            <div style={{ alignSelf: 'flex-start' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#2563EB',
                backgroundColor: '#EFF6FF',
                padding: '4px 10px',
                borderRadius: '16px',
                letterSpacing: '0.5px'
              }}>
                ● AI-DRIVEN HEALTHCARE INTELLIGENCE
              </span>
            </div>

            <h1 style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: '-0.5px'
            }}>
              MedXNet Command Center
            </h1>

            <p style={{
              fontSize: '15px',
              color: '#475569',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '540px'
            }}>
              An intelligent multi-agent healthcare orchestration platform that connects patients, hospitals, pharmacies, blood banks, and logistics in real-time to deliver critical care—faster.
            </p>

            {/* Illustration SVG Grid */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              height: '240px',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '12px'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

                {/* Network paths */}
                <path d="M 50,160 Q 150,60 250,170 T 350,110" fill="none" stroke="url(#blueGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 5" />
                <path d="M 30,80 Q 180,200 370,50" fill="none" stroke="url(#greenGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

                {/* Telemetry nodes */}
                <circle cx="90" cy="110" r="14" fill="#DBEAFE" opacity="0.6" />
                <circle cx="90" cy="110" r="8" fill="#3B82F6" />
                <circle cx="90" cy="110" r="3" fill="white" />
                
                <circle cx="280" cy="140" r="18" fill="#D1FAE5" opacity="0.6" />
                <circle cx="280" cy="140" r="10" fill="#10B981" />
                <circle cx="280" cy="140" r="4" fill="white" />

                {/* Center shield & cross */}
                <g transform="translate(180, 80)">
                  <ellipse cx="20" cy="65" rx="24" ry="8" fill="#CBD5E1" opacity="0.6" />
                  <path d="M 20,0 L 52,18 L 52,52 L 20,70 L -12,52 L -12,18 Z" fill="url(#blueGrad)" filter="drop-shadow(0px 8px 16px rgba(37, 99, 235, 0.2))" />
                  <path d="M 20,10 L 44,24 L 44,48 L 20,60 L -4,48 L -4,24 Z" fill="white" opacity="0.2" />
                  <path d="M 14,24 H 26 V 32 H 34 V 40 H 26 V 48 H 14 V 40 H 6 V 32 H 14 Z" fill="white" />
                </g>

                <circle cx="280" cy="140" r="10" fill="none" stroke="#10B981" strokeWidth="2" className="pulse-ring" />
                <circle cx="90" cy="110" r="8" fill="none" stroke="#3B82F6" strokeWidth="2" className="pulse-ring" style={{ animationDelay: '1.5s' }} />
              </svg>
            </div>
          </div>

          {/* Feature Grid List */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.Cpu size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>AI Multi-Agent System</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
                  Intelligent agents working together for triage, routing, inventory, and decision support.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#ECFDF5',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.MapPin size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Real-Time GIS Routing</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
                  Live traffic, hospital readiness, and nearest resource routing in critical seconds.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FEF2F2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.ShieldAlert size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Emergency Intelligence</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
                  Automatic priority scoring (EC-1 to EC-5), risk analysis, and resource recommendations.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#FDF4FF',
                color: '#D946EF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.BarChart2 size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Operational Analytics</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B', lineHeight: 1.5 }}>
                  Live dashboards, telemetry, hoax detection, and performance monitoring.
                </p>
              </div>
            </div>
          </div>

          {/* Trusted Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            padding: '12px 16px',
            borderRadius: '12px',
            maxWidth: '480px'
          }}>
            <Icons.ShieldCheck size={18} style={{ color: '#2563EB', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF' }}>
              Trusted by healthcare professionals to save more lives every day.
            </span>
          </div>

        </div>

        {/* Right Column (45% width) */}
        <div style={{
          flex: '0.8 1 400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          backgroundColor: '#FFFFFF'
        }}>
          
          {currentRole && selectedRoleKey ? (
            /* DEDICATED SIGN-IN SCREEN */
            <div style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Back Button */}
              <button 
                onClick={() => navigateTo('/login')}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
              >
                <Icons.ArrowLeft size={14} />
                Back to workspaces
              </button>

              <div style={{
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '36px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.03)'
              }}>
                
                {/* Styled logo header circle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                    boxShadow: '0 4px 6px -1px rgba(37,99,235,0.05)'
                  }}>
                    <Icons.Lock size={20} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Sign In to {currentRole.label.split(' ')[0]}
                    </h2>
                    <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', lineHeight: 1.4, padding: '0 12px' }}>
                      {currentRole.desc}
                    </p>
                  </div>
                </div>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={() => {
                    const isGoogleConfigured = typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
                    if (!isGoogleConfigured) {
                      addToast('Google Sign-In is currently unavailable because the API keys/configuration are missing.', 'warning');
                    } else {
                      // Google Authentication logic goes here
                      addToast('Initiating Google Sign-In...', 'info');
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: 'white',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: (typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.VITE_GOOGLE_CLIENT_ID) ? 'pointer' : 'not-allowed',
                    opacity: (typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.VITE_GOOGLE_CLIENT_ID) ? 1 : 0.6,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    const isGoogleConfigured = typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.VITE_GOOGLE_CLIENT_ID;
                    if (isGoogleConfigured) e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                >
                  {/* Styled G Icon */}
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.785 5.785 0 0 1 8.2 12.75a5.785 5.785 0 0 1 5.79-5.785c2.476 0 4.546 1.583 5.292 3.793l3.96-3.076C20.912 3.72 16.892 1.18 13.99 1.18 7.915 1.18 3 6.095 3 12.17s4.915 10.99 10.99 10.99c6.438 0 11.233-4.524 11.233-11.232 0-.616-.062-1.218-.178-1.796H12.24Z" />
                  </svg>
                  {(typeof import.meta !== 'undefined' && import.meta.env && !!import.meta.env.VITE_GOOGLE_CLIENT_ID) ? 'Continue with Google' : 'Google Sign-In unavailable.'}
                </button>

                {/* Divider OR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }}></div>
                </div>

                {/* Form fields */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Email / Username
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Icons.User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter your email or username"
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 38px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Icons.Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        style={{
                          width: '100%',
                          padding: '10px 38px 10px 38px',
                          borderRadius: '6px',
                          border: '1px solid #D1D5DB',
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '12px',
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember & forgot password link */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Remember me</span>
                    </label>
                    <a href="#forgot" style={{ fontSize: '11px', fontWeight: 600, color: '#2563EB', textDecoration: 'none' }}>
                      Forgot password?
                    </a>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#10B981',
                      border: 'none',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '13px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)'
                    }}
                  >
                    {isLoading ? 'Accessing Center...' : `Access ${currentRole.label.split(' ')[0]}`}
                  </Button>
                </form>

                {/* Demo autofill tip */}
                <div 
                  onClick={handleAutofillDemo}
                  style={{
                    marginTop: '20px',
                    padding: '8px 12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px dashed #E2E8F0',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#64748B',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Demo Autofill: <span style={{ color: '#2563EB' }}>{currentRole.defaultUser} / password</span>
                </div>

                {/* Form Footer */}
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', marginTop: '20px' }}>
                  Don't have an account? <span onClick={() => { window.location.href = "mailto:admin@medxnet.org?subject=MedXNet Account Support Request"; }} style={{ fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>Contact Admin</span>
                </div>

              </div>
            </div>
          ) : (
            /* WORKSPACE SELECTION SCREEN */
            <div style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Choose Your Workspace
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
                  Select the portal you want to access.
                </p>
              </div>

              {/* 2x3 Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                {[
                  { label: 'Patient Portal', path: '/login/patient', icon: '❤️', color: '#EF4444' },
                  { label: 'Pharmacy Portal', path: '/login/pharmacy', icon: '💊', color: '#14B8A6' },
                  { label: 'Hospital Portal', path: '/login/hospital', icon: '🏥', color: '#3B82F6' },
                  { label: 'Blood Bank Portal', path: '/login/bloodbank', icon: '🩸', color: '#DC2626' },
                  { label: 'Logistics Portal', path: '/login/logistics', icon: '🚚', color: '#F59E0B' },
                  { label: 'Admin Command Center', path: '/login/admin', icon: '🛡️', color: '#1E293B' }
                ].map((ws, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigateTo(ws.path)}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      padding: '24px 16px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="premium-ws-card"
                  >
                    <span style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))', transition: 'transform 0.2s ease' }} className="premium-ws-icon">
                      {ws.icon}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>
                      {ws.label}
                    </span>
                    
                    {/* Arrow Indicator */}
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', color: '#94A3B8', transition: 'transform 0.2s ease' }} className="premium-ws-arrow">
                      <Icons.ChevronRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Footer bar across the bottom */}
      <div style={{
        height: '56px',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '0 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
            <Icons.ShieldCheck size={12} style={{ color: '#10B981' }} />
            End-to-End Encrypted
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
            <Icons.Layers size={12} style={{ color: '#2563EB' }} />
            Real-Time Sync
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
            <Icons.CheckCircle2 size={12} style={{ color: '#10B981' }} />
            99.99% Uptime
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
            <Icons.Headphones size={12} style={{ color: '#2563EB' }} />
            24/7 Support
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
          © 2026 MedXNet. All rights reserved.
        </span>
      </div>

      {/* Premium hover transitions styling CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-ws-card:hover {
          transform: translateY(-4px);
          border-color: #3B82F6 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02) !important;
        }
        .premium-ws-card:hover .premium-ws-icon {
          transform: scale(1.1);
        }
        .premium-ws-card:hover .premium-ws-arrow {
          transform: translateX(3px);
          color: #3B82F6 !important;
        }
      `}} />

    </div>
  );
};

export default LoginPage;
