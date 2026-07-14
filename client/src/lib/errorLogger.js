import { useAuthStore } from '../store/useAuthStore';

const apiURL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

let logCount = 0;
let resetTime = Date.now() + 60000;

function canSendLog() {
  const now = Date.now();
  if (now > resetTime) {
    logCount = 0;
    resetTime = now + 60000;
  }
  if (logCount >= 5) {
    return false;
  }
  logCount++;
  return true;
}

const recentErrors = new Map();

async function sendLog(type, message, stack) {
  const lowerMsg = String(message).toLowerCase();
  const lowerStack = String(stack || '').toLowerCase();
  const lowerUrl = String(window.location.href).toLowerCase();

  const isBlocked = 
    lowerMsg.includes('/api/heartbeat') ||
    lowerMsg.includes('/api/logs') ||
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('err_connection_refused') ||
    lowerStack.includes('/api/heartbeat') ||
    lowerStack.includes('/api/logs') ||
    lowerStack.includes('failed to fetch') ||
    lowerStack.includes('networkerror') ||
    lowerStack.includes('err_connection_refused') ||
    lowerUrl.includes('/api/heartbeat') ||
    lowerUrl.includes('/api/logs');

  if (isBlocked) {
    return;
  }

  const fingerprint = `${type}:${message}:${window.location.href}`;
  const now = Date.now();
  if (recentErrors.has(fingerprint)) {
    const expiry = recentErrors.get(fingerprint);
    if (now < expiry) {
      return;
    }
  }
  recentErrors.set(fingerprint, now + 30000);

  if (!canSendLog()) {
    return;
  }
  try {
    const user = useAuthStore.getState().user;
    const payload = {
      tenantId: user?.tenantId || 'PUBLIC',
      userEmail: user?.email || 'anonymous',
      type,
      message,
      stack: stack || '',
      url: window.location.href,
      browserInfo: navigator.userAgent
    };
    await fetch(`${apiURL}/logs/client`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch {
  }
}

export function initErrorLogger() {
  window.addEventListener('error', (event) => {
    sendLog('ERROR', event.message, event.error?.stack || '');
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : '';
    sendLog('ERROR', `Unhandled Promise Rejection: ${message}`, stack);
  });

  const originalWarn = console.warn;
  console.warn = function (...args) {
    originalWarn.apply(console, args);
    const message = args.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
    sendLog('WARNING', message, '');
  };
}
