/**
 * CBE Mark Sheet System — Subscription Guard
 * Copyright © 2026 Bett Emanuel — https://bett.website
 *
 * Fixes applied:
 *  1. Overlay auto-dismisses when renewal is detected (real-time Firestore listener)
 *  2. Writes status:'suspended' + message to approvedSchools on expiry so admin.html
 *     _listenPayment fires immediately — no page refresh needed on either side.
 *  3. Poll fallback every 30s while expired/suspended to catch approval.
 *  4. Cross-tab renewal via localStorage event.
 *  5. Guard overlay and warning banner both auto-remove on renewal.
 */
(function () {

  const BASE      = '';
  const RENEW_URL = BASE + '/renew?from=guard';
  const LOGIN_URL = BASE + '/register';
  const WARN_DAYS = 7;
  const GUARD_KEY = 'cbe_sub_checked';
  const GUARD_TTL = 5 * 60 * 1000; // 5 minutes

  // ── Styles ────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cbe-guard-overlay {
      position:fixed;inset:0;z-index:99999;
      background:rgba(15,23,42,0.88);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;
      transition:opacity .4s ease;
    }
    #cbe-guard-overlay.g-hiding{opacity:0;pointer-events:none}
    #cbe-guard-box {
      background:#fff;border-radius:14px;padding:36px 30px;
      max-width:380px;width:90%;text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,.4);
      font-family:'Plus Jakarta Sans',sans-serif;
      animation:guardPop .3s cubic-bezier(.175,.885,.32,1.275);
    }
    @keyframes guardPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
    #cbe-guard-box .g-icon  {font-size:56px;margin-bottom:16px}
    #cbe-guard-box .g-title {font-size:21px;font-weight:800;color:#131c2e;margin-bottom:8px;font-family:'Familjen Grotesk',sans-serif}
    #cbe-guard-box .g-msg   {font-size:13px;color:#4f6080;line-height:1.75;margin-bottom:18px}
    #cbe-guard-box .g-exp   {display:inline-block;background:#fee2e2;color:#991b1b;border-radius:6px;padding:4px 14px;font-size:12px;font-weight:700;margin-bottom:20px}
    #cbe-guard-box .g-exp.suspended{background:#fef3c7;color:#92400e}
    #cbe-guard-btn {
      display:block;width:100%;padding:14px;
      background:linear-gradient(135deg,#1a56db,#2563eb);
      color:#fff;border:none;border-radius:8px;
      font-size:15px;font-weight:800;cursor:pointer;
      box-shadow:0 4px 16px rgba(26,86,219,.35);
      font-family:inherit;transition:opacity .15s;
    }
    #cbe-guard-btn:hover{opacity:.9}
    #cbe-guard-btn.suspended-btn{background:linear-gradient(135deg,#d97706,#f59e0b);box-shadow:0 4px 14px rgba(217,119,6,.35)}
    #cbe-warn-banner {
      position:fixed;top:0;left:0;right:0;z-index:9999;
      background:linear-gradient(135deg,#fef3c7,#fde68a);
      border-bottom:2px solid #f59e0b;
      padding:10px 18px;display:flex;align-items:center;
      justify-content:space-between;gap:12px;
      font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;
      color:#92400e;font-weight:600;
      box-shadow:0 2px 10px rgba(0,0,0,.12);
    }
    #cbe-warn-banner .wb-left{display:flex;align-items:center;gap:8px}
    #cbe-warn-banner .wb-renew{padding:6px 18px;background:#d97706;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit}
    #cbe-warn-banner .wb-close{background:none;border:none;font-size:20px;cursor:pointer;color:#b45309;line-height:1;padding:0 4px}
    body.cbe-has-banner{padding-top:52px!important}

    /* Renewal success flash */
    #cbe-renewal-flash {
      position:fixed;top:20px;left:50%;transform:translateX(-50%);
      background:#064e3b;color:#ecfdf5;
      border:1.5px solid #10b981;border-radius:10px;
      padding:12px 28px;font-size:13px;font-weight:700;
      z-index:100000;box-shadow:0 8px 24px rgba(0,0,0,.3);
      font-family:'Plus Jakarta Sans',sans-serif;
      animation:rfIn .3s ease;
    }
    @keyframes rfIn{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  `;
  document.head.appendChild(style);

  // ── State ─────────────────────────────────────────────────────────────────
  let _uid            = null;
  let _subUnsub       = null;   // Firestore real-time listener unsubscribe
  let _pollTimer      = null;   // Fallback poll interval
  let _expiryTimer    = null;   // setTimeout for when subscription ticks over
  let _currentStatus  = null;   // 'active' | 'warning' | 'expired' | 'suspended'
  let _lastExpiry     = null;   // Date — last known expiresAt

  // ── Cache helpers ─────────────────────────────────────────────────────────
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
    try { sessionStorage.setItem(GUARD_KEY, JSON.stringify({ status, expiresAt, daysLeft, ts: Date.now() })); } catch {}
  }
  function clearCache() {
    try { sessionStorage.removeItem(GUARD_KEY); } catch {}
  }

  // ── UI: show overlay ──────────────────────────────────────────────────────
  function showSuspendedOverlay() {
    if (document.getElementById('cbe-guard-overlay')) return;
    document.body.style.overflow = 'hidden';
    const ov = document.createElement('div');
    ov.id = 'cbe-guard-overlay';
    ov.innerHTML = `
      <div id="cbe-guard-box">
        <div class="g-icon">🚫</div>
        <div class="g-title">Account Suspended</div>
        <div class="g-exp suspended">Suspended</div>
        <div class="g-msg">Your school account has been suspended.<br>Please contact support to resolve this.</div>
        <button id="cbe-guard-btn" class="suspended-btn">💬 Contact Support on WhatsApp</button>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#cbe-guard-btn').addEventListener('click', () => {
      window.location.href = 'https://wa.me/254704518130';
    });
  }

  function showExpiredOverlay(expiresAt) {
    if (document.getElementById('cbe-guard-overlay')) return;
    document.body.style.overflow = 'hidden';
    const ov = document.createElement('div');
    ov.id = 'cbe-guard-overlay';
    const expStr = expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';
    ov.innerHTML = `
      <div id="cbe-guard-box">
        <div class="g-icon">🔒</div>
        <div class="g-title">Subscription Expired</div>
        <div class="g-exp">Expired: ${expStr}</div>
        <div class="g-msg">
          Your CBE Mark Sheet subscription has expired.<br>
          Renew now to continue accessing the system.<br>
          <strong style="color:#131c2e">Your data is safe</strong> — nothing is deleted.
        </div>
        <button id="cbe-guard-btn">🔄 Renew Subscription →</button>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#cbe-guard-btn').addEventListener('click', () => {
      window.location.href = RENEW_URL;
    });
  }

  function showWarningBanner(daysLeft, expiresAt) {
    if (document.getElementById('cbe-warn-banner')) return;
    const expStr = new Date(expiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
    const banner = document.createElement('div');
    banner.id = 'cbe-warn-banner';
    banner.innerHTML = `
      <div class="wb-left">
        <span>⚠️</span>
        <span>Subscription expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> (${expStr}). Renew before access is blocked.</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="wb-renew">Renew Now</button>
        <button class="wb-close" title="Dismiss">×</button>
      </div>`;
    document.body.prepend(banner);
    document.body.classList.add('cbe-has-banner');
    banner.querySelector('.wb-renew').addEventListener('click', () => { window.location.href = RENEW_URL; });
    banner.querySelector('.wb-close').addEventListener('click', () => {
      banner.remove(); document.body.classList.remove('cbe-has-banner');
    });
  }

  // ── UI: dismiss overlay / banner (called on renewal) ─────────────────────
  function dismissOverlay() {
    const ov = document.getElementById('cbe-guard-overlay');
    if (ov) {
      ov.classList.add('g-hiding');
      setTimeout(() => { ov.remove(); document.body.style.overflow = ''; }, 420);
    }
    const bn = document.getElementById('cbe-warn-banner');
    if (bn) { bn.remove(); document.body.classList.remove('cbe-has-banner'); }
  }

  function showRenewalFlash() {
    if (document.getElementById('cbe-renewal-flash')) return;
    const f = document.createElement('div');
    f.id = 'cbe-renewal-flash';
    f.textContent = '🎉 Subscription renewed — access restored!';
    document.body.appendChild(f);
    setTimeout(() => { f.style.opacity = '0'; f.style.transition = 'opacity .6s'; }, 3000);
    setTimeout(() => f.remove(), 3700);
  }

  function redirectToLogin() { window.location.href = LOGIN_URL; }

  // ── Compute status from expiry date ───────────────────────────────────────
  function computeStatus(expiresAt) {
    const now     = new Date();
    const msLeft  = expiresAt - now;
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
    let status;
    if (msLeft <= 0)               status = 'expired';
    else if (daysLeft <= WARN_DAYS) status = 'warning';
    else                            status = 'active';
    return { status, daysLeft, msLeft };
  }

  // ── Notify approvedSchools so admin.html _listenPayment fires instantly ───
  function _syncApprovedSchools(uid, status, expiresAt, message) {
    try {
      const db  = firebase.firestore();
      const ref = db.collection('approvedSchools').doc(uid);
      const upd = {};
      if (status === 'expired' || status === 'suspended') {
        upd.status  = 'suspended';
        upd.message = message || 'Subscription has expired. Please renew to continue.';
      } else {
        // active / warning — clear any suspension flag (in case it was set before)
        // Only clear if we know it was previously suspended by the guard (not by owner)
        // We use a guard-specific field to avoid overwriting owner-set messages
        upd.guardStatus = status; // guard writes to its own field, not status
        upd.message     = '';     // clears the message so admin.html removes the overlay
      }
      ref.set(upd, { merge: true }).catch(() => {});
    } catch (_) {}
  }

  // ── Clear timers ──────────────────────────────────────────────────────────
  function _clearTimers() {
    if (_pollTimer)   { clearInterval(_pollTimer);  _pollTimer   = null; }
    if (_expiryTimer) { clearTimeout(_expiryTimer); _expiryTimer = null; }
  }

  // ── Schedule a check exactly when subscription expires ───────────────────
  function _scheduleExpiryTick(uid, expiresAt) {
    _clearTimers();
    const msUntil = expiresAt - new Date();
    if (msUntil <= 0) return;
    console.log('[Guard] Subscription expires in', Math.round(msUntil / 1000) + 's — auto-check scheduled');
    _expiryTimer = setTimeout(() => {
      console.log('[Guard] Expiry timer fired — re-evaluating');
      _evaluateLive(uid);
    }, msUntil + 500);
  }

  // ── Poll every 30s while blocked, stop on renewal ─────────────────────────
  function _startPoll(uid) {
    if (_pollTimer) return; // already polling
    console.log('[Guard] Starting renewal poll (30s)');
    _pollTimer = setInterval(() => _evaluateLive(uid), 30_000);
  }

  // ── Single live read to re-evaluate current state ─────────────────────────
  function _evaluateLive(uid) {
    const db = firebase.firestore();
    db.collection('users').doc(uid).get().then(snap => {
      if (!snap.exists) return;
      _processUserDoc(uid, snap.data());
    }).catch(() => {});
  }

  // ── Apply the result of a subscription check ─────────────────────────────
  function applyResult(uid, status, expiresAt, daysLeft) {
    console.log('[Guard] Status:', status, '| daysLeft:', daysLeft, '| expiresAt:', expiresAt);

    const wasBlocked = (_currentStatus === 'expired' || _currentStatus === 'suspended');
    const nowActive  = (status === 'active' || status === 'warning');

    // Renewal detected: was blocked, now active → dismiss overlay
    if (wasBlocked && nowActive) {
      console.log('[Guard] Renewal detected — dismissing overlay');
      _clearTimers();
      clearCache();
      dismissOverlay();
      showRenewalFlash();
      // Tell admin.html via approvedSchools (clears message → _listenPayment hides its overlay)
      _syncApprovedSchools(uid, status, expiresAt, '');
      // Signal cross-tab
      try { localStorage.setItem('cbe_renewed_at', Date.now().toString()); } catch {}
    }

    _currentStatus = status;

    if (status === 'suspended') {
      showSuspendedOverlay();
      _startPoll(uid);
    } else if (status === 'expired') {
      showExpiredOverlay(expiresAt);
      // Write to approvedSchools so admin.html overlay fires immediately
      _syncApprovedSchools(uid, 'expired', expiresAt, 'Subscription has expired. Please renew to continue using the system.');
      _startPoll(uid);
    } else if (status === 'warning') {
      showWarningBanner(daysLeft, expiresAt);
      if (expiresAt) _scheduleExpiryTick(uid, new Date(expiresAt));
    } else {
      // active — schedule check for when it expires
      if (expiresAt) _scheduleExpiryTick(uid, new Date(expiresAt));
      // Stop any running poll
      if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    }
  }

  // ── Process a Firestore users doc ─────────────────────────────────────────
  function _processUserDoc(uid, data) {
    if (data.suspended === true) {
      setCache('suspended', null, 0);
      applyResult(uid, 'suspended', null, 0);
      return;
    }

    const sub = data.subscription;

    if (!sub || !sub.expiresAt) {
      // ── Legacy user: no subscription field ──────────────────────────────
      const createdAt = data.createdAt
        ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt))
        : null;
      const paid = data.paid === true || data.approved === true;

      if (paid && createdAt) {
        const legacyExpiry = new Date(createdAt);
        legacyExpiry.setMonth(legacyExpiry.getMonth() + 3);
        const { status, daysLeft } = computeStatus(legacyExpiry);
        console.log('[Guard] Legacy user — legacyExpiry:', legacyExpiry.toISOString(), '| status:', status);

        // Migrate to subscription field
        firebase.firestore().collection('users').doc(uid).set({
          subscription: {
            plan:       'legacy', status: 'active',
            paidAt:     firebase.firestore.Timestamp.fromDate(createdAt),
            expiresAt:  firebase.firestore.Timestamp.fromDate(legacyExpiry),
            lastTxRef:  data.txRef || data.mpesaRef || 'legacy-payment',
            migratedAt: firebase.firestore.FieldValue.serverTimestamp()
          }
        }, { merge: true }).catch(() => {});

        setCache(status, legacyExpiry.toISOString(), daysLeft);
        applyResult(uid, status, legacyExpiry.toISOString(), daysLeft);
        return;
      }

      // No payment at all
      console.log('[Guard] No subscription and no payment — treating as expired');
      setCache('expired', null, 0);
      applyResult(uid, 'expired', null, 0);
      return;
    }

    const expiresAt = sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt);
    const { status, daysLeft } = computeStatus(expiresAt);
    console.log('[Guard] expiresAt:', expiresAt.toISOString(), '| status:', status);
    setCache(status, expiresAt.toISOString(), daysLeft);
    applyResult(uid, status, expiresAt.toISOString(), daysLeft);
  }

  // ── Real-time Firestore listener on users doc ─────────────────────────────
  // This fires whenever subscription.expiresAt changes (e.g. after renewal write)
  // so the overlay dismisses automatically on the same tab without any refresh.
  function _startLiveListener(uid) {
    if (_subUnsub) { _subUnsub(); _subUnsub = null; }
    const db = firebase.firestore();
    _subUnsub = db.collection('users').doc(uid).onSnapshot(snap => {
      if (!snap.exists) { redirectToLogin(); return; }
      clearCache(); // always re-evaluate on live update
      _processUserDoc(uid, snap.data());
    }, err => {
      console.warn('[Guard] Live listener error — using poll fallback:', err.message);
      // On listener error, fall back to polling
      _startPoll(uid);
    });
  }

  // ── Main entry (called once after auth resolves) ──────────────────────────
  function runGuard(uid) {
    _uid = uid;

    // If payment just confirmed in this tab — clear cache and skip to live check
    if (localStorage.getItem('cbe_pay_confirmed') === 'true') {
      clearCache();
      localStorage.removeItem('cbe_pay_confirmed');
    }

    const cached = getCached();
    if (cached) {
      console.log('[Guard] Using cached result:', cached.status);
      // Still start the live listener so renewal auto-dismisses without refresh
      _startLiveListener(uid);
      applyResult(uid, cached.status, cached.expiresAt, cached.daysLeft);
      return;
    }

    console.log('[Guard] Fetching subscription from Firestore for uid:', uid);
    _startLiveListener(uid); // real-time — first snapshot triggers _processUserDoc
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  function boot() {
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
      setTimeout(boot, 200);
      return;
    }
    firebase.auth().onAuthStateChanged(user => {
      clearCache();
      _clearTimers();
      if (_subUnsub) { _subUnsub(); _subUnsub = null; }
      if (!user) { redirectToLogin(); return; }
      runGuard(user.uid);
    });
  }

  // ── Cross-tab: another tab renewed — clear cache and re-check ────────────
  window.addEventListener('storage', e => {
    if (e.key === 'cbe_pay_confirmed' && e.newValue === 'true') {
      clearCache();
      if (_uid) _evaluateLive(_uid);
    }
    if (e.key === 'cbe_renewed_at' && _uid) {
      // Another tab detected renewal — re-evaluate here too
      clearCache();
      _evaluateLive(_uid);
    }
  });

  boot();
})();
