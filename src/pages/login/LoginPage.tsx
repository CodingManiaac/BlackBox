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

  // Sign Up states
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [signUpEmergency, setSignUpEmergency] = useState('');

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword || !signUpPhone || !signUpAddress || !signUpEmergency) {
      addToast('All registration fields are required.', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName,
          email: signUpEmail,
          password: signUpPassword,
          phone: signUpPhone,
          address: signUpAddress,
          emergencyContact: signUpEmergency
        })
      });
      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success) {
        addToast('Registration successful! Please log in.', 'success');
        setIsSignUp(false);
        setUsername(signUpEmail);
        setSignUpName('');
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpPhone('');
        setSignUpAddress('');
        setSignUpEmergency('');
      } else {
        addToast(data.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      console.error('[SignUp] API failed:', err);
      addToast('Cannot connect to registration service.', 'error');
    }
  };

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
      background: 'radial-gradient(circle at 50% 50%, #0d1e33 0%, #060b14 100%)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Decorative ambient background glows */}
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, rgba(0,0,0,0) 70%)',
        top: '-100px',
        left: '-100px',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(0,0,0,0) 70%)',
        bottom: '-150px',
        right: '-100px',
        pointerEvents: 'none'
      }} />

      {/* Split screen content container */}
      <div style={{ display: 'flex', flex: 1, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
        
        {/* Left Column (55% width) */}
        <div style={{
          flex: '1.2 1 500px',
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
              color: 'white',
              boxShadow: '0 0 15px rgba(16,185,129,0.3)'
            }}>
              <Icons.HeartPulse size={20} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>MedXNet</div>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.3px' }}>AI-Powered Healthcare Network</div>
            </div>
          </div>

          {/* Main Title, Badge & Telemetry Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Pill badge */}
            <div style={{ alignSelf: 'flex-start' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '4px 10px',
                borderRadius: '16px',
                letterSpacing: '0.5px'
              }}>
                ● AI-DRIVEN HEALTHCARE INTELLIGENCE
              </span>
            </div>

            <h1 style={{
              fontSize: '42px',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: '-0.5px'
            }}>
              Care coordination, <span style={{
                background: 'linear-gradient(to right, #10B981, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>delivered in real time</span>
            </h1>

            <p style={{
              fontSize: '15px',
              color: '#94A3B8',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '540px'
            }}>
              An intelligent multi-agent healthcare orchestration platform that connects patients, hospitals, pharmacies, blood banks, and logistics — so critical care arrives faster.
            </p>

            {/* Glowing Heart Rate Telemetry Card */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              height: '56px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              marginTop: '12px',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icons.Activity size={18} style={{ color: '#10B981', filter: 'drop-shadow(0 0 3px rgba(16,185,129,0.5))' }} />
                <svg width="180" height="30" viewBox="0 0 180 30" style={{ opacity: 0.85 }}>
                  <path 
                    d="M 0,15 L 30,15 L 40,5 L 50,25 L 60,15 L 100,15 L 105,2 L 110,28 L 115,15 L 140,15 L 145,10 L 150,20 L 155,15 L 180,15" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{
                      strokeDasharray: '600',
                      strokeDashoffset: '0',
                      filter: 'drop-shadow(0 0 3px rgba(16,185,129,0.6))'
                    }}
                  />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#10B981' }}>
                <Icons.Heart size={14} fill="#EF4444" stroke="none" style={{ animation: 'pulse 1s infinite' }} />
                <span>72 BPM</span>
              </div>
            </div>
          </div>

          {/* Feature Grid List */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                color: '#C084FC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.Cpu size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>AI Multi-Agent System</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                  Agents working together for triage, routing, and decision support.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                color: '#2DD4BF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.MapPin size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Real-Time GIS Routing</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                  Live traffic and nearest-resource routing in critical seconds.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.ShieldAlert size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Emergency Intelligence</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                  Automatic priority scoring (EC-1 to EC-5) and risk analysis.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#4ADE80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icons.BarChart2 size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Operational Analytics</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94A3B8', lineHeight: 1.5 }}>
                  Live dashboards, telemetry, and performance monitoring.
                </p>
              </div>
            </div>
          </div>

          {/* Trusted Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '12px 16px',
            borderRadius: '12px',
            maxWidth: '480px'
          }}>
            <Icons.ShieldCheck size={18} style={{ color: '#10B981', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8' }}>
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
          padding: '48px 32px'
        }}>
          
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '460px'
          }}>
            
            {currentRole && selectedRoleKey ? (
              /* DEDICATED SIGN-IN SCREEN */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Back Button */}
                <button 
                  onClick={() => {
                    if (isSignUp) {
                      setIsSignUp(false);
                    } else {
                      navigateTo('/login');
                    }
                  }}
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
                  {isSignUp ? 'Back to Login' : 'Back to workspaces'}
                </button>

                <div>
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
                      {isSignUp ? <Icons.UserPlus size={20} /> : <Icons.Lock size={20} />}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {isSignUp ? (
                        <>
                          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                            Patient Registration
                          </h2>
                          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', lineHeight: 1.4, padding: '0 12px' }}>
                            Create your MedXNet account to access healthcare resources.
                          </p>
                        </>
                      ) : (
                        <>
                          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                            Sign In to {currentRole.label.split(' ')[0]}
                          </h2>
                          <p style={{ fontSize: '11px', color: '#64748B', marginTop: '6px', lineHeight: 1.4, padding: '0 12px' }}>
                            {currentRole.desc}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {isSignUp ? (
                    /* SIGN UP FORM */
                    <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Full Name</label>
                        <input 
                          type="text" 
                          value={signUpName} 
                          onChange={e => setSignUpName(e.target.value)} 
                          placeholder="e.g. John Doe"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Email Address</label>
                        <input 
                          type="email" 
                          value={signUpEmail} 
                          onChange={e => setSignUpEmail(e.target.value)} 
                          placeholder="vishu@medxnet.hq"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Password</label>
                        <input 
                          type="password" 
                          value={signUpPassword} 
                          onChange={e => setSignUpPassword(e.target.value)} 
                          placeholder="••••••••"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Phone Number</label>
                        <input 
                          type="text" 
                          value={signUpPhone} 
                          onChange={e => setSignUpPhone(e.target.value)} 
                          placeholder="+91-9988776655"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Home Address</label>
                        <input 
                          type="text" 
                          value={signUpAddress} 
                          onChange={e => setSignUpAddress(e.target.value)} 
                          placeholder="128 Main St, New York"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Emergency Contact Details</label>
                        <input 
                          type="text" 
                          value={signUpEmergency} 
                          onChange={e => setSignUpEmergency(e.target.value)} 
                          placeholder="Spouse: +91-9988776644"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '13px', outline: 'none' }}
                        />
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
                          marginTop: '8px',
                          boxShadow: '0 4px 6px -1px rgba(16,185,129,0.2)'
                        }}
                      >
                        {isLoading ? 'Creating Account...' : 'Register Account'}
                      </Button>
                      <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', marginTop: '10px' }}>
                        Already have an account? <span onClick={() => setIsSignUp(false)} style={{ fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>Sign In here</span>
                      </div>
                    </form>
                  ) : (
                    /* SIGN IN FORM */
                    <>
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
                      {selectedRoleKey === '/login/patient' && (
                        <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', marginTop: '20px' }}>
                          Don't have an account? <span onClick={() => setIsSignUp(true)} style={{ fontWeight: 600, color: '#2563EB', cursor: 'pointer' }}>Register here</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

              </div>
            ) : (
              /* WORKSPACE SELECTION SCREEN */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Choose Your Workspace
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
                    Select the portal you want to access.
                  </p>
                </div>

                {/* Live Sessions Pill */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid #F1F5F9',
                  marginTop: '4px',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ● LIVE
                  </span>
                  <span><strong>1,204</strong> sessions</span>
                  <span style={{ color: '#E2E8F0' }}>|</span>
                  <span><strong>42</strong> facilities</span>
                  <span style={{ color: '#E2E8F0' }}>|</span>
                  <span style={{ color: '#2563EB' }}><strong>99.99%</strong> uptime</span>
                </div>

                {/* 2x3 Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  {[
                    { label: 'Patient Portal', path: '/login/patient', icon: <Icons.Heart size={20} />, iconBg: '#FEF2F2', iconColor: '#EF4444' },
                    { label: 'Pharmacy Portal', path: '/login/pharmacy', icon: <Icons.Pill size={20} />, iconBg: '#ECFDF5', iconColor: '#10B981' },
                    { label: 'Hospital Portal', path: '/login/hospital', icon: <Icons.Activity size={20} />, iconBg: '#EEF2FF', iconColor: '#4F46E5' },
                    { label: 'Blood Bank Portal', path: '/login/bloodbank', icon: <Icons.Droplet size={20} />, iconBg: '#FFF5F5', iconColor: '#DC2626' },
                    { label: 'Logistics Portal', path: '/login/logistics', icon: <Icons.Truck size={20} />, iconBg: '#FFFBEB', iconColor: '#D97706' },
                    { label: 'Admin Command Center', path: '/login/admin', icon: <Icons.Shield size={20} />, iconBg: '#F8FAFC', iconColor: '#475569' }
                  ].map((ws, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigateTo(ws.path)}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '20px 16px',
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
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: ws.iconBg,
                        color: ws.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s ease'
                      }} className="premium-ws-icon">
                        {ws.icon}
                      </div>
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

      </div>

      {/* Footer bar across the bottom */}
      <div style={{
        height: '56px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
            <Icons.ShieldCheck size={12} style={{ color: '#10B981' }} />
            End-to-End Encrypted
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
            <Icons.Layers size={12} style={{ color: '#3B82F6' }} />
            Real-Time Sync
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
            <Icons.CheckCircle2 size={12} style={{ color: '#10B981' }} />
            99.99% Uptime
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
            <Icons.Headphones size={12} style={{ color: '#3B82F6' }} />
            24/7 Support
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8' }}>
          © 2026 MedXNet. All rights reserved.
        </span>
      </div>

      {/* Premium hover transitions styling CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
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
