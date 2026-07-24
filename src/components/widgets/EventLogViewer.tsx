import React, { useEffect, useRef } from 'react';
import { MedXEvent } from '../../types/event';

interface EventLogViewerProps {
  events: MedXEvent[];
}

export const EventLogViewer: React.FC<EventLogViewerProps> = ({ events }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to top when a new event arrives (newest on top)
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [events]);

  const getEventStyle = (type: string) => {
    if (type.includes('FAILED')) return { color: '#ef4444', prefix: '[ERROR]' };
    if (type.includes('FINISHED') || type.includes('COMPLETED')) return { color: '#10b981', prefix: '[SUCCESS]' };
    if (type.includes('STARTED')) return { color: '#3b82f6', prefix: '[INFO]' };
    return { color: '#f59e0b', prefix: '[WARN]' };
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundColor: '#0a0d14',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        height: '240px',
        overflowY: 'auto',
        fontFamily: '"Fira Code", monospace, Courier, monospace',
        fontSize: '11px',
        padding: '12px',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        scrollBehavior: 'smooth'
      }}
    >
      {events.map((event, idx) => {
        const style = getEventStyle(event.type);
        const time = new Date(event.timestamp).toLocaleTimeString();
        return (
          <div key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
            <span style={{ color: 'var(--color-text-muted)', marginRight: '8px' }}>[{time}]</span>
            <span style={{ color: style.color, fontWeight: 'bold', marginRight: '8px' }}>{style.prefix}</span>
            <span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>[{event.type}]</span>
            <span>{event.payload.message}</span>
            {event.payload.agentId && (
              <span style={{ color: 'var(--color-primary-light)', marginLeft: '6px' }}>
                (agent: {event.payload.agentId})
              </span>
            )}
          </div>
        );
      })}

      {events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          &gt; Standing by. Event stream ready...
        </div>
      )}
    </div>
  );
};
export default EventLogViewer;
