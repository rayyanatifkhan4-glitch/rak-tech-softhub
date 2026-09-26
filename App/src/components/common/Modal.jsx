import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = 500,
  footer,
  noPadding = false,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position        : 'fixed',
        inset           : 0,
        background      : 'rgba(0,0,0,0.75)',
        display         : 'flex',
        alignItems      : 'center',
        justifyContent  : 'center',
        zIndex          : 2000,
        padding         : '20px',
        backdropFilter  : 'blur(6px)',
        animation       : 'fadeIn 0.15s ease',
      }}
    >
      <div
        style={{
          background    : 'var(--surface-elevated, #1e293b)',
          border        : '1px solid rgba(255,255,255,0.1)',
          borderRadius  : '14px',
          width         : '100%',
          maxWidth      : `${width}px`,
          maxHeight     : 'calc(100vh - 40px)',
          display       : 'flex',
          flexDirection : 'column',
          boxShadow     : '0 24px 80px rgba(0,0,0,0.6)',
          animation     : 'slideUp 0.2s cubic-bezier(0.16,1,0.3,1)',
          overflow      : 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display        : 'flex',
          alignItems     : 'center',
          justifyContent : 'space-between',
          padding        : '18px 24px',
          borderBottom   : '1px solid rgba(255,255,255,0.07)',
          flexShrink     : 0,
          background     : 'rgba(15, 23, 42, 0.4)',
        }}>
          <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:600, color:'#f1f5f9' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background    : 'rgba(255,255,255,0.07)',
              border        : '1px solid rgba(255,255,255,0.1)',
              borderRadius  : '6px',
              width         : '30px',
              height        : '30px',
              display       : 'flex',
              alignItems    : 'center',
              justifyContent: 'center',
              cursor        : 'pointer',
              color         : '#94a3b8',
              transition    : 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex      : 1,
          overflowY : 'auto',
          padding   : noPadding ? 0 : '24px',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding     : '16px 24px',
            borderTop   : '1px solid rgba(255,255,255,0.07)',
            display     : 'flex',
            gap         : '12px',
            justifyContent:'flex-end',
            alignItems  : 'center',
            flexShrink  : 0,
            background  : 'rgba(15, 23, 42, 0.6)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
