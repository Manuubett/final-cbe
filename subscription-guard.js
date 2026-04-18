/**
 * CBE Mark Sheet System — Subscription Guard
 * Copyright © 2026 Bett Emanuel — https://bett.website
 *
 * DROP THIS SCRIPT INTO ANY PROTECTED PAGE:
 *   <script src="/final-cbe/subscription-guard.js"></script>
 *
 * What it does:
 *  - Checks if user is logged in → if not, sends to /final-cbe/registration.html
 *  - Checks if user is suspended → blocks with overlay
 *  - Reads subscription.expiresAt from Firestore
 *  - If expired → blocks page and redirects to /final-cbe/renew.html?from=guard
 *  - If expiring within 7 days → shows a dismissible warning banner
 *  - If active → does nothing, page loads normally
 *
 * FIXES APPLIED:
 *  1. Correct base path for GitHub Pages (/final-cbe)
 *  2. Removed dead redirectToRenew() — overlay button uses addEventListener
 *  3. Inline onclick strings replaced with addEventListener (CSP-safe)
 *  4. Cache cleared on every auth state change (prevents cross-user bleed)
 *  5. Suspended user check added
 *  6. Same-tab renewal detection — clears cache immediately if pay just completed
 */

(function () {

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyBdabXqlBQ-6yVNJKdu8Zhb9Cm_-59_u24",
    authDomain:        "bett-294a2.firebaseapp.com",
    projectId:         "bett-294a2",
    storageBucket:     "bett-294a2.appspot.com",
    messagingSenderId: "1055511650032",
    appId:             "1:1055511650032:web:7e0f9c28e58515f549ac35"
  };

  // FIX 1: Correct base path for GitHub Pages project site
  const BASE       = '/final-cbe';
  const RENEW_URL  = BASE + '/renew.html?from=guard';
  const LOGIN_URL  = BASE + '/registration.html';

  const WARN_DAYS  = 7;
  const GUARD_KEY  = 'cbe_sub_checked';
  const GUARD_TTL  = 5 * 60 * 1000;   // 5 minutes

  // ── INJECT STYLES ───────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cbe-guard-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(15,23,42,0.82); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
    }
    #cbe-guard-box {
      background: #fff; border-radius: 12px; padding: 32px 28px;
      max-width: 380px; width: 90%; text-align: center;
      box-shadow: 0 24px 64px rgba(0,0,0,0.3);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    #cbe-guard-box .g-icon  { font-size: 52px; margin-bottom: 14px; }
    #cbe-guard-box .g-title { font-size: 20px; font-weight: 800; color: #131c2e; margin-bottom: 8px; }
    #cbe-guard-box .g-msg   { font-size: 13px; color: #4f6080; line-height: 1.7; margin-bottom: 22px; }
    #cbe-guard-box .g-exp   {
      display: inline-block; background: #fee2e2; color: #991b1b;
      border-radius: 6px; padding: 4px 12px; font-size: 12px;
      font-weight: 700; margin-bottom: 18px;
    }
    #cbe-guard-box .g-exp.suspended {
      background: #fef3c7; color: #92400e;
    }
    #cbe-guard-btn {
      display: block; width: 100%; padding: 13px;
      background: linear-gradient(135deg, #1a56db, #2563eb);
      color: #fff; border: none; border-radius: 8px;
      font-size: 15px; font-weight: 800; cursor: pointer;
      box-shadow: 0 4px 14px rgba(26,86,219,.35);
      font-family: inherit;
    }
    #cbe-guard-btn:hover { opacity: .92; }
    #cbe-guard-btn.suspended-btn {
      background: linear-gradient(135deg, #d97706, #f59e0b);
      box-shadow: 0 4px 14px rgba(217,119,6,.35);
    }

    #cbe-warn-banner {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-bottom: 2px solid #f59e0b;
      padding: 10px 16px; display: flex;
      align-items: center; justify-content: space-between; gap: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;
      color: #92400e; font-weight: 600;
      box-shadow: 0 2px 8px rgba(0,0,0,.1);
    }
    #cbe-warn-banner .wb-left  { display: flex; align-items: center; gap: 8px; }
    #cbe-warn-banner .wb-renew {
      padding: 6px 16px; background: #d97706; color: #fff;
      border: none; border-radius: 6px; font-size: 12px;
      font-weight: 800; cursor: pointer; white-space: nowrap;
      font-family: inherit;
    }
    #cbe-warn-banner .wb-close {
      background: none; border: none; font-size: 18px;
      cursor: pointer; color: #b45309; line-height: 1; padding: 0 4px;
    }
    body.cbe-has-banner { padding-top: 52px !important; }
  `;
  document.head.appendChild(style);

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  // FIX 5: Separate suspended overlay with WhatsApp contact button
  function showSuspendedOverlay() {
    document.body.style.overflow = 'hidden';
    const overlay = document.createElement('div');
    overlay.id = 'cbe-guard-overlay';
    overlay.innerHTML = `
      <div id="cbe-guard-box">
        <div class="g-icon">🚫</div>
        <div class="g-title">Account Suspended</div>
        <div class="g-exp suspended">Account Suspended</div>
        <div class="g-msg">
          Your school account has been suspended.<br>
          Please contact support to resolve this.
        </div>
        <button id="cbe-guard-btn" class="suspended-btn">
          💬 Contact Support on WhatsApp
        </button>
      </div>
    `;
    document.body.appendChild(overlay);

    // FIX 3: addEventListener instead of inline onclick string
    overlay.querySelector('#cbe-guard-btn')
      .addEventListener('click', () => {
        window.location.href = 'https://wa.me/254704518130';
      });
  }

  function showExpiredOverlay(expiresAt) {
    document.body.style.overflow = 'hidden';
    const overlay = document.createElement('div');
    overlay.id = 'cbe-guard-overlay';
    const expStr = expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';
    overlay.innerHTML = `
      <div id="cbe-guard-box">
        <div class="g-icon">🔒</div>
        <div class="g-title">Subscription Expired</div>
        <div class="g-exp">Expired: ${expStr}</div>
        <div class="g-msg">
          Your CBE Mark Sheet subscription has expired.<br>
          Renew now to continue accessing the system.<br>
          <strong>Your data is safe</strong> — nothing is deleted.
        </div>
        <button id="cbe-guard-btn">Renew Subscription →</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // FIX 3: addEventListener instead of inline onclick string (CSP-safe)
    overlay.querySelector('#cbe-guard-btn')
      .addEventListener('click', () => {
        window.location.href = RENEW_URL;
      });
  }

  function showWarningBanner(daysLeft, expiresAt) {
    const expStr = new Date(expiresAt).toLocaleDateString('en-KE', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const banner = document.createElement('div');
    banner.id = 'cbe-warn-banner';
    banner.innerHTML = `
      <div class="wb-left">
        <span>⚠️</span>
        <span>Your subscription expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> (${expStr}). Renew before access is blocked.</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="wb-renew">Renew Now</button>
        <button class="wb-close" title="Dismiss">×</button>
      </div>
    `;
    document.body.prepend(banner);
    document.body.classList.add('cbe-has-banner');

    // FIX 3: addEventListener for banner buttons (CSP-safe)
    banner.querySelector('.wb-renew')
      .addEventListener('click', () => {
        window.location.href = RENEW_URL;
      });
    banner.querySelector('.wb-close')
      .addEventListener('click', () => {
        banner.remove();
        document.body.classList.remove('cbe-has-banner');
      });
  }

  function redirectToLogin() {
    window.location.href = LOGIN_URL;
  }

  // ── CACHE ────────────────────────────────────────────────────────────────────
  function getCached() {
    try {
      const raw = sessionStorage.getItem(GUARD_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() - obj.ts > GUARD_TTL) { sessionStorage.removeItem(GUARD_KEY); return null; }
      return obj;
    } catch { return null; }
  }

  function setCache(status, expiresAt, daysLeft) {
    try {
      sessionStorage.setItem(GUARD_KEY, JSON.stringify({
        status, expiresAt, daysLeft, ts: Date.now()
      }));
    } catch {}
  }

  function clearCache() {
    try { sessionStorage.removeItem(GUARD_KEY); } catch {}
  }

  // ── MAIN GUARD ───────────────────────────────────────────────────────────────
  function runGuard(uid) {

    // FIX 6: Same-tab renewal detection
    // The storage event doesn't fire in the same tab that set the value,
    // so we check localStorage directly here to catch same-tab renewals.
    if (localStorage.getItem('cbe_pay_confirmed') === 'true') {
      clearCache();
    }

    // Use cache if still fresh
    const cached = getCached();
    if (cached) {
      applyResult(cached.status, cached.expiresAt, cached.daysLeft);
      return;
    }

    // Fetch live from Firestore
    firebase.firestore()
      .collection('users')
      .doc(uid)
      .get()
      .then(snap => {
        if (!snap.exists) { redirectToLogin(); return; }

        const data = snap.data();

        // FIX 5: Check suspension before subscription dates
        if (data.suspended === true) {
          setCache('suspended', null, 0);
          applyResult('suspended', null, 0);
          return;
        }

        const sub = data.subscription;

        // No subscription record at all
        if (!sub || !sub.expiresAt) {
          setCache('expired', null, 0);
          applyResult('expired', null, 0);
          return;
        }

        const expiresAt = sub.expiresAt.toDate
          ? sub.expiresAt.toDate()
          : new Date(sub.expiresAt);
        const now      = new Date();
        const msLeft   = expiresAt - now;
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

        let status;
        if (msLeft <= 0)             status = 'expired';
        else if (daysLeft <= WARN_DAYS) status = 'warning';
        else                          status = 'active';

        setCache(status, expiresAt.toISOString(), daysLeft);
        applyResult(status, expiresAt.toISOString(), daysLeft);
      })
      .catch(err => {
        // On Firestore error allow access — will retry on next load
        console.warn('[CBE Guard] Firestore error:', err.message);
      });
  }

  function applyResult(status, expiresAt, daysLeft) {
    if (status === 'suspended') {
      showSuspendedOverlay();
    } else if (status === 'expired') {
      showExpiredOverlay(expiresAt);
    } else if (status === 'warning') {
      showWarningBanner(daysLeft, expiresAt);
    }
    // 'active' → do nothing, page loads normally
  }

  // ── BOOT ─────────────────────────────────────────────────────────────────────
  function boot() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      setTimeout(boot, 300);
      return;
    }

    firebase.auth().onAuthStateChanged(user => {
      // FIX 4: Always clear cache on auth state change
      // Prevents user A's cached result bleeding into user B's session
      // when two people share the same browser (e.g. school office PC)
      clearCache();

      if (!user) {
        redirectToLogin();
        return;
      }

      runGuard(user.uid);
    });
  }

  // FIX 4 (cross-tab): Clear cache when renewal completes in another tab
  window.addEventListener('storage', e => {
    if (e.key === 'cbe_pay_confirmed' && e.newValue === 'true') {
      clearCache();
    }
  });

  boot();

})();
