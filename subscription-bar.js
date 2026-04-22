/**
 * CBE Mark Sheet System — Subscription Countdown Bar
 * Copyright © 2026 Bett Emanuel — https://bett.website
 *
 * DROP THIS SCRIPT INTO ANY PAGE. It self-initialises.
 *
 * Requirements on the host page:
 *   - Firebase app already initialised (firebase-app-compat + firebase-firestore-compat + firebase-auth-compat)
 *   - A <body> element (bar is prepended as first child)
 *
 * The bar:
 *   - Reads expiry from Firestore approvedSchools/{uid}.subscriptionExpiry
 *   - Falls back to localStorage cbe_pay_date + cbe_pay_plan if Firestore unavailable
 *   - Shows days / hours / minutes / seconds countdown
 *   - Color matches subscription plan (Monthly=blue, Termly=teal, Annual=purple)
 *   - Always shows a "Renew Now →" button
 *   - Turns red and shows "EXPIRED" when time runs out
 */
(function () {
  'use strict';

  // ── Plan theme colors ────────────────────────────────────────────────────
  const PLAN_THEMES = {
    monthly: { bg: '#1244b0', text: '#ffffff', accent: '#93c5fd', label: 'Monthly' },
    termly:  { bg: '#0f766e', text: '#ffffff', accent: '#5eead4', label: 'Termly'  },
    annual:  { bg: '#6d28d9', text: '#ffffff', accent: '#c4b5fd', label: 'Annual'  },
    expired: { bg: '#991b1b', text: '#ffffff', accent: '#fca5a5', label: 'Expired' },
    loading: { bg: '#1e293b', text: '#94a3b8', accent: '#475569', label: ''        },
  };

  // ── Inject CSS ───────────────────────────────────────────────────────────
  const css = `
    #cbe-sub-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 99999;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-family: 'DM Sans', 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 12.5px;
      transition: background 0.4s ease, color 0.4s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      gap: 12px;
      box-sizing: border-box;
    }
    #cbe-sub-bar * { box-sizing: border-box; }
    #cbe-sub-bar .csb-left {
      display: flex; align-items: center; gap: 8px;
      flex-shrink: 0; min-width: 0;
    }
    #cbe-sub-bar .csb-plan-chip {
      font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
      padding: 2px 9px; border-radius: 20px;
      text-transform: uppercase; white-space: nowrap;
      background: rgba(255,255,255,0.18);
    }
    #cbe-sub-bar .csb-label {
      font-size: 12px; font-weight: 600; opacity: 0.85;
      white-space: nowrap; flex-shrink: 0;
    }
    #cbe-sub-bar .csb-center {
      display: flex; align-items: center; gap: 6px;
      flex: 1; justify-content: center; min-width: 0;
    }
    #cbe-sub-bar .csb-unit {
      display: flex; flex-direction: column; align-items: center;
      background: rgba(0,0,0,0.18); border-radius: 6px;
      padding: 3px 8px; min-width: 46px;
    }
    #cbe-sub-bar .csb-unit-val {
      font-size: 15px; font-weight: 800; line-height: 1;
      font-variant-numeric: tabular-nums; letter-spacing: -0.5px;
    }
    #cbe-sub-bar .csb-unit-lbl {
      font-size: 9px; font-weight: 600; opacity: 0.7;
      text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px;
    }
    #cbe-sub-bar .csb-sep {
      font-size: 16px; font-weight: 800; opacity: 0.5;
      line-height: 1; margin-bottom: 6px;
    }
    #cbe-sub-bar .csb-expired-txt {
      font-size: 14px; font-weight: 800; letter-spacing: 0.5px;
      animation: csb-blink 1.2s ease-in-out infinite;
    }
    @keyframes csb-blink { 0%,100%{opacity:1} 50%{opacity:0.45} }
    #cbe-sub-bar .csb-right {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
    }
    #cbe-sub-bar .csb-renew-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 13px; border-radius: 6px; border: none;
      font-family: inherit; font-size: 12px; font-weight: 700;
      cursor: pointer; white-space: nowrap; text-decoration: none;
      background: rgba(255,255,255,0.22);
      color: inherit;
      transition: background 0.15s, transform 0.12s;
    }
    #cbe-sub-bar .csb-renew-btn:hover {
      background: rgba(255,255,255,0.35);
      transform: translateY(-1px);
    }
    #cbe-sub-bar .csb-renew-btn:active { transform: translateY(0); }
    #cbe-sub-bar .csb-loading {
      display: flex; align-items: center; gap: 8px; width: 100%;
      justify-content: center; opacity: 0.6; font-size: 12px;
    }
    #cbe-sub-bar .csb-spin {
      width: 13px; height: 13px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: rgba(255,255,255,0.7);
      border-radius: 50%;
      animation: csb-sp 0.6s linear infinite;
    }
    @keyframes csb-sp { to { transform: rotate(360deg); } }

    /* Push page content down so bar doesn't overlap */
    body { padding-top: 42px !important; }

    /* Responsive: collapse label on small screens */
    @media (max-width: 560px) {
      #cbe-sub-bar .csb-label { display: none; }
      #cbe-sub-bar .csb-unit { min-width: 38px; padding: 3px 5px; }
      #cbe-sub-bar .csb-unit-val { font-size: 13px; }
      #cbe-sub-bar .csb-renew-btn { padding: 5px 9px; font-size: 11px; }
      #cbe-sub-bar .csb-plan-chip { display: none; }
    }
    @media (max-width: 380px) {
      #cbe-sub-bar .csb-sep { display: none; }
      #cbe-sub-bar .csb-unit { min-width: 32px; padding: 3px 4px; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Build bar DOM ────────────────────────────────────────────────────────
  const bar = document.createElement('div');
  bar.id = 'cbe-sub-bar';
  bar.innerHTML = `
    <div class="csb-loading">
      <div class="csb-spin"></div>
      <span>Loading subscription…</span>
    </div>
  `;
  applyTheme('loading');
  document.body.insertBefore(bar, document.body.firstChild);

  // ── Theme helper ─────────────────────────────────────────────────────────
  function applyTheme(planKey) {
    const t = PLAN_THEMES[planKey] || PLAN_THEMES.monthly;
    bar.style.background = t.bg;
    bar.style.color      = t.text;
    return t;
  }

  // ── Render countdown bar ─────────────────────────────────────────────────
  function renderBar(expiryDate, planKey) {
    const t = applyTheme(planKey);

    bar.innerHTML = `
      <div class="csb-left">
        <span class="csb-plan-chip">${t.label}</span>
        <span class="csb-label">Subscription</span>
      </div>
      <div class="csb-center" id="csb-timer-area"></div>
      <div class="csb-right">
        <a class="csb-renew-btn" href="/renew?from=renewal">🔄 Renew Now →</a>
      </div>
    `;

    const timerArea = document.getElementById('csb-timer-area');

    function tick() {
      const now     = new Date();
      const msLeft  = expiryDate - now;

      if (msLeft <= 0) {
        // Expired
        applyTheme('expired');
        timerArea.innerHTML = `<span class="csb-expired-txt">⚠️ SUBSCRIPTION EXPIRED — Please renew to continue</span>`;
        return; // stop ticking
      }

      const days  = Math.floor(msLeft / 86400000);
      const hours = Math.floor((msLeft % 86400000) / 3600000);
      const mins  = Math.floor((msLeft % 3600000)  / 60000);
      const secs  = Math.floor((msLeft % 60000)    / 1000);

      const pad = n => String(n).padStart(2, '0');

      timerArea.innerHTML = `
        <div class="csb-unit"><span class="csb-unit-val">${pad(days)}</span><span class="csb-unit-lbl">days</span></div>
        <span class="csb-sep">:</span>
        <div class="csb-unit"><span class="csb-unit-val">${pad(hours)}</span><span class="csb-unit-lbl">hrs</span></div>
        <span class="csb-sep">:</span>
        <div class="csb-unit"><span class="csb-unit-val">${pad(mins)}</span><span class="csb-unit-lbl">min</span></div>
        <span class="csb-sep">:</span>
        <div class="csb-unit"><span class="csb-unit-val">${pad(secs)}</span><span class="csb-unit-lbl">sec</span></div>
      `;

      setTimeout(tick, 1000);
    }

    tick();
  }

  // ── Render error state ───────────────────────────────────────────────────
  function renderError(msg) {
    applyTheme('loading');
    bar.innerHTML = `
      <div class="csb-loading">
        <span>⚠️ ${msg}</span>
      </div>
      <div class="csb-right">
        <a class="csb-renew-btn" href="/renew?from=renewal">🔄 Renew Now →</a>
      </div>
    `;
  }

  // ── localStorage fallback ────────────────────────────────────────────────
  function getExpiryFromLocalStorage() {
    try {
      const payDate = localStorage.getItem('cbe_pay_date');
      const plan    = localStorage.getItem('cbe_pay_plan') || 'monthly';
      if (!payDate) return null;
      const MONTHS = { monthly: 1, termly: 3, annual: 12 };
      const expiry  = new Date(payDate);
      expiry.setMonth(expiry.getMonth() + (MONTHS[plan] || 1));
      return { expiry, plan };
    } catch (e) {
      return null;
    }
  }

  // ── Main: load expiry from Firestore, fall back to localStorage ──────────
  function init() {
    // Wait for Firebase auth to settle
    const timeout = setTimeout(() => {
      // Auth never fired — try localStorage
      const ls = getExpiryFromLocalStorage();
      if (ls) {
        renderBar(ls.expiry, ls.plan);
      } else {
        renderError('Could not load subscription info');
      }
    }, 5000);

    try {
      const auth = firebase.auth();
      const db   = firebase.firestore();

      auth.onAuthStateChanged(async (user) => {
        clearTimeout(timeout);

        if (!user) {
          // Not logged in — try localStorage (e.g. register page mid-flow)
          const ls = getExpiryFromLocalStorage();
          if (ls) {
            renderBar(ls.expiry, ls.plan);
          } else {
            bar.style.display = 'none';
            document.body.style.paddingTop = '0';
          }
          return;
        }

        try {
          const snap = await db.collection('approvedSchools').doc(user.uid).get();

          if (snap.exists) {
            const data    = snap.data();
            const tsField = data.subscriptionExpiry;
            const plan    = data.subscription || 'monthly';

            if (tsField) {
              const expiry = tsField.toDate ? tsField.toDate() : new Date(tsField);
              renderBar(expiry, plan);
              return;
            }
          }

          // Firestore doc missing or no expiry field — fall back
          throw new Error('No expiry in Firestore');

        } catch (firestoreErr) {
          console.warn('[CBE Bar] Firestore fallback:', firestoreErr.message);
          const ls = getExpiryFromLocalStorage();
          if (ls) {
            renderBar(ls.expiry, ls.plan);
          } else {
            renderError('Subscription info unavailable');
          }
        }
      });

    } catch (e) {
      // Firebase not available on this page
      clearTimeout(timeout);
      const ls = getExpiryFromLocalStorage();
      if (ls) {
        renderBar(ls.expiry, ls.plan);
      } else {
        bar.style.display = 'none';
        document.body.style.paddingTop = '0';
      }
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
