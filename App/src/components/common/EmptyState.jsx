import React from 'react';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No records found',
  description = '',
  action = null,
}) {
  return (
    <div style={{
      display       : 'flex',
      flexDirection : 'column',
      alignItems    : 'center',
      justifyContent: 'center',
      padding       : '48px 24px',
      textAlign     : 'center',
      gap           : '12px',
    }}>
      <div style={{
        width        : '56px',
        height       : '56px',
        borderRadius : '14px',
        background   : 'rgba(59,130,246,0.08)',
        border       : '1px solid rgba(59,130,246,0.2)',
        display      : 'flex',
        alignItems   : 'center',
        justifyContent:'center',
      }}>
        <Icon size={24} color='rgba(59,130,246,0.6)' />
      </div>
      <div>
        <div style={{ fontWeight:600, color:'#94a3b8', fontSize:'0.95rem' }}>{title}</div>
        {description && (
          <div style={{ color:'#64748b', fontSize:'0.82rem', marginTop:'4px', maxWidth:'260px' }}>
            {description}
          </div>
        )}
      </div>
      {action && <div style={{ marginTop:'8px' }}>{action}</div>}
    </div>
  );
}
