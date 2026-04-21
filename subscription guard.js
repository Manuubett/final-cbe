/**
 * subscription-guard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal subscription enforcement for CBE Mark Sheet.
 *
 * Drop ONE <script src="subscription-guard.js"></script> tag into every page
 * (admission, marksheet, analysis, settings, admin, etc.) — it self-initialises.
 *
 * What it does:
 *   • Injects a full-screen payment gate overlay into the current page's DOM.
 *   • Opens a real-time Firestore listener on approvedSchools/{schoolId}.
 *   • Schedules a one-shot timer that fires exactly when the subscription expires
 *     (bridges the gap — Firestore won't push a snapshot just because time passed).
 *   • Ticks a live countdown every second:
 *       > 7 days   → nothing shown
 *       ≤ 7 days   → orange warning bar at the bottom
 *       < 24 hours → red bar with HH:MM:SS countdown
 *       Reaches 0  → immediately shows the gate (no page refresh needed)
 *   • Polls Firestore every 30 s while expired so renewal is detected promptly.
 *   • Resets cleanly when the school renews — hides gate, shows green banner.
 *
 * Requirements:
 *   • Firebase compat SDK (app + firestore + auth) must already be loaded.
 *   • The schoolId is resolved in this order:
 *       1. window._schoolId          (set by the page after auth)
 *       2. sessionStorage cbe_school_id
 *       3. auth.currentUser.uid      (waited for if not yet available)
 *
 * Configuration (set before loading this script if you want non-defaults):
 *   window.CBE_GUARD_WARN_DAYS   = 7;    // days before expiry to show warning bar
 *   window.CBE_GUARD_POLL_MS     = 30000; // renewal poll interval while expired
 *   window.CBE_GUARD_RENEW_PATH  = '/renew'; // where the Renew button points
 *   window.CBE_GUARD_WA_NUMBER   = '254704518130';
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function(){
  'use strict';

  // ── Config (overridable from the host page) ────────────────────────────────
  const WARN_DAYS   = window.CBE_GUARD_WARN_DAYS  ?? 7;
  const POLL_MS     = window.CBE_GUARD_POLL_MS    ?? 30_000;
  const RENEW_PATH  = window.CBE_GUARD_RENEW_PATH ?? '/renew';
  const WA_NUMBER   = window.CBE_GUARD_WA_NUMBER  ?? '254704518130';
  const OVERLAY_ID  = '__cbe_sub_overlay';
  const STATUSBAR_ID= '__cbe_sub_bar';
  const BANNER_ID   = '__cbe_renewal_banner';

  // ── Internal state ─────────────────────────────────────────────────────────
  let _schoolId         = null;
  let _lastKnownExpiry  = null;
  let _renewalShown     = false;
  let _firestoreUnsub   = null;
  let _expiryTimer      = null;   // one-shot: fires exactly at expiry moment
  let _pollTimer        = null;   // 30s interval while expired
  let _countdownTimer   = null;   // 1s interval: live warning bar tick
  let _expiredTickTimer = null;   // 60s interval: "expired X ago" inside gate
  let _pageLabel        = '';     // e.g. "Admission" — used in log messages

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _log(msg, data){
    const prefix = `[CBE Guard${_pageLabel?' · '+_pageLabel:''}]`;
    if(data !== undefined) console.log(prefix, msg, data);
    else console.log(prefix, msg);
  }

  function _getDb(){
    if(typeof firebase === 'undefined') return null;
    try{ return firebase.firestore(); }catch(_){ return null; }
  }

  function _getAuth(){
    if(typeof firebase === 'undefined') return null;
    try{ return firebase.auth(); }catch(_){ return null; }
  }

  // ── Resolve schoolId ────────────────────────────────────────────────────────
  // Tries immediately; if auth hasn't resolved yet waits for onAuthStateChanged.
  function _resolveSchoolId(cb){
    if(window._schoolId){ cb(window._schoolId); return; }
    const sid = sessionStorage.getItem('cbe_school_id');
    if(sid){ cb(sid); return; }
    const auth = _getAuth();
    if(!auth){ _log('No Firebase auth — guard skipped'); return; }
    // Wait up to one auth cycle
    const unsub = auth.onAuthStateChanged(u => {
      unsub();
      if(u){ cb(u.uid); }
      else{ _log('No authenticated user — guard skipped'); }
    });
  }

  // Detect current page name from URL for nicer log messages
  function _detectPageLabel(){
    const p = window.location.pathname.split('/').pop().replace(/\.html$/,'').replace(/-/g,' ');
    return p ? p.charAt(0).toUpperCase()+p.slice(1) : 'Page';
  }

  // ── Inject CSS (idempotent) ────────────────────────────────────────────────
  function _injectStyles(){
    if(document.getElementById('__cbe_guard_css')) return;
    const s = document.createElement('style');
    s.id = '__cbe_guard_css';
    s.textContent = `
      #${OVERLAY_ID}{
        display:none;position:fixed;inset:0;z-index:99999;
        background:rgba(6,12,28,.82);
        backdrop-filter:blur(20px) saturate(.3);
        -webkit-backdrop-filter:blur(20px) saturate(.3);
        align-items:center;justify-content:center;padding:20px;
        font-family:'Plus Jakarta Sans',system-ui,sans-serif;
      }
      #${OVERLAY_ID}.cbe-show{display:flex}
      .__cbe-card{
        background:#fff;border-radius:16px;
        box-shadow:0 24px 60px rgba(0,0,0,.55);
        width:100%;max-width:400px;overflow:hidden;
        animation:__cbe_in .32s cubic-bezier(.22,1,.36,1) both;
      }
      @keyframes __cbe_in{from{opacity:0;transform:scale(.94) translateY(18px)}to{opacity:1;transform:none}}
      .__cbe-top{
        background:linear-gradient(135deg,#0f172a,#1e3a8a 68%,#1a56db);
        padding:22px 22px 16px;text-align:center;color:#fff;position:relative;overflow:hidden;
      }
      .__cbe-top::before{
        content:'';position:absolute;inset:0;
        background:radial-gradient(ellipse at 75% 10%,rgba(99,179,237,.18),transparent 60%);
      }
      .__cbe-lock{
        width:50px;height:50px;border-radius:50%;
        background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.22);
        display:flex;align-items:center;justify-content:center;
        font-size:24px;margin:0 auto 10px;
        box-shadow:0 0 0 7px rgba(255,255,255,.05);position:relative;z-index:1;
      }
      .__cbe-title{
        font-family:'Familjen Grotesk',system-ui,sans-serif;
        font-size:18px;font-weight:800;margin-bottom:5px;
        position:relative;z-index:1;letter-spacing:-.2px;
      }
      .__cbe-school{
        display:inline-block;background:rgba(255,255,255,.12);
        border:1px solid rgba(255,255,255,.2);padding:2px 14px;
        border-radius:20px;font-size:11px;color:rgba(255,255,255,.82);
        position:relative;z-index:1;max-width:260px;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      }
      .__cbe-page-badge{
        display:inline-block;background:rgba(255,255,255,.08);
        border:1px solid rgba(255,255,255,.14);padding:1px 10px;
        border-radius:20px;font-size:10px;color:rgba(255,255,255,.6);
        position:relative;z-index:1;margin-top:4px;
      }
      .__cbe-body{padding:20px 20px 4px}
      .__cbe-msg{
        font-size:13px;color:#4a5578;line-height:1.75;
        margin-bottom:16px;text-align:center;
      }
      .__cbe-renew{
        width:100%;height:44px;
        background:linear-gradient(135deg,#1a56db,#1447c0);
        color:#fff;border:none;border-radius:8px;
        font-family:'Familjen Grotesk',system-ui,sans-serif;
        font-size:15px;font-weight:800;cursor:pointer;
        display:flex;align-items:center;justify-content:center;gap:8px;
        text-decoration:none;margin-bottom:10px;
        box-shadow:0 4px 14px rgba(26,86,219,.35);transition:all .15s;
      }
      .__cbe-renew:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(26,86,219,.45)}
      .__cbe-expired-ago{
        background:#0f172a;border-top:1px solid rgba(255,255,255,.08);
        padding:9px 20px;text-align:center;
        font-size:12px;color:rgba(255,255,255,.55);display:none;
      }
      .__cbe-expired-ago.cbe-show{display:block}
      .__cbe-expired-ago strong{color:#f59e0b;font-weight:700}
      .__cbe-actions{padding:12px 20px 18px;display:flex;gap:8px}
      .__cbe-wa{
        flex:1;padding:9px;border-radius:8px;font-family:inherit;
        font-size:12px;font-weight:700;cursor:pointer;border:none;
        background:#16a34a;color:#fff;
        display:flex;align-items:center;justify-content:center;gap:6px;
        text-decoration:none;transition:background .14s;
      }
      .__cbe-wa:hover{background:#15803d}
      .__cbe-signout{
        padding:9px 14px;border-radius:8px;font-family:inherit;
        font-size:12px;font-weight:600;cursor:pointer;
        background:none;border:1.5px solid #e2e8f0;color:#94a3b8;transition:all .14s;
      }
      .__cbe-signout:hover{border-color:#cbd5e1;color:#64748b}

      /* ── Warning bar ── */
      #${STATUSBAR_ID}{
        display:none;position:fixed;bottom:0;left:0;right:0;z-index:99998;
        padding:9px 20px;font-size:12px;font-weight:600;
        align-items:center;justify-content:space-between;gap:12px;
        font-family:'Plus Jakarta Sans',system-ui,sans-serif;
        transition:background .4s,border-color .4s;
      }
      #${STATUSBAR_ID}.cbe-show{display:flex}
      #${STATUSBAR_ID}.cbe-warn{
        background:#7c2d12;border-top:2px solid #f97316;color:#fed7aa;
      }
      #${STATUSBAR_ID}.cbe-urgent{
        background:#7f1d1d;border-top:2px solid #ef4444;color:#fef2f2;
      }
      .__cbe-bar-left{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
      .__cbe-bar-timer{
        font-family:'Familjen Grotesk',system-ui,sans-serif;
        font-size:15px;font-weight:800;white-space:nowrap;
      }
      #${STATUSBAR_ID}.cbe-warn  .__cbe-bar-timer{color:#fbbf24}
      #${STATUSBAR_ID}.cbe-urgent .__cbe-bar-timer{color:#fca5a5}
      .__cbe-bar-label{font-size:11.5px;opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .__cbe-bar-renew{
        padding:5px 14px;border-radius:5px;font-family:inherit;
        font-size:11.5px;font-weight:700;cursor:pointer;border:none;
        white-space:nowrap;flex-shrink:0;
      }
      #${STATUSBAR_ID}.cbe-warn  .__cbe-bar-renew{background:#f97316;color:#fff}
      #${STATUSBAR_ID}.cbe-urgent .__cbe-bar-renew{background:#ef4444;color:#fff}
      .__cbe-bar-dismiss{
        padding:4px 8px;background:none;border:none;cursor:pointer;
        color:rgba(255,255,255,.4);font-size:16px;line-height:1;flex-shrink:0;
      }
      .__cbe-bar-dismiss:hover{color:rgba(255,255,255,.7)}

      /* ── Renewal banner ── */
      #${BANNER_ID}{
        display:none;position:fixed;top:20px;left:50%;
        transform:translateX(-50%);
        background:#064e3b;color:#ecfdf5;
        border:1.5px solid #10b981;border-radius:10px;
        padding:12px 28px;font-size:13px;font-weight:700;
        z-index:999999;box-shadow:0 8px 24px rgba(0,0,0,.35);
        font-family:'Plus Jakarta Sans',system-ui,sans-serif;
        white-space:nowrap;
        animation:__cbe_banner_in .3s ease;
      }
      @keyframes __cbe_banner_in{
        from{opacity:0;transform:translateX(-50%) translateY(-14px)}
        to{opacity:1;transform:translateX(-50%) translateY(0)}
      }
    `;
    document.head.appendChild(s);
  }

  // ── Inject DOM (idempotent) ────────────────────────────────────────────────
  function _injectDOM(){
    if(document.getElementById(OVERLAY_ID)) return;

    // Payment gate overlay
    const ov = document.createElement('div');
    ov.id = OVERLAY_ID;
    ov.innerHTML = `
      <div class="__cbe-card">
        <div class="__cbe-top">
          <div class="__cbe-lock">🔒</div>
          <div class="__cbe-title">Subscription Required</div>
          <div class="__cbe-school" id="__cbe_school_name">Your School</div>
          <div class="__cbe-page-badge" id="__cbe_page_badge"></div>
        </div>
        <div class="__cbe-body">
          <p class="__cbe-msg" id="__cbe_msg">
            Your subscription has expired. Renew now to continue — your data is safe.
          </p>
          <a class="__cbe-renew" id="__cbe_renew_btn" href="${RENEW_PATH}?from=guard">
            🔄 Renew Subscription Now →
          </a>
        </div>
        <div class="__cbe-expired-ago" id="__cbe_expired_ago"></div>
        <div class="__cbe-actions">
          <a class="__cbe-wa"
             href="https://wa.me/${WA_NUMBER}?text=Hello%2C+I+need+help+renewing+my+CBE+Mark+Sheet+subscription."
             target="_blank" rel="noopener">
            💬 WhatsApp Support
          </a>
          <button class="__cbe-signout" onclick="__cbeSignOut()">← Sign out</button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    // Warning bar
    const bar = document.createElement('div');
    bar.id = STATUSBAR_ID;
    bar.innerHTML = `
      <div class="__cbe-bar-left">
        <span class="__cbe-bar-timer" id="__cbe_bar_timer">—</span>
        <span class="__cbe-bar-label">until subscription expires — renew now to avoid disruption.</span>
      </div>
      <a class="__cbe-bar-renew" href="${RENEW_PATH}?from=warningbar">🔄 Renew</a>
      <button class="__cbe-bar-dismiss" title="Dismiss" onclick="__cbeDismissBar()">✕</button>`;
    document.body.appendChild(bar);

    // Renewal banner
    const bn = document.createElement('div');
    bn.id = BANNER_ID;
    bn.textContent = '🎉 Renewal detected — access restored!';
    document.body.appendChild(bn);

    // Global helpers called from onclick attributes
    window.__cbeSignOut = async function(){
      try{
        const auth = _getAuth();
        _cleanup();
        if(auth) await auth.signOut();
        window.location.href = '/login';
      }catch(e){ window.location.href = '/login'; }
    };
    window.__cbeDismissBar = function(){
      const b = document.getElementById(STATUSBAR_ID);
      if(b){ b.classList.remove('cbe-show','cbe-warn','cbe-urgent'); }
    };
  }

  // ── Shortcut getters ───────────────────────────────────────────────────────
  const _ov    = () => document.getElementById(OVERLAY_ID);
  const _bar   = () => document.getElementById(STATUSBAR_ID);
  const _bn    = () => document.getElementById(BANNER_ID);
  const _el    = id => document.getElementById(id);

  // ── Show / hide gate ───────────────────────────────────────────────────────
  function _showGate(d, message){
    const sn = _el('__cbe_school_name');
    if(sn) sn.textContent = d?.schoolName || window.schoolSettings?.name || '—';

    const pb = _el('__cbe_page_badge');
    if(pb && _pageLabel) pb.textContent = '📄 '+_pageLabel;

    const mg = _el('__cbe_msg');
    if(mg && message) mg.textContent = message;

    const ov = _ov();
    if(ov && !ov.classList.contains('cbe-show')){
      ov.classList.add('cbe-show');
      _log('Gate shown — '+_pageLabel);
    }
  }

  function _hideGate(){
    const ov = _ov();
    if(ov && ov.classList.contains('cbe-show')){
      ov.classList.remove('cbe-show');
      _log('Gate hidden — access restored');
      // Small toast if the page has a toast function
      if(typeof toast === 'function') toast('✅ Access restored — subscription active');
    }
    // Clear expired-ago display
    const ago = _el('__cbe_expired_ago');
    if(ago){ ago.classList.remove('cbe-show'); ago.innerHTML=''; }
    _clearAllTimers();
  }

  // ── Warning bar ────────────────────────────────────────────────────────────
  function _showBar(timerStr, isUrgent){
    const b = _bar(); if(!b) return;
    _el('__cbe_bar_timer').textContent = timerStr;
    b.className = isUrgent ? `cbe-show cbe-urgent` : `cbe-show cbe-warn`;
  }

  function _hideBar(){
    const b = _bar(); if(!b) return;
    b.classList.remove('cbe-show','cbe-warn','cbe-urgent');
  }

  // ── Renewal banner ─────────────────────────────────────────────────────────
  function _showRenewalBanner(){
    if(_renewalShown) return;
    _renewalShown = true;
    const bn = _bn(); if(!bn) return;
    bn.style.display   = 'block';
    bn.style.opacity   = '1';
    bn.style.transition = '';
    setTimeout(()=>{ bn.style.opacity='0'; bn.style.transition='opacity .6s'; }, 3000);
    setTimeout(()=>{
      bn.style.display='none'; bn.style.opacity=''; bn.style.transition='';
      _renewalShown = false; // allow next renewal on same session
    }, 3700);
  }

  // ── Clear all timers ───────────────────────────────────────────────────────
  function _clearAllTimers(){
    if(_expiryTimer)      { clearTimeout(_expiryTimer);     _expiryTimer=null; }
    if(_pollTimer)        { clearInterval(_pollTimer);       _pollTimer=null; }
    if(_countdownTimer)   { clearInterval(_countdownTimer);  _countdownTimer=null; }
    if(_expiredTickTimer) { clearInterval(_expiredTickTimer);_expiredTickTimer=null; }
  }

  // ── Full cleanup (on logout or page unload) ────────────────────────────────
  function _cleanup(){
    if(_firestoreUnsub){ _firestoreUnsub(); _firestoreUnsub=null; }
    _clearAllTimers();
    _lastKnownExpiry  = null;
    _renewalShown     = false;
  }

  // ══════════════════════════════════════════════════════════════════
  //  LIVE COUNTDOWN  (ticks every second — no refresh needed)
  // ══════════════════════════════════════════════════════════════════
  function _startLiveCountdown(expiresAt){
    if(_countdownTimer){ clearInterval(_countdownTimer); _countdownTimer=null; }

    function tick(){
      const msLeft = expiresAt - new Date();

      if(msLeft <= 0){
        // Expired while user was on this page — act immediately
        _log('Live countdown reached zero — triggering expiry check');
        _stopLiveCountdown();
        _hideBar();
        const db = _getDb();
        if(!db || !_schoolId) return;
        db.collection('approvedSchools').doc(_schoolId).get().then(snap=>{
          if(!snap.exists){ return; }
          const d   = snap.data();
          const exp = d.subscriptionExpiry?.toDate?.();
          if(!exp || exp <= new Date()){
            const msg = (d.message?.trim()) ? d.message
              : 'Your subscription has expired. Please renew to continue.';
            _showGate(d, msg);
            if(exp) _startExpiredAgo(exp);
            _startRenewalPoll();
          }
        }).catch(()=>{});
        return;
      }

      const daysLeft  = msLeft / 86_400_000;
      const hoursLeft = msLeft / 3_600_000;

      if(daysLeft > WARN_DAYS){
        _hideBar();
        return;
      }

      // Build the timer label
      let timerStr;
      if(hoursLeft < 24){
        const h = Math.floor(msLeft / 3_600_000);
        const m = Math.floor((msLeft % 3_600_000) / 60_000);
        const s = Math.floor((msLeft % 60_000) / 1_000);
        timerStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      } else {
        const d = Math.floor(daysLeft);
        const h = Math.floor((msLeft % 86_400_000) / 3_600_000);
        timerStr = `${d}d ${h}h`;
      }

      _showBar(timerStr, hoursLeft < 24);
    }

    tick(); // immediate first tick — no 1-second blank
    _countdownTimer = setInterval(tick, 1_000);
  }

  function _stopLiveCountdown(){
    if(_countdownTimer){ clearInterval(_countdownTimer); _countdownTimer=null; }
  }

  // ── "Expired X ago" ticker inside gate ────────────────────────────────────
  function _startExpiredAgo(expiredAt){
    if(_expiredTickTimer){ clearInterval(_expiredTickTimer); _expiredTickTimer=null; }

    function renderAgo(){
      const ago = _el('__cbe_expired_ago'); if(!ago) return;
      const msAgo = new Date() - expiredAt;
      if(msAgo < 0){ ago.classList.remove('cbe-show'); return; }
      const days  = Math.floor(msAgo / 86_400_000);
      const hours = Math.floor((msAgo % 86_400_000) / 3_600_000);
      const mins  = Math.floor((msAgo % 3_600_000) / 60_000);
      let agoStr;
      if(days  > 0) agoStr = `${days} day${days>1?'s':''} ${hours}h ago`;
      else if(hours>0) agoStr = `${hours}h ${mins}m ago`;
      else agoStr = `${mins} minute${mins!==1?'s':''} ago`;
      ago.innerHTML = `Subscription expired <strong>${agoStr}</strong>`;
      ago.classList.add('cbe-show');
    }

    renderAgo();
    _expiredTickTimer = setInterval(renderAgo, 60_000);
  }

  // ── Schedule one-shot timer to fire exactly at expiry ─────────────────────
  function _scheduleExpiryCheck(expiresAt){
    if(_expiryTimer){ clearTimeout(_expiryTimer); _expiryTimer=null; }
    const msUntil = expiresAt - new Date();
    if(msUntil <= 0) return;
    _log(`Expiry check scheduled in ${Math.round(msUntil/1000)}s`);
    _expiryTimer = setTimeout(()=>{
      _log('Expiry timer fired');
      const db = _getDb(); if(!db || !_schoolId) return;
      db.collection('approvedSchools').doc(_schoolId).get().then(snap=>{
        if(!snap.exists){ _hideGate(); return; }
        const d   = snap.data();
        const exp = d.subscriptionExpiry?.toDate?.();
        if(!exp || exp <= new Date()){
          const msg = (d.message?.trim()) ? d.message
            : 'Your subscription has expired. Please renew to continue.';
          _stopLiveCountdown();
          _hideBar();
          _showGate(d, msg);
          if(exp) _startExpiredAgo(exp);
          _startRenewalPoll();
        }
      }).catch(()=>{});
    }, msUntil + 500); // +0.5 s buffer
  }

  // ── Renewal poll — Firestore read every 30 s while expired ────────────────
  function _startRenewalPoll(){
    if(_pollTimer) return; // already running
    _log(`Renewal poll started (${POLL_MS/1000}s interval)`);
    _pollTimer = setInterval(async ()=>{
      const db = _getDb(); if(!db || !_schoolId) return;
      try{
        const snap    = await db.collection('approvedSchools').doc(_schoolId).get();
        if(!snap.exists) return;
        const d        = snap.data();
        const newExpiry= d.subscriptionExpiry?.toDate?.();
        if(newExpiry && newExpiry > new Date() && d.status !== 'suspended'){
          _log('Renewal detected via poll');
          _clearAllTimers();
          _lastKnownExpiry = newExpiry;
          _renewalShown    = false;
          _showRenewalBanner();
          _hideGate();
          _startLiveCountdown(newExpiry);
        }
      }catch(_){}
    }, POLL_MS);
  }

  // ══════════════════════════════════════════════════════════════════
  //  MAIN FIRESTORE LISTENER
  // ══════════════════════════════════════════════════════════════════

  /**
   * Decision order — do NOT reorder:
   *   1. No doc          → hide gate
   *   2. Renewal expiry  → renewal detected
   *   3. Suspended       → show gate (admin-blocked)
   *   4. Valid expiry    → hide gate, start countdown + expiry timer
   *   5. Expired         → show gate, start poll
   *   6. Message only    → show gate, start poll  (legacy / manual block)
   *   7. All clear       → hide gate
   */
  function _startListener(schoolId){
    if(_firestoreUnsub){ _firestoreUnsub(); _firestoreUnsub=null; }
    _clearAllTimers();

    const db = _getDb();
    if(!db){ _log('Firestore not available — guard skipped'); return; }

    _log('Listener started', schoolId);

    _firestoreUnsub = db.collection('approvedSchools').doc(schoolId)
      .onSnapshot(snap=>{
        if(!snap.exists){ _hideGate(); return; }

        const d         = snap.data();
        const now       = new Date();
        const newExpiry = d.subscriptionExpiry?.toDate?.() || null;

        // Step 1 — Renewal detection (expiry moved forward)
        if(newExpiry && newExpiry > now){
          if(_lastKnownExpiry && newExpiry > _lastKnownExpiry){
            _log('Renewal detected via snapshot', newExpiry.toISOString());
            _clearAllTimers();
            _lastKnownExpiry = newExpiry;
            _showRenewalBanner();
            _hideGate();
            _startLiveCountdown(newExpiry);
            return;
          }
          if(!_lastKnownExpiry) _lastKnownExpiry = newExpiry;
        }

        // Step 2 — Admin-suspended
        if(d.status === 'suspended'){
          _stopLiveCountdown();
          _hideBar();
          _showGate(d, 'Your account has been suspended. Contact the administrator to reactivate.');
          return;
        }

        // Step 3 — Valid subscription
        if(newExpiry && newExpiry > now){
          _scheduleExpiryCheck(newExpiry);
          _startLiveCountdown(newExpiry);
          _hideGate();
          return;
        }

        // Step 4 — Expired
        if(newExpiry && newExpiry <= now){
          const msg = (d.message?.trim()) ? d.message
            : 'Your subscription has expired. Please renew to continue.';
          _stopLiveCountdown();
          _hideBar();
          _showGate(d, msg);
          _startExpiredAgo(newExpiry);
          _startRenewalPoll();
          return;
        }

        // Step 5 — No expiry, message-only gate
        if(d.message?.trim()){
          _stopLiveCountdown();
          _hideBar();
          _showGate(d, d.message);
          _startRenewalPoll(); // so user isn't permanently stuck
          return;
        }

        // Step 6 — All clear
        _hideGate();

      }, err=>{
        _log('Listener error — not blocking user', err.message);
        _hideGate();
      });
  }

  // ── Entry point ────────────────────────────────────────────────────────────
  function _init(){
    _pageLabel = _detectPageLabel();
    _injectStyles();
    _injectDOM();

    _resolveSchoolId(uid=>{
      _schoolId = uid;
      _startListener(uid);
    });

    // Re-check if the host page sets window._schoolId late (e.g. after auth callback)
    let _didStart = false;
    Object.defineProperty(window, '_schoolId', {
      configurable: true,
      set(v){
        Object.defineProperty(window, '_schoolId', {value:v, configurable:true, writable:true});
        if(!_didStart && v){
          _didStart   = true;
          _schoolId   = v;
          _startListener(v);
        }
      },
      get(){ return _schoolId; }
    });

    // Cleanup on tab close
    window.addEventListener('beforeunload', _cleanup);
  }

  // Run immediately if DOM is ready, otherwise wait
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  // Expose for external reset (e.g. called from doLogout on any page)
  window._cbeGuardCleanup = _cleanup;
  window._cbeGuardRestart = (uid) => { _schoolId=uid; _startListener(uid); };

})();
