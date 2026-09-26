import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Wifi, WifiOff, Loader2, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, loginError, isLoggingIn, connectionOk, setLoginError } = useAuth();

  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [remember,  setRemember]  = useState(false);
  const [shake,     setShake]     = useState(false);

  const usernameRef = useRef(null);

  useEffect(() => { usernameRef.current?.focus(); }, []);

  useEffect(() => {
    if (loginError) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 600);
      return () => clearTimeout(t);
    }
  }, [loginError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim() || !password) {
      setLoginError('Please enter your username and password.');
      return;
    }
    await login(username, password, remember);
  };

  const connLabel  = connectionOk === null  ? 'Checking connection…'
                   : connectionOk           ? 'Connected to local server'
                   :                          'Server unavailable — working offline';
  const ConnIcon   = connectionOk ? Wifi : WifiOff;
  const connColor  = connectionOk === null ? '#64748b' : connectionOk ? '#10b981' : '#f59e0b';

  return (
    <div style={{
      minHeight       : '100vh',
      background      : '#0a0f1e',
      display         : 'flex',
      alignItems      : 'center',
      justifyContent  : 'center',
      padding         : '20px',
      position        : 'relative',
      overflow        : 'hidden',
    }}>
      {/* Background glows */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
        <div style={{
          position  : 'absolute', top:'-20%', left:'-10%',
          width     : '600px', height:'600px',
          borderRadius:'50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }} />
        <div style={{
          position  : 'absolute', bottom:'-15%', right:'-5%',
          width     : '500px', height:'500px',
          borderRadius:'50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        }} />
        {/* Grid pattern */}
        <div style={{
          position       : 'absolute', inset:0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize : '48px 48px',
        }} />
      </div>

      {/* Login card */}
      <div style={{
        width           : '100%',
        maxWidth        : '420px',
        background      : 'rgba(15,23,42,0.95)',
        border          : '1px solid rgba(255,255,255,0.09)',
        borderRadius    : '20px',
        boxShadow       : '0 32px 96px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08)',
        backdropFilter  : 'blur(24px)',
        padding         : '40px',
        position        : 'relative',
        zIndex          : 1,
        animation       : shake ? 'shake 0.5s ease' : 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Brand area */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <img src="./logo.png" alt="RAKTechSoftHub Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <h1 style={{
            margin     : 0,
            fontSize   : '1.5rem',
            fontWeight : 800,
            background : 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor : 'transparent',
            letterSpacing: '-0.02em',
          }}>
            RAK Tech ERP
          </h1>
          <p style={{ margin:'6px 0 0', color:'#64748b', fontSize:'0.82rem', letterSpacing:'0.05em' }}>
            ENTERPRISE BUSINESS SUITE
          </p>
        </div>

        {/* Error alert */}
        {loginError && (
          <div style={{
            display     : 'flex',
            alignItems  : 'flex-start',
            gap         : '8px',
            padding     : '10px 12px',
            borderRadius: '10px',
            background  : 'rgba(239,68,68,0.1)',
            border      : '1px solid rgba(239,68,68,0.3)',
            marginBottom: '20px',
          }}>
            <AlertCircle size={15} color='#f87171' style={{ flexShrink:0, marginTop:'1px' }} />
            <span style={{ fontSize:'0.82rem', color:'#fca5a5', lineHeight:'1.4' }}>{loginError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {/* Username */}
          <div>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'#94a3b8', marginBottom:'6px', letterSpacing:'0.03em' }}>
              USERNAME OR EMAIL
            </label>
            <div style={{ position:'relative' }}>
              <User size={15} color='#475569' style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setLoginError(''); }}
                placeholder="admin or admin@raktech.com"
                autoComplete="username"
                style={{
                  width         : '100%',
                  padding       : '11px 12px 11px 36px',
                  background    : 'rgba(255,255,255,0.05)',
                  border        : '1px solid rgba(255,255,255,0.1)',
                  borderRadius  : '10px',
                  color         : '#e2e8f0',
                  fontSize      : '0.9rem',
                  outline       : 'none',
                  transition    : 'border-color 0.2s',
                  boxSizing     : 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'#94a3b8', marginBottom:'6px', letterSpacing:'0.03em' }}>
              PASSWORD
            </label>
            <div style={{ position:'relative' }}>
              <Lock size={15} color='#475569' style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width         : '100%',
                  padding       : '11px 40px 11px 36px',
                  background    : 'rgba(255,255,255,0.05)',
                  border        : '1px solid rgba(255,255,255,0.1)',
                  borderRadius  : '10px',
                  color         : '#e2e8f0',
                  fontSize      : '0.9rem',
                  outline       : 'none',
                  transition    : 'border-color 0.2s',
                  boxSizing     : 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position   : 'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
                  background : 'none', border:'none', cursor:'pointer', color:'#64748b', padding:'4px',
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', userSelect:'none' }}>
            <div
              onClick={() => setRemember(r => !r)}
              style={{
                width       : '16px', height:'16px',
                borderRadius: '4px',
                border      : `1.5px solid ${remember ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                background  : remember ? '#3b82f6' : 'transparent',
                display     : 'flex', alignItems:'center', justifyContent:'center',
                cursor      : 'pointer',
                transition  : 'all 0.15s ease',
                flexShrink  : 0,
              }}
            >
              {remember && <CheckCircle2 size={10} color='white' />}
            </div>
            <span style={{ fontSize:'0.82rem', color:'#94a3b8' }}>Remember this device</span>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            style={{
              width        : '100%',
              padding      : '12px',
              borderRadius : '10px',
              border       : 'none',
              background   : isLoggingIn
                ? 'rgba(59,130,246,0.5)'
                : 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color        : 'white',
              fontSize     : '0.9rem',
              fontWeight   : 700,
              cursor       : isLoggingIn ? 'not-allowed' : 'pointer',
              display      : 'flex',
              alignItems   : 'center',
              justifyContent:'center',
              gap          : '8px',
              marginTop    : '4px',
              boxShadow    : isLoggingIn ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
              transition   : 'all 0.2s ease',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!isLoggingIn) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {isLoggingIn
              ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Signing in…</>
              : 'Sign In'}
          </button>
        </form>

        {/* Forgot password hint */}
        <div style={{ textAlign:'center', marginTop:'16px' }}>
          <span style={{ fontSize:'0.78rem', color:'#475569' }}>
            Default credentials: <strong style={{ color:'#64748b' }}>admin / admin123</strong>
          </span>
        </div>

        {/* Divider */}
        <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', margin:'20px 0' }} />

        {/* Connection status */}
        <div style={{
          display    : 'flex',
          alignItems : 'center',
          gap        : '7px',
          justifyContent:'center',
        }}>
          <ConnIcon size={13} color={connColor} />
          <span style={{ fontSize:'0.75rem', color:connColor }}>{connLabel}</span>
        </div>
      </div>

      {/* Version footer */}
      <div style={{
        position : 'absolute', bottom:'16px',
        left:'50%', transform:'translateX(-50%)',
        fontSize : '0.72rem', color:'#334155',
        zIndex   : 1,
      }}>
        RAK Tech ERP • Enterprise Business Suite
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          20%     { transform:translateX(-8px); }
          40%     { transform:translateX(8px); }
          60%     { transform:translateX(-5px); }
          80%     { transform:translateX(5px); }
        }
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>
    </div>
  );
}
