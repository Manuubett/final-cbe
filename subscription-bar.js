/**
 * CBE Mark Sheet System — Subscription Warning Bar
 * Copyright © 2026 Bett Emanuel — https://bett.website
 *
 * DROP THIS SCRIPT INTO ANY PAGE. It self-initialises.
 *
 * Requirements on the host page:
 *   - Firebase app already initialised (firebase-app-compat + firebase-firestore-compat + firebase-auth-compat)
 *   - A <body> element (bar is prepended as first child)
 *
 * Behaviour:
 *   - HIDDEN when subscription is healthy (> 7 days remaining)
 *   - SHOWS only when expiry is within 7 days — countdown + renew button
 *   - Color and tone shift based on urgency (7d → amber, 3d → orange, 24h → red)
 *   - Shows "EXPIRED" with blink when time runs out
 *   - Reads expiry from Firestore approvedSchools/{uid}.subscriptionExpiry
 *   - Falls back to localStorage cbe_pay_date + cbe_pay_plan if Firestore unavailable
 *   - Live countdown ticks every second
 *   - Re-checks Firestore once when countdown reaches zero (to confirm expiry)
 */
(function () {
  'use strict';

  const WARN_DAYS = 7; // Only show bar within this many days of expiry

  // ── Urgency themes ────────────────────────────────────────────────────────
  // Each level has a background, text color, accent, and a label
  const THEMES = {
    week:    { bg: '#1e3a5f', border: '#3b82f6', accent: '#93c5fd', icon: '🔔' }, // 4–7 days  — calm blue
    soon:    { bg: '#78350f', border: '#f59e0b', accent: '#fcd34d', icon: '⚠️' }, // 1–3 days  — amber
    today:   { bg: '#7c2d12', border: '#f97316', accent: '#fdba74', icon: '🚨' }, // < 24 hrs  — orange-red
    urgent:  { bg: '#7f1d1d', border: '#ef4444', accent: '#fca5a5', icon: '🚨' }, // < 6 hrs   — red
    expired: { bg: '#450a0a', border: '#dc2626', accent: '#fca5a5', icon: '⛔' }, // expired   — deep red
    loading: { bg: '#0f172a', border: '#334155', accent: '#64748b', icon: '⏳' }, // loading
  };

  // ── Inject CSS ─────────────────────────────────────────────────────────────
  const css = `
    #cbe-sub-bar {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 99990;
      height: 46px;
      display: none; /* hidden by default — shown only near expiry */
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      font-family: 'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif;
      font-size: 12.5px;
      font-weight: 500;
      transition: background 0.4s ease, border-color 0.3s ease;
      border-top-width: 2px;
      border-top-style: solid;
      gap: 14px;
      box-sizing: border-box;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.25);
    }
    #cbe-sub-bar.csb-visible {
      display: flex;
    }
    #cbe-sub-bar * { box-sizing: border-box; }

    /* Left: icon + message */
    #cbe-sub-bar .csb-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    #cbe-sub-bar .csb-icon {
      font-size: 16px;
      flex-shrink: 0;
    }
    #cbe-sub-bar .csb-msg {
      font-size: 12.5px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.9;
    }

    /* Center: countdown units */
    #cbe-sub-bar .csb-center {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    #cbe-sub-bar .csb-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(0,0,0,0.25);
      border-radius: 5px;
      padding: 3px 7px;
      min-width: 40px;
    }
    #cbe-sub-bar .csb-unit-val {
      font-size: 14px;
      font-weight: 800;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.5px;
    }
    #cbe-sub-bar .csb-unit-lbl {
      font-size: 8.5px;
      font-weight: 700;
      opacity: 0.65;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    #cbe-sub-bar .csb-sep {
      font-size: 14px;
      font-weight: 800;
      opacity: 0.4;
      margin-bottom: 5px;
      padding: 0 1px;
    }

    /* Expired text */
    #cbe-sub-bar .csb-expired-txt {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.3px;
      animation: csb-blink 1.1s ease-in-out infinite;
    }
    @keyframes csb-blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    /* Right: renew button */
    #cbe-sub-bar .csb-right {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }
    #cbe-sub-bar .csb-renew-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border-radius: 6px;
      border: none;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none;
      background: rgba(255,255,255,0.18);
      color: inherit;
      transition: background 0.15s, transform 0.12s;
    }
    #cbe-sub-bar .csb-renew-btn:hover {
      background: rgba(255,255,255,0.32);
      transform: translateY(-1px);
    }
    #cbe-sub-bar .csb-renew-btn:active {
      transform: translateY(0);
    }

    /* Dismiss button */
    #cbe-sub-bar .csb-dismiss {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 15px;
      opacity: 0.4;
      padding: 3px 5px;
      line-height: 1;
      color: inherit;
      border-radius: 4px;
      transition: opacity 0.15s;
      flex-shrink: 0;
    }
    #cbe-sub-bar .csb-dismiss:hover { opacity: 0.75; }

    /* Responsive */
    @media (max-width: 600px) {
      #cbe-sub-bar { padding: 0 12px; gap: 8px; }
      #cbe-sub-bar .csb-msg { display: none; }
      #cbe-sub-bar .csb-unit { min-width: 34px; padding: 3px 5px; }
      #cbe-sub-bar .csb-unit-val { font-size: 12px; }
      #cbe-sub-bar .csb-renew-btn { padding: 5px 10px; font-size: 11px; }
    }
    @media (max-width: 400px) {
      #cbe-sub-bar .csb-sep { display: none; }
      #cbe-sub-bar .csb-unit { min-width: 30px; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Build bar DOM ──────────────────────────────────────────────────────────
  const bar = document.createElement('div');
  bar.id = 'cbe-sub-bar';
  document.body.appendChild(bar); // append to bottom of body

  // ── Theme helper ───────────────────────────────────────────────────────────
  function applyTheme(key) {
    const t = THEMES[key] || THEMES.week;
    bar.style.background   = t.bg;
    bar.style.borderTopColor = t.border;
    bar.style.color        = '#ffffff';
    return t;
  }

  // ── Determine urgency key from ms remaining ────────────────────────────────
  function urgencyKey(msLeft) {
    if (msLeft <= 0)                    return 'expired';
    if (msLeft < 6  * 3600000)         return 'urgent';  // < 6 hours
    if (msLeft < 24 * 3600000)         return 'today';   // < 24 hours
    if (msLeft < 3  * 86400000)        return 'soon';    // < 3 days
    return 'week';                                        // 3–7 days
  }

  // ── Human-readable message ─────────────────────────────────────────────────
  function urgencyMsg(msLeft, theme) {
    if (msLeft <= 0) return 'Your subscription has expired';
    const daysLeft  = Math.ceil(msLeft / 86400000);
    const hoursLeft = Math.ceil(msLeft / 3600000);
    if (hoursLeft < 1)  return 'Subscription expires in less than an hour';
    if (hoursLeft < 24) return `Subscription expires in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`;
    if (daysLeft === 1) return 'Subscription expires tomorrow';
    return `Subscription expires in ${daysLeft} days`;
  }

  // ── Tick state ─────────────────────────────────────────────────────────────
  let _tickTimer   = null;
  let _dismissed   = false;
  let _firestoreDb = null;
  let _userId      = null;

  // ── Render the bar ─────────────────────────────────────────────────────────
  function renderBar(expiryDate, planLabel) {
    if (_tickTimer) { clearTimeout(_tickTimer); _tickTimer = null; }

    function tick() {
      const now    = new Date();
      const msLeft = expiryDate - now;
      const key    = urgencyKey(msLeft);
      const theme  = THEMES[key];

      // If more than WARN_DAYS remain, hide bar silently
      if (msLeft > WARN_DAYS * 86400000) {
        bar.classList.remove('csb-visible');
        return;
      }

      // Show bar
      if (!_dismissed) {
        bar.classList.add('csb-visible');
      }

      applyTheme(key);

      const pad = n => String(n).padStart(2, '0');

      if (msLeft <= 0) {
        // Expired state
        bar.innerHTML = `
          <div class="csb-left">
            <span class="csb-icon">${theme.icon}</span>
            <span class="csb-expired-txt">SUBSCRIPTION EXPIRED — Renew now to restore access</span>
          </div>
          <div class="csb-right">
            <a class="csb-renew-btn" href="/renew?from=bar-expired">🔄 Renew Now →</a>
          </div>
        `;
        // Re-check Firestore once on expiry — in case admin already renewed
        if (_firestoreDb && _userId) {
          setTimeout(() => {
            _firestoreDb.collection('approvedSchools').doc(_userId).get()
              .then(snap => {
                if (!snap.exists) return;
                const d   = snap.data();
                const exp = d.subscriptionExpiry?.toDate?.();
                if (exp && exp > new Date()) {
                  // Renewed! Re-render with new expiry
                  renderBar(exp, d.subscription || 'monthly');
                }
              }).catch(() => {});
          }, 3000);
        }
        return; // stop ticking after expiry
      }

      const days  = Math.floor(msLeft / 86400000);
      const hours = Math.floor((msLeft % 86400000) / 3600000);
      const mins  = Math.floor((msLeft % 3600000)  / 60000);
      const secs  = Math.floor((msLeft % 60000)    / 1000);

      const msg = urgencyMsg(msLeft, theme);

      // Show days unit only if >= 1 day remaining
      const daysUnit = days > 0 ? `
        <div class="csb-unit">
          <span class="csb-unit-val">${pad(days)}</span>
          <span class="csb-unit-lbl">days</span>
        </div>
        <span class="csb-sep">:</span>
      ` : '';

      bar.innerHTML = `
        <div class="csb-left">
          <span class="csb-icon">${theme.icon}</span>
          <span class="csb-msg">${msg}</span>
        </div>
        <div class="csb-center">
          ${daysUnit}
          <div class="csb-unit">
            <span class="csb-unit-val">${pad(hours)}</span>
            <span class="csb-unit-lbl">hrs</span>
          </div>
          <span class="csb-sep">:</span>
          <div class="csb-unit">
            <span class="csb-unit-val">${pad(mins)}</span>
            <span class="csb-unit-lbl">min</span>
          </div>
          <span class="csb-sep">:</span>
          <div class="csb-unit">
            <span class="csb-unit-val">${pad(secs)}</span>
            <span class="csb-unit-lbl">sec</span>
          </div>
        </div>
        <div class="csb-right">
          <a class="csb-renew-btn" href="/renew?from=bar-warning">🔄 Renew Now →</a>
          <button class="csb-dismiss" title="Dismiss" onclick="(function(){document.getElementById('cbe-sub-bar').classList.remove('csb-visible');})()">✕</button>
        </div>
      `;

      _tickTimer = setTimeout(tick, 1000);
    }

    tick();
  }

  // ── localStorage fallback ──────────────────────────────────────────────────
  function getExpiryFromLocalStorage() {
    try {
      const payDate = localStorage.getItem('cbe_pay_date');
      const plan    = localStorage.getItem('cbe_pay_plan') || 'monthly';
      if (!payDate) return null;
      const MONTHS  = { monthly: 1, termly: 3, annual: 12 };
      const expiry  = new Date(payDate);
      expiry.setMonth(expiry.getMonth() + (MONTHS[plan] || 1));
      return { expiry, plan };
    } catch (e) {
      return null;
    }
  }

  // ── Plan label helper ──────────────────────────────────────────────────────
  function planLabel(plan) {
    return { monthly: 'Monthly', termly: 'Termly', annual: 'Annual' }[plan] || 'Subscription';
  }

  // ── Main init ──────────────────────────────────────────────────────────────
  function init() {
    const timeout = setTimeout(() => {
      // Firebase auth never fired — try localStorage
      const ls = getExpiryFromLocalStorage();
      if (ls) {
        const msLeft = ls.expiry - new Date();
        if (msLeft <= WARN_DAYS * 86400000) {
          renderBar(ls.expiry, planLabel(ls.plan));
        }
        // else: healthy — stay hidden
      }
      // else: no data — stay hidden
    }, 5000);

    try {
      const auth = firebase.auth();
      const db   = firebase.firestore();

      auth.onAuthStateChanged(async (user) => {
        clearTimeout(timeout);

        if (!user) {
          // Not logged in — check localStorage
          const ls = getExpiryFromLocalStorage();
          if (ls) {
            const msLeft = ls.expiry - new Date();
            if (msLeft <= WARN_DAYS * 86400000) {
              renderBar(ls.expiry, planLabel(ls.plan));
            }
          }
          return;
        }

        _userId      = user.uid;
        _firestoreDb = db;

        try {
          // Real-time listener so bar reacts instantly to renewal
          db.collection('approvedSchools').doc(user.uid)
            .onSnapshot(snap => {
              if (!snap.exists) return;

              const data  = snap.data();
              const field = data.subscriptionExpiry;
              const plan  = data.subscription || 'monthly';

              if (!field) return; // no expiry set — stay hidden

              const expiry = field.toDate ? field.toDate() : new Date(field);
              const msLeft = expiry - new Date();

              if (msLeft <= WARN_DAYS * 86400000) {
                // Within warning window — show bar
                _dismissed = false; // reset dismiss on renewal snapshot
                renderBar(expiry, planLabel(plan));
              } else {
                // Healthy subscription — ensure bar stays hidden
                if (_tickTimer) { clearTimeout(_tickTimer); _tickTimer = null; }
                bar.classList.remove('csb-visible');
              }
            }, err => {
              // Firestore error — fall back to localStorage
              console.warn('[CBE Bar] Firestore error:', err.message);
              const ls = getExpiryFromLocalStorage();
              if (ls) {
                const msLeft = ls.expiry - new Date();
                if (msLeft <= WARN_DAYS * 86400000) {
                  renderBar(ls.expiry, planLabel(ls.plan));
                }
              }
            });

        } catch (e) {
          console.warn('[CBE Bar] Init error:', e.message);
        }
      });

    } catch (e) {
      // Firebase not available
      clearTimeout(timeout);
      const ls = getExpiryFromLocalStorage();
      if (ls) {
        const msLeft = ls.expiry - new Date();
        if (msLeft <= WARN_DAYS * 86400000) {
          renderBar(ls.expiry, planLabel(ls.plan));
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
