/**
 * CBE Mark Sheet System — Subscription Guard
 * Copyright © 2026 Bett Emanuel — https://bett.website
 * Fixed: onSnapshot real-time listener so overlay clears automatically after renewal
 */
(function () {

  const BASE       = '';
  const RENEW_URL  = BASE + '/renew?from=guard';
  const LOGIN_URL  = BASE + '/register';
  const WARN_DAYS  = 7;
  const GUARD_KEY  = 'cbe_sub_checked';
  const GUARD_TTL  = 5 * 60 * 1000;

  // ── Styles ───────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cbe-guard-overlay {
      position:fixed;inset:0;z-index:99999;
      background:rgba(15,23,42,0.88);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;
    }
    #cbe-guard-box {
      background:#fff;border-radius:14px;padding:36px 30px;
      max-width:380px;width:90%;text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,.4);
      font-family:'Plus Jakarta Sans',sans-serif;
      animation:guardPop .3s cubic-bezier(.175,.885,.32,1.275);
    }
    @keyframes guardPop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
    @keyframes guardFadeOut{to{opacity:0;transform:scale(.96)}}
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
  `;
  document.head.appendChild(style);

  // ── Cache helpers ────────────────────────────────────────────────────────────
  function getCached(){
    try{
      const raw=sessionStorage.getItem(GUARD_KEY);
      if(!raw) return null;
      const obj=JSON.parse(raw);
      if(Date.now()-obj.ts>GUARD_TTL){sessionStorage.removeItem(GUARD_KEY);return null;}
      return obj;
    }catch{return null;}
  }
  function setCache(status,expiresAt,daysLeft){
    try{sessionStorage.setItem(GUARD_KEY,JSON.stringify({status,expiresAt,daysLeft,ts:Date.now()}));}catch{}
  }
  function clearCache(){
    try{sessionStorage.removeItem(GUARD_KEY);}catch{}
  }

  // ── UI helpers ───────────────────────────────────────────────────────────────
  function removeOverlay(){
    const ov = document.getElementById('cbe-guard-overlay');
    if(ov){
      ov.style.animation = 'guardFadeOut .4s ease forwards';
      setTimeout(()=>{ ov.remove(); document.body.style.overflow=''; }, 400);
    }
  }

  function showSuspendedOverlay(){
    if(document.getElementById('cbe-guard-overlay')) return;
    document.body.style.overflow='hidden';
    const ov=document.createElement('div');
    ov.id='cbe-guard-overlay';
    ov.innerHTML=`
      <div id="cbe-guard-box">
        <div class="g-icon">🚫</div>
        <div class="g-title">Account Suspended</div>
        <div class="g-exp suspended">Suspended</div>
        <div class="g-msg">Your school account has been suspended.<br>Please contact support to resolve this.</div>
        <button id="cbe-guard-btn" class="suspended-btn">💬 Contact Support on WhatsApp</button>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#cbe-guard-btn').addEventListener('click',()=>{
      window.location.href='https://wa.me/254704518130';
    });
  }

  function showExpiredOverlay(expiresAt){
    if(document.getElementById('cbe-guard-overlay')) return;
    document.body.style.overflow='hidden';
    const ov=document.createElement('div');
    ov.id='cbe-guard-overlay';
    const expStr=expiresAt
      ? new Date(expiresAt).toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'})
      : '—';
    ov.innerHTML=`
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
    ov.querySelector('#cbe-guard-btn').addEventListener('click',()=>{
      window.location.href=RENEW_URL;
    });
  }

  function showWarningBanner(daysLeft,expiresAt){
    if(document.getElementById('cbe-warn-banner')) return;
    const expStr=new Date(expiresAt).toLocaleDateString('en-KE',{day:'numeric',month:'long',year:'numeric'});
    const banner=document.createElement('div');
    banner.id='cbe-warn-banner';
    banner.innerHTML=`
      <div class="wb-left">
        <span>⚠️</span>
        <span>Subscription expires in <strong>${daysLeft} day${daysLeft!==1?'s':''}</strong> (${expStr}). Renew before access is blocked.</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button class="wb-renew">Renew Now</button>
        <button class="wb-close" title="Dismiss">×</button>
      </div>`;
    document.body.prepend(banner);
    document.body.classList.add('cbe-has-banner');
    banner.querySelector('.wb-renew').addEventListener('click',()=>{ window.location.href=RENEW_URL; });
    banner.querySelector('.wb-close').addEventListener('click',()=>{ banner.remove(); document.body.classList.remove('cbe-has-banner'); });
  }

  function redirectToLogin(){ window.location.href=LOGIN_URL; }

  // ── Apply result ─────────────────────────────────────────────────────────────
  function applyResult(status,expiresAt,daysLeft){
    console.log('[Guard] Status:', status, '| daysLeft:', daysLeft);

    if(status==='suspended'){
      removeOverlay(); // remove expired overlay if showing
      showSuspendedOverlay();
    } else if(status==='expired'){
      showExpiredOverlay(expiresAt);
    } else {
      // active or warning — remove any lock overlay immediately
      removeOverlay();
      clearCache(); // force fresh check next page load
      if(status==='warning') showWarningBanner(daysLeft,expiresAt);
    }
  }

  // ── Write legacy subscription to Firestore ───────────────────────────────────
  function migrateLegacyUser(uid, createdAt){
    const legacyExpiry = new Date(createdAt);
    legacyExpiry.setMonth(legacyExpiry.getMonth() + 3);
    firebase.firestore().collection('users').doc(uid).set({
      subscription: {
        plan:      'legacy',
        status:    'active',
        paidAt:    firebase.firestore.Timestamp.fromDate(createdAt),
        expiresAt: firebase.firestore.Timestamp.fromDate(legacyExpiry),
        lastTxRef: 'legacy-payment',
        migratedAt: firebase.firestore.FieldValue.serverTimestamp()
      }
    },{ merge: true }).catch(()=>{});
    return legacyExpiry;
  }

  // ── Main guard — real-time onSnapshot ────────────────────────────────────────
  // Fires immediately on load AND on every Firestore change.
  // This means the overlay disappears the moment expiresAt is updated after payment.
  let _guardUnsub = null;

  function runGuard(uid){
    // Clear cache if payment just happened
    if(localStorage.getItem('cbe_pay_confirmed')==='true') clearCache();

    // Show cached expired state immediately while listener connects
    // (prevents brief flash of page content before Firestore responds)
    const cached = getCached();
    if(cached && cached.status === 'expired') showExpiredOverlay(cached.expiresAt);
    if(cached && cached.status === 'suspended') showSuspendedOverlay();

    // Cancel any previous listener
    if(_guardUnsub){ _guardUnsub(); _guardUnsub=null; }

    console.log('[Guard] Starting real-time listener for uid:', uid);

    _guardUnsub = firebase.firestore()
      .collection('users')
      .doc(uid)
      .onSnapshot(snap => {
        if(!snap.exists){ redirectToLogin(); return; }

        const data = snap.data();

        // ── Suspended ──
        if(data.suspended === true){
          setCache('suspended', null, 0);
          applyResult('suspended', null, 0);
          return;
        }

        // ── Has subscription record ──
        const sub = data.subscription;
        if(sub && sub.expiresAt){
          const expiresAt = sub.expiresAt.toDate ? sub.expiresAt.toDate() : new Date(sub.expiresAt);
          const now       = new Date();
          const msLeft    = expiresAt - now;
          const daysLeft  = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

          let status;
          if(msLeft <= 0)              status = 'expired';
          else if(daysLeft <= WARN_DAYS) status = 'warning';
          else                           status = 'active';

          console.log('[Guard] expiresAt:', expiresAt.toISOString(), '| daysLeft:', daysLeft, '| status:', status);
          setCache(status, expiresAt.toISOString(), daysLeft);
          applyResult(status, expiresAt.toISOString(), daysLeft);
          return;
        }

        // ── Legacy user (no subscription record) ──
        const paid      = data.paid === true || data.approved === true;
        const createdAt = data.createdAt
          ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt))
          : null;

        if(paid && createdAt){
          const legacyExpiry = migrateLegacyUser(uid, createdAt);
          const now          = new Date();
          const msLeft       = legacyExpiry - now;
          const daysLeft     = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

          let status;
          if(msLeft <= 0)              status = 'expired';
          else if(daysLeft <= WARN_DAYS) status = 'warning';
          else                           status = 'active';

          console.log('[Guard] Legacy user | legacyExpiry:', legacyExpiry.toISOString(), '| status:', status);
          setCache(status, legacyExpiry.toISOString(), daysLeft);
          applyResult(status, legacyExpiry.toISOString(), daysLeft);
          return;
        }

        // ── No payment record at all ──
        console.log('[Guard] No subscription and no payment record — expired');
        setCache('expired', null, 0);
        applyResult('expired', null, 0);

      }, err => {
        console.warn('[Guard] Firestore error — allowing access:', err.message);
      });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────────
  function boot(){
    if(typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length){
      setTimeout(boot, 200);
      return;
    }
    firebase.auth().onAuthStateChanged(user => {
      clearCache();
      if(!user){ redirectToLogin(); return; }
      runGuard(user.uid);
    });
  }

  // Cross-tab renewal detection
  window.addEventListener('storage', e => {
    if(e.key === 'cbe_pay_confirmed' && e.newValue === 'true') clearCache();
  });

  boot();
})();
