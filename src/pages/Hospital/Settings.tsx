import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { Shield, Plus, X, Stethoscope, Briefcase } from 'lucide-react';

export const Settings: React.FC = () => {
  const toastManager = useToast();

  const [hospitalName, setHospitalName] = useState('Metro General Hospital');
  const [hospitalCode, setHospitalCode] = useState('HSP-992-CLINIC');

  // Departments editable list
  const [departments, setDepartments] = useState<string[]>(['Trauma Care / ER', 'Intensive Care Unit (ICU)', 'Cardiology', 'Pediatrics']);
  const [newDept, setNewDept] = useState('');

  // Doctors list
  const [doctors, setDoctors] = useState<string[]>(['Dr. Sarah Jenkins', 'Dr. Rajesh Gupta', 'Dr. Michael Vance']);
  const [newDoc, setNewDoc] = useState('');

  // Emergency Rules
  const [autoTriage, setAutoTriage] = useState(true);
  const [notifyLogistics, setNotifyLogistics] = useState(true);

  const addDeptTag = () => {
    const val = newDept.trim();
    if (!val) return;
    if (departments.includes(val)) {
      toastManager.addToast(`Department "${val}" already exists.`, 'warning');
      return;
    }
    setDepartments([...departments, val]);
    setNewDept('');
    toastManager.addToast(`Added department: ${val}`, 'success');
  };

  const removeDeptTag = (target: string) => {
    setDepartments(departments.filter(d => d !== target));
    toastManager.addToast(`Removed department: ${target}`, 'info');
  };

  const addDocTag = () => {
    const val = newDoc.trim();
    if (!val) return;
    if (doctors.includes(val)) {
      toastManager.addToast(`${val} is already registered.`, 'warning');
      return;
    }
    setDoctors([...doctors, val]);
    setNewDoc('');
    toastManager.addToast(`Registered doctor: ${val}`, 'success');
  };

  const removeDocTag = (target: string) => {
    setDoctors(doctors.filter(d => d !== target));
    toastManager.addToast(`Deregistered doctor: ${target}`, 'info');
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    toastManager.addToast('Hospital registry settings saved successfully.', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader 
        title="Hospital Settings" 
        description="Configure department profiles, on-duty clinical doctors directories, and emergency triage routing rules."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column: Profile & Rules */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--color-primary)' }} />
              Hospital Facility Registry
            </h3>

            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Hospital Registered Name" 
                value={hospitalName} 
                onChange={(e) => setHospitalName(e.target.value)} 
              />
              <Input 
                label="Facility Code Identification" 
                value={hospitalCode} 
                onChange={(e) => setHospitalCode(e.target.value)} 
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button variant="primary" type="submit">
                  Save Hospital Profile
                </Button>
              </div>
            </form>
          </Card>

          {/* Emergency Rules */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '16px' }}>Triage Dispatch & Routing Rules</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="medx-checkbox-container">
                <input 
                  type="checkbox" 
                  className="medx-checkbox"
                  checked={autoTriage}
                  onChange={(e) => setAutoTriage(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Execute automated AI triage classifications upon ambulance intake</span>
              </label>

              <label className="medx-checkbox-container">
                <input 
                  type="checkbox" 
                  className="medx-checkbox"
                  checked={notifyLogistics}
                  onChange={(e) => setNotifyLogistics(e.target.checked)}
                />
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Automatically alert nearby blood banks on ECE-1 admissions</span>
              </label>
            </div>
          </Card>

        </div>

        {/* Right Column: Departments & Doctors lists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Departments tag list */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={18} style={{ color: 'var(--color-secondary)' }} />
              Hospital Departments
            </h3>
            <p className="medx-caption" style={{ marginBottom: '16px' }}>Manage clinical departments active within the electronic health record matrix.</p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {departments.map(dept => (
                <span 
                  key={dept}
                  className="medx-badge"
                  style={{
                    backgroundColor: 'var(--color-secondary-soft)',
                    border: '1px solid var(--color-secondary-border)',
                    color: 'var(--color-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px'
                  }}
                >
                  {dept}
                  <button 
                    onClick={() => removeDeptTag(dept)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Input dept */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="medx-input" 
                placeholder="Enter department name..."
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDeptTag()}
                style={{ height: '38px', borderRadius: '8px' }}
              />
              <Button variant="secondary" onClick={addDeptTag} style={{ height: '38px', width: '38px', padding: 0 }}>
                <Plus size={16} />
              </Button>
            </div>
          </Card>

          {/* Doctors tag list */}
          <Card shadow="sm" hoverLift={false}>
            <h3 className="medx-card-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} style={{ color: 'var(--color-primary)' }} />
              On-Duty Physicians Index
            </h3>
            <p className="medx-caption" style={{ marginBottom: '16px' }}>Registered clinical physicians available for case assignments.</p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {doctors.map(doc => (
                <span 
                  key={doc}
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
                  {doc}
                  <button 
                    onClick={() => removeDocTag(doc)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Input doctor */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="medx-input" 
                placeholder="Enter doctor's name..."
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDocTag()}
                style={{ height: '38px', borderRadius: '8px' }}
              />
              <Button variant="secondary" onClick={addDocTag} style={{ height: '38px', width: '38px', padding: 0 }}>
                <Plus size={16} />
              </Button>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
};
export default Settings;
