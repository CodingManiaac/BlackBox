import React from 'react';
import Breadcrumb from './Breadcrumb';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '32px',
      width: '100%'
    }}>
      <Breadcrumb />
      
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <h2 className="medx-title" style={{ margin: 0 }}>{title}</h2>
          {description && (
            <p className="medx-body" style={{ marginTop: '4px', margin: 0 }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
export default PageHeader;
