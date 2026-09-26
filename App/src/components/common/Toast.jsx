import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const ICONS = {
  success: CheckCircle,
  error  : XCircle,
  warning: AlertTriangle,
  info   : Info,
};

const COLORS = {
  success: { bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.4)', icon:'#10b981' },
  error  : { bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.4)',  icon:'#ef4444' },
  warning: { bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.4)', icon:'#f59e0b' },
  info   : { bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.4)', icon:'#3b82f6' },
};

function ToastItem({ id, message, type = 'info', duration = 4000 }) {
  const { removeToast } = useAppContext();
  const [visible, setVisible] = useState(false);
  const Icon   = ICONS[type]  || Info;
  const color  = COLORS[type] || COLORS.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => removeToast(id), 300);
    }, duration);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => removeToast(id), 300); }}
      style={{
        display      : 'flex',
        alignItems   : 'flex-start',
        gap          : '10px',
        padding      : '12px 14px',
        borderRadius : '10px',
        background   : color.bg,
        border       : `1px solid ${color.border}`,
        backdropFilter:'blur(16px)',
        boxShadow    : '0 8px 24px rgba(0,0,0,0.4)',
        cursor       : 'pointer',
        minWidth     : '280px',
        maxWidth     : '380px',
        transform    : visible ? 'translateX(0) scale(1)' : 'translateX(60px) scale(0.95)',
        opacity      : visible ? 1 : 0,
        transition   : 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <Icon size={18} color={color.icon} style={{ flexShrink:0, marginTop:'1px' }} />
      <span style={{ fontSize:'0.875rem', color:'#e2e8f0', lineHeight:'1.4', flex:1 }}>
        {message}
      </span>
      <X size={14} color='rgba(255,255,255,0.4)' style={{ flexShrink:0, marginTop:'2px' }} />
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useAppContext();

  return (
    <div style={{
      position  : 'fixed',
      top       : '72px',
      right     : '16px',
      zIndex    : 9999,
      display   : 'flex',
      flexDirection: 'column',
      gap       : '8px',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem {...t} />
        </div>
      ))}
    </div>
  );
}
