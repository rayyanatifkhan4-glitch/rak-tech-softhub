// ─── Currency ──────────────────────────────────────────────────────────────────
const PKR_SYMBOL = 'Rs.';

export function formatCurrency(amount, symbol = PKR_SYMBOL) {
  const n = parseFloat(amount) || 0;
  return `${symbol}${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function parseCurrency(value) {
  if (typeof value === 'number') return value;
  return parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
}

// ─── Dates ────────────────────────────────────────────────────────────────────
export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return String(date);
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'long') return d.toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' });
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return String(date);
  const time = d.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${formatDate(d)} ${time}`;
}

export function timeAgo(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800)return `${Math.floor(secs / 86400)}d ago`;
  return formatDate(date);
}

export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ─── Numbers ─────────────────────────────────────────────────────────────────
export function formatNumber(n, decimals = 0) {
  return (parseFloat(n) || 0).toLocaleString('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatPercent(n) {
  return `${(parseFloat(n) || 0).toFixed(1)}%`;
}

// ─── Strings ─────────────────────────────────────────────────────────────────
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
}

export function truncate(str, maxLen = 50) {
  if (!str) return '';
  return str.length > maxLen ? `${str.substring(0, maxLen)}…` : str;
}

export function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

// ─── Status colors ────────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  // Invoice / Payment
  Paid      : { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.4)' },
  Pending   : { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
  Overdue   : { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', border: 'rgba(239,68,68,0.4)' },
  // Lead status
  Lead      : { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6', border: 'rgba(139,92,246,0.4)' },
  Contacted : { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.4)' },
  Active    : { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.4)' },
  Won       : { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.4)' },
  Lost      : { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', border: 'rgba(239,68,68,0.4)' },
  // PO status
  Draft     : { bg: 'rgba(100,116,139,0.15)',text: '#64748b', border: 'rgba(100,116,139,0.4)' },
  Sent      : { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.4)' },
  Received  : { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
  // Task status
  'To Do'   : { bg: 'rgba(100,116,139,0.15)',text: '#94a3b8', border: 'rgba(100,116,139,0.4)' },
  'In Progress':{ bg:'rgba(245,158,11,0.15)',text:'#f59e0b', border:'rgba(245,158,11,0.4)' },
  Done      : { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.4)' },
  // Workspace env
  production: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.4)' },
  demo      : { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
  testing   : { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6', border: 'rgba(139,92,246,0.4)' },
  archived  : { bg: 'rgba(100,116,139,0.15)',text: '#64748b', border: 'rgba(100,116,139,0.4)' },
};

export function getStatusStyle(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.Draft;
}
