import React from 'react';
import { getStatusStyle } from '../../utils/format';

export default function StatusBadge({ status, size = 'sm' }) {
  if (!status) return null;
  const style  = getStatusStyle(status);
  const sizes  = { xs:'0.65rem', sm:'0.72rem', md:'0.8rem' };
  const pads   = { xs:'2px 6px', sm:'3px 8px', md:'4px 10px' };

  return (
    <span style={{
      display      : 'inline-flex',
      alignItems   : 'center',
      gap          : '4px',
      padding      : pads[size]  || pads.sm,
      borderRadius : '999px',
      fontSize     : sizes[size] || sizes.sm,
      fontWeight   : 600,
      letterSpacing: '0.02em',
      background   : style.bg,
      color        : style.text,
      border       : `1px solid ${style.border}`,
      whiteSpace   : 'nowrap',
    }}>
      <span style={{
        width       : '5px',
        height      : '5px',
        borderRadius: '50%',
        background  : style.text,
        flexShrink  : 0,
      }} />
      {status}
    </span>
  );
}
