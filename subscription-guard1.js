/**
 * CBE Mark Sheet System — Subscription Guard v3
 * Copyright © 2026 Bett Emanuel — https://bett.website
 *
 * REWRITE RATIONALE:
 *   The previous guard listened to `users/{uid}` and created its own
 *   #cbe-guard-overlay element — completely separate from admin.html's
 *   #paymentOverlay. Both ran onSnapshot listeners independently, causing
 *   a race: admin.html hides #paymentOverlay on renewal, then this guard
 *   immediately re-shows #cbe-guard-overlay from stale snapshot state.
 *
 *   This version:
 *   ✅ Listens to `approvedSchools/{uid}` — same doc as admin.html
 *   ✅ Drives admin.html's existing #paymentOverlay (no duplicate overlay)
 *   ✅ Uses admin.html's _showPaymentGate / _hidePayment if available,
 *      falls back to direct classList manipulation otherwise
 *   ✅ Keeps the warning banner for near-expiry (7 days)
 *   ✅ Keeps the suspended overlay (WhatsApp support link)
 *   ✅ Cross-tab renewal detection via localStorage event
 *   ✅ Tab-focus re-check for renewals missed while backgrounded
 *   ✅ forceHidePaymentGate() console escape hatch
 */
(function () {
  'use strict';

  const RENEW_URL  = '/renew?from=guard';
  const LOGIN_URL  = '/register';
  const WARN_DAYS  = 7;
  const GUARD_KEY  = 'cbe_sub_checked';
  const GUARD_TTL  = 5 * 60 * 1000;   // 5 min session cache

  // ── Styles (warning banner + suspended overlay only) ──────────────────────
  // NOTE: We deliberately do NOT add styles for an expired overlay —
  // admin.html's #paymentOverlay handles that UI.
  const style = document.createElement('style');
  style.textContent = `
    #cbe-susp-overlay {
      position:fixed;inset:0;z-index:99999;
      background:rgba(15,23,42,.88);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;
    }
    #cbe-susp-box {
      background:#fff;border-radius:14px;padding:36px 30px;
      max-width:380px;width:90%;text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,.4);
      font-family:'Plus Jakarta Sans',sans-serif;
      animation:gPop .3s cubic-bezier(.175,.885,.32,1.275);
    }
    @keyframes gPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
    #cbe-susp-box .g-icon  {font-size:54px;margin-bottom:14px}
    #cbe-susp-box .g-title {font-size:20px;font-weight:800;color:#131c2e;margin-bottom:8px;font-family:'Familjen Grotesk',sans-serif}
    #cbe-susp-box .g-msg   {font-size:13px;color:#4f6080;line-height:1.75;margin-bottom:18px}
    #cbe-susp-btn {
      display:block;width:100%;padding:13px;
      background:linear-gradient(135deg,#d97706,#f59e0b);
      color:#fff;border:none;border-radius:8px;
      font-size:14px;font-weight:800;cursor:pointer;
      font-family:inherit;transition:opacity .15s;
      box-shadow:0 4px 14px rgba(217,119,6,.35);
    }
    #cbe-susp-btn:hover{opacity:.9}
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
    #cbe-warn-banner .wb-renew{padding:6px 16px;background:#d97706;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit}
    #cbe-warn-banner .wb-close{background:none;border:none;font-size:20px;cursor:pointer;color:#b45309;line-height:1;padding:0 4px}
    body.cbe-has-banner{padding-top:52px!important}
  `;
  document.head.appendChild(style);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function el(id){ return document.getElementById(id); }

  function _db(){
    return window.db ||
      (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length
        ? firebase.firestore() : null);
  }

  function _schoolId(){
    return window._schoolId ||
      sessionStorage.getItem('cbe_school_id') ||
      null;
  }

  // ── Session cache ──────────────────────────────────────────────────────────
  function getCached(){
    try{
      const raw = sessionStorage.getItem(GUARD_KEY);
      if(!raw) return null;
      const obj = JSON.parse(raw);
      if(Date.now() - obj.ts > GUARD_TTL){ sessionStorage.removeItem(GUARD_KEY); return null; }
      return obj;
    }catch{ return null; }
  }
  function setCache(status, expiresAt, daysLeft){
    try{ sessionStorage.setItem(GUARD_KEY, JSON.stringify({status, expiresAt, daysLeft, ts: Date.now()})); }catch{}
  }
  function clearCache(){
    try{ sessionStorage.removeItem(GUARD_KEY); }catch{}
  }

  // ── Drive admin.html's #paymentOverlay ─────────────────────────────────────
  // Always prefer calling admin.html's own functions so state stays in sync.
  function _showGate(d, message){
    // Use admin.html's function if loaded
    if(typeof window._showPaymentGate === 'function'){
      window._showPaymentGate(d || {}, message);
      return;
    }
    // Fallback: manipulate the overlay directly
    const ov = el('paymentOverlay');
    if(!ov) return;
    const msgEl = el('povMsgText');
    if(msgEl) msgEl.textContent = message;
    const nameEl = el('povSchoolName');
    if(nameEl) nameEl.textContent = (d && d.schoolName) || window.schoolSettings?.name || '—';
    if(!ov.classList.contains('show')){
      // Reset form state
      const form = el('povForm'), sub = el('povSubmitted');
      if(form) form.style.display = '';
      if(sub)  sub.classList.remove('show');
      const btn = el('povSubmitBtn'), txt = el('povSubmitTxt');
      if(btn) btn.disabled = false;
      if(txt) txt.textContent = '📤 Send Approval Request';
      ov.classList.add('show');
    }
  }

  function _hideGate(){
    // Use admin.html's function if available — it also clears timers
    if(typeof window._hidePayment === 'function'){
      window._hidePayment();
      return;
    }
    // Fallback: remove show class directly
    const ov = el('paymentOverlay');
    if(ov && ov.classList.contains('show')){
      ov.classList.remove('show');
      if(typeof window.toast === 'function') window.toast('✅ Access restored — subscription active');
    }
    if(typeof window._clearExpiryTimers === 'function') window._clearExpiryTimers();
  }

  // ── Suspended overlay (separate UI, not #paymentOverlay) ──────────────────
  function showSuspendedOverlay(){
    if(el('cbe-susp-overlay')) return;
    const ov = document.createElement('div');
    ov.id = 'cbe-susp-overlay';
    ov.innerHTML = `
      <div id="cbe-susp-box">
        <div class="g-icon">🚫</div>
        <div class="g-title">Account Suspended</div>
        <div class="g-msg">Your school account has been suspended.<br>Please contact support to resolve this.</div>
        <button id="cbe-susp-btn">💬 Contact Support on WhatsApp</button>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#cbe-susp-btn').addEventListener('click', () => {
      window.location.href = 'https://wa.me/254704518130';
    });
  }

  function removeSuspendedOverlay(){
    const ov = el('cbe-susp-overlay');
    if(ov) ov.remove();
  }

  // ── Warning banner ─────────────────────────────────────────────────────────
  function showWarningBanner(daysLeft, expiresAt){
    if(el('cbe-warn-banner')) return;
    const expStr = new Date(expiresAt).toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'});
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
      banner.remove();
      document.body.classList.remove('cbe-has-banner');
    });
  }

  // ── Apply result from Firestore snapshot ───────────────────────────────────
  function applyResult(d, status, expiresAt, daysLeft){
    console.log('[Guard] applyResult:', status, '| daysLeft:', daysLeft);

    if(status === 'suspended'){
      _hideGate();          // hide the payment gate if it was showing
      showSuspendedOverlay();
      return;
    }

    // Active or warning — clear any block UI
    removeSuspendedOverlay();
    _hideGate();
    clearCache();

    if(status === 'warning'){
      showWarningBanner(daysLeft, expiresAt);
    }
  }

  // ── Parse a Firestore doc and decide status ────────────────────────────────
  function evaluate(data){
    const now = new Date();

    // 1. Suspended flag
    if(data.suspended === true || data.status === 'suspended'){
      return { status: 'suspended', expiresAt: null, daysLeft: 0 };
    }

    // 2. approvedSchools doc: check subscriptionExpiry first (set by renewal page)
    if(data.subscriptionExpiry){
      const exp = data.subscriptionExpiry.toDate
        ? data.subscriptionExpiry.toDate()
        : new Date(data.subscriptionExpiry);
      const msLeft   = exp - now;
      const daysLeft = Math.ceil(msLeft / 864e5);
      let status = msLeft <= 0 ? 'expired' : daysLeft <= WARN_DAYS ? 'warning' : 'active';
      return { status, expiresAt: exp.toISOString(), daysLeft };
    }

    // 3. users doc: subscription.expiresAt (legacy path)
    const sub = data.subscription;
    if(sub && sub.expiresAt){
      const exp = sub.expiresAt.toDate
        ? sub.expiresAt.toDate()
        : new Date(sub.expiresAt);
      const msLeft   = exp - now;
      const daysLeft = Math.ceil(msLeft / 864e5);
      let status = msLeft <= 0 ? 'expired' : daysLeft <= WARN_DAYS ? 'warning' : 'active';
      return { status, expiresAt: exp.toISOString(), daysLeft };
    }

    // 4. Approved/paid but no expiry record — treat as active (legacy)
    if(data.approved === true || data.paid === true || data.status === 'approved'){
      return { status: 'active', expiresAt: null, daysLeft: 999 };
    }

    // 5. Nothing found
    return { status: 'expired', expiresAt: null, daysLeft: 0 };
  }

  // ── Main real-time listener on approvedSchools ─────────────────────────────
  let _unsub = null;
  let _lastKnownExpiry = null;   // mirrors admin.html's _lastKnownExpiry

  function runGuard(uid){
    if(localStorage.getItem('cbe_pay_confirmed') === 'true') clearCache();

    if(_unsub){ _unsub(); _unsub = null; }

    console.log('[Guard] Starting approvedSchools listener for uid:', uid);

    const db = _db();
    if(!db){ console.warn('[Guard] Firestore not ready'); return; }

    _unsub = db.collection('approvedSchools').doc(uid)
      .onSnapshot(snap => {
        if(!snap.exists){
          // No record in approvedSchools — fall back to users doc
          _checkUsersDoc(uid);
          return;
        }

        const data = snap.data();
        const { status, expiresAt, daysLeft } = evaluate(data);
        const newExpiry = expiresAt ? new Date(expiresAt) : null;
        const now = new Date();

        console.log('[Guard] approvedSchools snapshot | status:', status, '| expiresAt:', expiresAt);

        // ── Renewal detection ──────────────────────────────────────────────
        // If expiry moved forward into the future, this is a renewal.
        // Hide the gate immediately regardless of other fields.
        if(newExpiry && newExpiry > now){
          if(_lastKnownExpiry && newExpiry > _lastKnownExpiry){
            console.log('[Guard] Renewal detected — expiry extended to:', expiresAt);
            _lastKnownExpiry = newExpiry;
            removeSuspendedOverlay();
            _hideGate();
            clearCache();
            setCache('active', expiresAt, daysLeft);
            _showRenewalBanner();
            return;
          }
          // First load with valid expiry
          if(!_lastKnownExpiry) _lastKnownExpiry = newExpiry;
        }

        setCache(status, expiresAt, daysLeft);

        if(status === 'expired'){
          // Show admin.html's payment gate with appropriate message
          const msg = (data.message && data.message.trim())
            ? data.message
            : 'Your subscription has expired. Please renew to continue using the system.';
          _showGate(data, msg);
          _startRenewalPoll(uid);
        } else {
          applyResult(data, status, expiresAt, daysLeft);
        }

      }, err => {
        console.warn('[Guard] approvedSchools listener error — allowing access:', err.message);
      });
  }

  // Fallback: check users doc if no approvedSchools record
  function _checkUsersDoc(uid){
    const db = _db();
    if(!db) return;
    db.collection('users').doc(uid).get().then(snap => {
      if(!snap.exists){ window.location.href = LOGIN_URL; return; }
      const data = snap.data();
      const { status, expiresAt, daysLeft } = evaluate(data);
      setCache(status, expiresAt, daysLeft);
      if(status === 'expired'){
        _showGate(data, 'Your subscription has expired. Please renew to continue.');
      } else {
        applyResult(data, status, expiresAt, daysLeft);
      }
    }).catch(err => {
      console.warn('[Guard] users doc fallback error:', err.message);
    });
  }

  // ── Renewal poll (runs while gate is visible) ──────────────────────────────
  // Safety net: onSnapshot catches most renewals, this catches any it misses.
  let _pollTimer = null;
  function _startRenewalPoll(uid){
    if(_pollTimer) return;
    console.log('[Guard] Starting renewal poll (30s)');
    _pollTimer = setInterval(async () => {
      const db = _db();
      if(!db) return;
      try{
        const snap = await db.collection('approvedSchools').doc(uid).get();
        if(!snap.exists) return;
        const data = snap.data();
        const { status, expiresAt } = evaluate(data);
        if(status !== 'expired' && status !== 'suspended'){
          console.log('[Guard] Poll: renewal confirmed — hiding gate');
          clearInterval(_pollTimer); _pollTimer = null;
          _lastKnownExpiry = expiresAt ? new Date(expiresAt) : null;
          removeSuspendedOverlay();
          _hideGate();
          clearCache();
          _showRenewalBanner();
        }
      }catch(e){ console.warn('[Guard] Poll error:', e.message); }
    }, 30_000);
  }

  // ── Renewal banner ─────────────────────────────────────────────────────────
  function _showRenewalBanner(){
    // Use admin.html's if available
    if(typeof window._showRenewalBanner === 'function'){
      window._showRenewalBanner();
      return;
    }
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#064e3b;color:#ecfdf5;border:1.5px solid #10b981;border-radius:10px;padding:12px 24px;font-size:13px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.3)';
    b.textContent = '🎉 Renewal detected — access restored!';
    document.body.appendChild(b);
    setTimeout(() => { b.style.opacity = '0'; b.style.transition = 'opacity .6s'; }, 3000);
    setTimeout(() => b.remove(), 3700);
  }

  // ── Tab visibility re-check ────────────────────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState !== 'visible') return;
    const gateOpen = el('paymentOverlay')?.classList.contains('show') ||
                     el('cbe-susp-overlay');
    if(!gateOpen) return;

    const uid = _schoolId();
    const db  = _db();
    if(!uid || !db) return;

    console.log('[Guard] Tab focused with gate open — re-checking…');
    db.collection('approvedSchools').doc(uid).get()
      .then(snap => {
        if(!snap.exists) return;
        const data = snap.data();
        const { status, expiresAt } = evaluate(data);
        const exp = expiresAt ? new Date(expiresAt) : null;
        if(status !== 'expired' && status !== 'suspended'){
          console.log('[Guard] Tab focus re-check: subscription valid — hiding gate');
          if(exp) _lastKnownExpiry = exp;
          removeSuspendedOverlay();
          _hideGate();
          clearCache();
          _showRenewalBanner();
        }
      }).catch(() => {});
  });

  // ── 60s safety poll (always-on, only acts when gate is visible) ────────────
  setInterval(() => {
    const gateOpen = el('paymentOverlay')?.classList.contains('show') ||
                     !!el('cbe-susp-overlay');
    if(!gateOpen) return;

    const uid = _schoolId();
    const db  = _db();
    if(!uid || !db) return;

    db.collection('approvedSchools').doc(uid).get()
      .then(snap => {
        if(!snap.exists) return;
        const data = snap.data();
        const { status, expiresAt } = evaluate(data);
        const exp = expiresAt ? new Date(expiresAt) : null;
        if(status !== 'expired' && status !== 'suspended'){
          console.log('[Guard] 60s poll: subscription valid — hiding gate');
          if(exp) _lastKnownExpiry = exp;
          removeSuspendedOverlay();
          _hideGate();
          clearCache();
          _showRenewalBanner();
          if(_pollTimer){ clearInterval(_pollTimer); _pollTimer = null; }
        }
      }).catch(() => {});
  }, 60_000);

  // ── Cross-tab renewal detection ────────────────────────────────────────────
  window.addEventListener('storage', e => {
    if(e.key === 'cbe_pay_confirmed' && e.newValue === 'true'){
      console.log('[Guard] Cross-tab payment detected — clearing cache');
      clearCache();
    }
  });

  // ── Console escape hatch ───────────────────────────────────────────────────
  window.forceHidePaymentGate = async function(){
    const db  = _db();
    const uid = _schoolId();
    if(!db || !uid){ _hideGate(); removeSuspendedOverlay(); return; }
    try{
      const snap = await db.collection('approvedSchools').doc(uid).get();
      if(!snap.exists){ _hideGate(); return; }
      const data = snap.data();
      const { status, expiresAt } = evaluate(data);
      if(status === 'suspended'){ console.warn('[Guard] Account is suspended — cannot force hide.'); return; }
      const exp = expiresAt ? new Date(expiresAt) : null;
      if(exp) _lastKnownExpiry = exp;
      removeSuspendedOverlay();
      _hideGate();
      clearCache();
      console.log('[Guard] forceHidePaymentGate: gate hidden. Status was:', status);
    }catch(e){
      console.error('[Guard] forceHidePaymentGate error:', e.message);
      _hideGate();
    }
  };

  // ── Boot ───────────────────────────────────────────────────────────────────
  function boot(){
    if(typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length){
      setTimeout(boot, 200);
      return;
    }
    // If admin.html already resolved the user (via its own onAuthStateChanged),
    // _schoolId() will already be set — use it directly to avoid a second
    // onAuthStateChanged race.
    const existingUid = _schoolId();
    if(existingUid){
      runGuard(existingUid);
      return;
    }
    firebase.auth().onAuthStateChanged(user => {
      clearCache();
      if(!user){ return; } // admin.html handles redirect
      runGuard(user.uid);
    });
  }

  boot();
  console.log('[Guard] subscription-guard.js v3 loaded.');
  console.log('[Guard] Tip: call forceHidePaymentGate() in console if gate is stuck.');

})();
