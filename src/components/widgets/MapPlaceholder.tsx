import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';

interface MapPlaceholderProps {
  title: string;
  description?: string;
  status?: string;
  assignedPharmacy?: string;
  assignedRider?: string;
  eceLevel?: number;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({ 
  title, 
  description,
  status = 'Ready',
  assignedPharmacy = 'Care Pharmacy Store',
  assignedRider = 'Dave Miller',
  eceLevel = 5
}) => {
  // Determine positions and paths based on status
  let riderLeft = '60px';
  let riderTop = '140px';
  let routePathD = 'M 60,140 Q 130,80 200,100'; // Depot to Pharmacy
  let activeLegLabel = 'Depot → Pharmacy Store';
  let coordinatesLabel = 'Lat: 34.0522° N, Lon: 118.2437° W';
  let calculationStatus = 'GIS: Calculating nearest rider...';

  const isEmergency = eceLevel <= 2;
  const riderIcon = isEmergency ? '🛸' : '🚚'; // Drone or ground courier

  if (status === 'Ready') {
    riderLeft = '40px';
    riderTop = '150px';
    routePathD = 'M 40,150 Q 120,90 200,100';
    activeLegLabel = 'Awaiting Rider Assignment';
    coordinatesLabel = 'Lat: 34.0410° N, Lon: 118.2512° W (Depot)';
    calculationStatus = 'GIS: Idle. Awaiting pharmacy readiness.';
  } else if (status === 'Preparing Dispatch') {
    riderLeft = '120px';
    riderTop = '110px';
    routePathD = 'M 40,150 L 200,100';
    activeLegLabel = `Rider (${assignedRider}) en route to Pharmacy`;
    coordinatesLabel = 'Lat: 34.0485° N, Lon: 118.2480° W (In Transit)';
    calculationStatus = 'GIS: Routing Rider → Pharmacy (Shortest Path)';
  } else if (status === 'Reached Store') {
    riderLeft = '190px';
    riderTop = '80px';
    routePathD = 'M 200,100 L 320,130';
    activeLegLabel = `Rider reached store: ${assignedPharmacy}`;
    coordinatesLabel = 'Lat: 34.0522° N, Lon: 118.2437° W (Store)';
    calculationStatus = 'GIS: Rider arrived. Awaiting cargo pickup.';
  } else if (status === 'Out for Delivery') {
    riderLeft = '260px';
    riderTop = '110px';
    routePathD = 'M 200,100 Q 260,110 320,130';
    activeLegLabel = 'Transit: Store → Patient Address';
    coordinatesLabel = 'Lat: 34.0560° N, Lon: 118.2392° W (In Transit)';
    calculationStatus = 'GIS: Routing Rider → Customer (Swiggy/Zomato bypass)';
  } else if (status === 'Reached Customer') {
    riderLeft = '310px';
    riderTop = '110px';
    routePathD = 'M 200,100 L 320,130';
    activeLegLabel = 'Rider arrived at Patient location';
    coordinatesLabel = 'Lat: 34.0612° N, Lon: 118.2325° W (Customer)';
    calculationStatus = 'GIS: Rider arrived. Awaiting validation signature.';
  } else if (status === 'Delivered') {
    riderLeft = '320px';
    riderTop = '130px';
    routePathD = '';
    activeLegLabel = 'Delivery Completed';
    coordinatesLabel = 'Lat: 34.0612° N, Lon: 118.2325° W';
    calculationStatus = 'GIS: Finished. Cargo successfully handed over.';
  }

  return (
    <Card shadow="sm" hoverLift={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 className="medx-card-title">{title}</h3>
        {description && <p className="medx-caption" style={{ margin: '2px 0 0 0' }}>{description}</p>}
      </div>

      {/* Styled Mock Map Container */}
      <div style={{
        height: '240px',
        backgroundColor: '#F1F5F9',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(#CBD5E1 1px, transparent 1px) 0 0 / 16px 16px, #F8FAFC'
      }}>
        {/* Mock Grid Lines & Vector Paths */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {routePathD && (
            <path d={routePathD} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeDasharray="5 5" style={{ animation: 'dash 15s linear infinite' }} />
          )}
          {/* Base connecting line */}
          <path d="M 40,150 L 200,100 L 320,130" fill="none" stroke="#E2E8F0" strokeWidth="2" />
        </svg>

        {/* Pharmacy Marker */}
        <div style={{
          position: 'absolute',
          top: '90px',
          left: '190px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 5
        }}>
          <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>🏥</span>
          <span className="medx-caption" style={{ background: 'white', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, transform: 'translateY(-2px)', whiteSpace: 'nowrap' }}>
            {assignedPharmacy}
          </span>
        </div>

        {/* Patient Location Marker */}
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '310px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 5
        }}>
          <span style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>🏠</span>
          <span className="medx-caption" style={{ background: 'white', border: '1px solid var(--color-border)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, transform: 'translateY(-2px)', whiteSpace: 'nowrap' }}>
            Patient Destination
          </span>
        </div>

        {/* Active Rider */}
        {status !== 'Delivered' && (
          <div style={{
            position: 'absolute',
            top: riderTop,
            left: riderLeft,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            transition: 'all 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
          }}>
            <span style={{ fontSize: '22px', animation: 'float 3s ease-in-out infinite', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
              {riderIcon}
            </span>
            <span className="medx-caption" style={{ background: 'var(--color-primary-dark)', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '8px', fontWeight: 700, transform: 'translateY(-2px)', whiteSpace: 'nowrap' }}>
              {assignedRider}
            </span>
          </div>
        )}

        {/* CSS Keyframe Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-4px); }
            100% { transform: translateY(0px); }
          }
          @keyframes dash {
            to {
              stroke-dashoffset: -100;
            }
          }
        `}} />

        {/* Map Details Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          zIndex: 20
        }}>
          <span className="medx-caption" style={{ fontWeight: 800, fontSize: '10px', color: 'var(--color-text-primary)' }}>
            {activeLegLabel}
          </span>
          <span className="medx-caption" style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>
            {coordinatesLabel}
          </span>
        </div>

        {/* Live GIS Engine calculation details */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '6px 10px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20
        }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
            {calculationStatus}
          </span>
        </div>

        <Badge variant={status === 'Delivered' ? 'success' : 'info'} style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20 }}>
          {status === 'Delivered' ? 'Delivered' : 'GIS Engine Active'}
        </Badge>
      </div>
    </Card>
  );
};
export default MapPlaceholder;
