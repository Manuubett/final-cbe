<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iMTQiIGZpbGw9IiMxNTUzZDQiLz4KICA8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI0NCIgaGVpZ2h0PSI4IiByeD0iMi41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMjUpIi8+CiAgPHJlY3QgeD0iMTAiIHk9IjIyIiB3aWR0aD0iMTgiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC43KSIvPgogIDxyZWN0IHg9IjMyIiB5PSIyMiIgd2lkdGg9IjgiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC45KSIvPgogIDxyZWN0IHg9IjQ0IiB5PSIyMiIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQiIHJ4PSIyIiBmaWxsPSIjNGFkZTgwIi8+CiAgPHJlY3QgeD0iMTAiIHk9IjMwIiB3aWR0aD0iMTgiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC43KSIvPgogIDxyZWN0IHg9IjMyIiB5PSIzMCIgd2lkdGg9IjgiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC45KSIvPgogIDxyZWN0IHg9IjQ0IiB5PSIzMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQiIHJ4PSIyIiBmaWxsPSIjZmFjYzE1Ii8+CiAgPHJlY3QgeD0iMTAiIHk9IjM4IiB3aWR0aD0iMTgiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC43KSIvPgogIDxyZWN0IHg9IjMyIiB5PSIzOCIgd2lkdGg9IjgiIGhlaWdodD0iNCIgcng9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC45KSIvPgogIDxyZWN0IHg9IjQ0IiB5PSIzOCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjQiIHJ4PSIyIiBmaWxsPSIjNGFkZTgwIi8+CiAgPHJlY3QgeD0iMTAiIHk9IjQ3IiB3aWR0aD0iNDQiIGhlaWdodD0iNyIgcng9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xMikiLz4KICA8cmVjdCB4PSIxMyIgeT0iNDkiIHdpZHRoPSIxNCIgaGVpZ2h0PSIzIiByeD0iMS41IiBmaWxsPSIjNGFkZTgwIi8+CiAgPHJlY3QgeD0iMzAiIHk9IjQ5IiB3aWR0aD0iMTEiIGhlaWdodD0iMyIgcng9IjEuNSIgZmlsbD0iI2ZhY2MxNSIvPgogIDxyZWN0IHg9IjQ0IiB5PSI0OSIgd2lkdGg9IjciIGhlaWdodD0iMyIgcng9IjEuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjQpIi8+Cjwvc3ZnPgo=">
<meta name="theme-color" content="#0f172a">
<title>Get Started | CBE Mark Sheet System</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f0f4ff;
  --surface:#ffffff;
  --surf2:#f8faff;
  --border:#e2e8f7;
  --text:#0f172a;--text2:#475569;--text3:#94a3b8;
  --accent:#2563eb;--ah:#1d4ed8;--alight:#eff6ff;--alightb:#dbeafe;
  --green:#059669;--green-bg:#ecfdf5;--green-tx:#065f46;--green-b:#a7f3d0;
  --amber:#d97706;--amber-bg:#fffbeb;--amber-tx:#92400e;--amber-b:#fcd34d;
  --red:#dc2626;--red-bg:#fef2f2;--red-tx:#991b1b;--red-b:#fca5a5;
  --sh:0 1px 4px rgba(15,23,42,.06);
  --sh2:0 8px 32px rgba(15,23,42,.1);
  --r:14px;--r2:8px;
}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);font-size:13.5px;min-height:100vh}

/* Subtle grid bg */
body::before{content:'';position:fixed;inset:0;
  background-image:radial-gradient(circle at 1px 1px,rgba(37,99,235,.08) 1px,transparent 0);
  background-size:28px 28px;pointer-events:none;z-index:0}

/* Ambient blobs */
body::after{content:'';position:fixed;inset:0;
  background:radial-gradient(ellipse 60% 40% at 80% 10%,rgba(37,99,235,.07),transparent),
             radial-gradient(ellipse 50% 35% at 10% 90%,rgba(5,150,105,.06),transparent);
  pointer-events:none;z-index:0}

.page{position:relative;z-index:1;max-width:540px;margin:0 auto;padding:32px 18px 72px}

/* ── HEADER ── */
.hd{text-align:center;margin-bottom:28px;animation:fadeUp .5s ease both}
.hd-logo{width:56px;height:56px;background:linear-gradient(135deg,#1d4ed8,#2563eb);
  border-radius:16px;display:grid;place-items:center;font-size:26px;
  margin:0 auto 14px;box-shadow:0 6px 20px rgba(37,99,235,.3),0 0 0 1px rgba(37,99,235,.2)}
.hd-title{font-family:'Syne',sans-serif;font-size:23px;font-weight:800;letter-spacing:-.3px;margin-bottom:5px;color:var(--text)}
.hd-sub{font-size:12.5px;color:var(--text3);font-weight:500}

/* ── STEP BAR ── */
.steps{display:flex;align-items:center;justify-content:center;margin-bottom:24px;
  background:var(--surface);border:1px solid var(--border);border-radius:50px;
  padding:8px 16px;box-shadow:var(--sh);gap:0}
.stp{display:flex;align-items:center;gap:6px}
.stp-num{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:10.5px;font-weight:800;transition:all .25s}
.stp.done .stp-num{background:var(--green);color:#fff}
.stp.active .stp-num{background:var(--accent);color:#fff;box-shadow:0 0 0 3px var(--alightb)}
.stp.wait .stp-num{background:var(--border);color:var(--text3)}
.stp-lbl{font-size:11px;font-weight:700;color:var(--text3);white-space:nowrap}
.stp.active .stp-lbl{color:var(--accent)}
.stp.done .stp-lbl{color:var(--green-tx)}
.stp-line{width:28px;height:1.5px;background:var(--border);margin:0 4px;flex-shrink:0;transition:background .3s}
.done-line{background:var(--green)}

/* ── CARD ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);
  box-shadow:var(--sh2);overflow:hidden;animation:fadeUp .35s ease both}
.card+.card{margin-top:14px}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.card-head{padding:14px 20px 13px;background:linear-gradient(to bottom,var(--surf2),var(--surface));
  border-bottom:1px solid var(--border)}
.card-head-title{font-family:'Syne',sans-serif;font-size:14px;font-weight:800;
  display:flex;align-items:center;gap:7px;color:var(--text)}
.card-head-sub{font-size:11.5px;color:var(--text3);margin-top:3px}
.card-body{padding:20px}

/* ── SCREENS ── */
.screen{display:none}.screen.active{display:block}

/* ── PRICE HERO ── */
.price-hero{text-align:center;padding:22px 0 16px}
.price-badge{display:inline-block;background:var(--alightb);color:var(--accent);
  border:1px solid rgba(37,99,235,.2);font-size:10.5px;font-weight:800;
  padding:3px 12px;border-radius:20px;margin-bottom:14px;letter-spacing:.6px;text-transform:uppercase}
.price-amount{font-family:'Syne',sans-serif;font-size:46px;font-weight:800;
  color:var(--text);line-height:1;letter-spacing:-1px}
.price-period{font-size:12.5px;color:var(--text3);margin-top:6px;font-weight:500}
.features{display:flex;flex-direction:column;gap:7px;margin:18px 0}
.feat{display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--text2)}
.feat-icon{width:22px;height:22px;border-radius:6px;background:var(--green-bg);
  display:grid;place-items:center;font-size:11px;flex-shrink:0;border:1px solid var(--green-b)}
.divider{height:1px;background:var(--border);margin:16px 0}
.payment-box{background:linear-gradient(135deg,#f0fdf4,#dcfce7);
  border:1.5px solid var(--green-b);border-radius:var(--r2);padding:14px 16px;margin-bottom:16px}
.pd-title{font-size:10.5px;font-weight:800;color:#15803d;text-transform:uppercase;
  letter-spacing:.6px;margin-bottom:10px}
.pd-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;font-size:12.5px}
.pd-row:last-child{margin-bottom:0}
.pd-label{color:#166534;font-weight:600}
.pd-value{font-family:'Syne',sans-serif;font-weight:800;color:#15803d;font-size:15px}
.notice-blue{background:var(--alightb);border:1px solid rgba(37,99,235,.2);
  border-radius:var(--r2);padding:10px 14px;font-size:12px;color:var(--accent);
  line-height:1.65;margin-bottom:16px}

/* ── PAYMENT VERIFY SCREEN ── */
.verify-wrap{text-align:center;padding:24px 10px 16px}
.verify-icon-wrap{position:relative;display:inline-block;margin-bottom:16px}
.verify-spinner{width:72px;height:72px;border-radius:50%;border:3px solid var(--alightb);
  border-top-color:var(--accent);animation:spin .9s linear infinite}
.verify-icon-inner{position:absolute;inset:0;display:grid;place-items:center;font-size:28px}
@keyframes spin{to{transform:rotate(360deg)}}
.verify-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:8px;letter-spacing:-.3px}
.verify-msg{font-size:13px;color:var(--text2);line-height:1.75;margin-bottom:20px}
.status-pill{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;
  background:var(--alightb);border:1px solid rgba(37,99,235,.2);
  border-radius:50px;font-size:12.5px;color:var(--accent);font-weight:600;margin-bottom:16px}
.pulse-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);
  animation:dotpulse 1.8s ease infinite;flex-shrink:0}
@keyframes dotpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
.countdown-badge{font-size:12px;color:var(--text3);margin-bottom:18px;font-weight:500}
.countdown-badge span{font-weight:800;color:var(--text2);font-family:'Syne',sans-serif}

/* ── I'VE PAID SECTION ── */
.ipaid-section{background:var(--surf2);border:1px solid var(--border);border-radius:var(--r2);
  padding:16px;margin-bottom:12px;text-align:center}
.ipaid-label{font-size:12px;color:var(--text3);margin-bottom:10px;font-weight:500}

/* ── WAITING SCREEN ── */
.wait-wrap{text-align:center;padding:22px 10px 16px}
.wait-icon{font-size:52px;margin-bottom:14px}
.wait-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;margin-bottom:8px;letter-spacing:-.3px}
.wait-msg{font-size:13px;color:var(--text2);line-height:1.75;margin-bottom:20px}
.ref-box{background:var(--surf2);border:1px solid var(--border);border-radius:var(--r2);
  padding:10px 16px;font-family:'DM Sans',monospace;font-size:12.5px;
  color:var(--accent);font-weight:700;margin-bottom:5px;word-break:break-all}
.ref-label{font-size:11px;color:var(--text3);margin-bottom:18px}

/* ── PAYMENT CONFIRMED BANNER ── */
.pay-confirmed-bar{display:flex;align-items:center;gap:10px;padding:13px 16px;
  background:linear-gradient(135deg,#ecfdf5,#d1fae5);
  border:1.5px solid var(--green-b);border-radius:var(--r2);margin-bottom:16px}
.pcb-icon{font-size:22px}
.pcb-title{font-weight:800;font-size:13px;color:var(--green-tx)}
.pcb-sub{font-size:11.5px;color:#047857;margin-top:1px}

/* ── OWNER BANNER ── */
.owner-banner{display:none;border-radius:var(--r2);padding:12px 16px;margin-bottom:20px;border:1.5px solid}
.owner-banner.show{display:flex;align-items:flex-start;gap:10px}
.owner-banner.approved{background:var(--green-bg);border-color:var(--green-b)}
.owner-banner.pending{background:var(--amber-bg);border-color:var(--amber-b)}
.owner-banner.rejected{background:var(--red-bg);border-color:var(--red-b)}
.ob-icon{font-size:18px;flex-shrink:0}
.ob-body{flex:1}
.ob-title{font-weight:800;font-size:13px;margin-bottom:3px}
.ob-msg{font-size:12px;line-height:1.6;color:var(--text2)}
.ob-wa{display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:5px 14px;
  background:#16a34a;color:#fff;border-radius:6px;font-weight:700;font-size:12px;text-decoration:none}

/* ── FORM FIELDS ── */
.field{margin-bottom:15px}
.field label{display:block;font-size:11px;font-weight:700;color:var(--text2);
  text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px}
.field .hint{font-size:11px;color:var(--text3);margin-top:4px}
.inp-wrap{position:relative}
.inp-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none;opacity:.4}
.inp{width:100%;height:42px;padding:0 12px 0 36px;border:1.5px solid var(--border);
  border-radius:var(--r2);font-family:'DM Sans',sans-serif;font-size:13.5px;
  color:var(--text);background:var(--surface);outline:none;transition:border-color .15s,box-shadow .15s}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.inp::placeholder{color:var(--text3)}
.inp.no-icon{padding-left:12px}
.eye-btn{position:absolute;right:10px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;font-size:13px;color:var(--text3);padding:4px}
.inp.has-eye{padding-right:36px}
.pw-strength{height:3px;border-radius:2px;margin-top:6px;transition:all .3s;background:var(--border)}
.pw-strength.weak{background:var(--red);width:33%}
.pw-strength.fair{background:var(--amber);width:66%}
.pw-strength.strong{background:var(--green);width:100%}
.sec-div{font-size:10.5px;font-weight:800;color:var(--text3);text-transform:uppercase;
  letter-spacing:.6px;border-bottom:1px solid var(--border);padding-bottom:6px;margin:18px 0 14px}
.sec-div:first-child{margin-top:0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
select.inp{cursor:pointer;padding-left:12px}
.autosave-bar{display:none;align-items:center;gap:6px;font-size:11.5px;color:var(--green-tx);
  margin-bottom:16px;background:var(--green-bg);padding:7px 12px;
  border-radius:6px;border:1px solid var(--green-b)}
.autosave-bar.show{display:flex}
.save-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:dotpulse 2s infinite}

/* ── BUTTONS ── */
.btn-primary{width:100%;height:46px;background:linear-gradient(135deg,var(--accent),#1d4ed8);
  color:#fff;border:none;border-radius:var(--r2);font-family:'Syne',sans-serif;
  font-size:15px;font-weight:800;cursor:pointer;display:flex;align-items:center;
  justify-content:center;gap:7px;transition:all .15s;
  box-shadow:0 4px 16px rgba(37,99,235,.35),0 1px 0 rgba(255,255,255,.15) inset;margin-top:6px}
.btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.4)}
.btn-primary:active:not(:disabled){transform:translateY(0)}
.btn-primary:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
.btn-success{background:linear-gradient(135deg,var(--green),#047857);
  box-shadow:0 4px 16px rgba(5,150,105,.35),0 1px 0 rgba(255,255,255,.15) inset}
.btn-success:hover:not(:disabled){box-shadow:0 6px 20px rgba(5,150,105,.4)}
.btn-outline{width:100%;height:42px;background:none;border:1.5px solid var(--border);
  color:var(--text2);border-radius:var(--r2);font-family:'DM Sans',sans-serif;
  font-size:13px;font-weight:600;cursor:pointer;transition:all .14s;margin-top:8px;
  display:flex;align-items:center;justify-content:center;gap:6px}
.btn-outline:hover{background:var(--surf2);border-color:#c7d5ee}
.spin-sm{width:15px;height:15px;border:2.5px solid rgba(255,255,255,.35);
  border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;flex-shrink:0}

/* ── ALERT ── */
.alert{display:none;align-items:flex-start;gap:8px;padding:9px 12px;
  border-radius:var(--r2);font-size:12px;font-weight:500;line-height:1.55;margin-bottom:14px}
.alert.show{display:flex}
.alert.err{background:var(--red-bg);border:1px solid var(--red-b);color:var(--red-tx)}

/* ── FOOTER ── */
.footer{text-align:center;font-size:12px;color:var(--text3);margin-top:20px;line-height:1.9}
.footer a{color:var(--accent);text-decoration:none;font-weight:600}
.footer a:hover{text-decoration:underline}

/* ── TOAST ── */
#tc{position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:7px}
.t{display:flex;align-items:center;gap:8px;padding:10px 15px;border-radius:var(--r2);
  font-size:12.5px;font-weight:500;box-shadow:var(--sh2);animation:tin .25s ease;min-width:220px;max-width:320px}
.t.ok{background:#064e3b;color:#ecfdf5;border-left:3px solid #10b981}
.t.err{background:#7f1d1d;color:#fef2f2;border-left:3px solid #ef4444}
.t.info{background:#1e3a5f;color:#dbeafe;border-left:3px solid #3b82f6}
@keyframes tin{from{transform:translateX(110%);opacity:0}to{transform:none;opacity:1}}
@keyframes tout{to{transform:translateX(110%);opacity:0}}
</style>
</head>
<body>
<div id="tc"></div>

<div class="page">

  <div class="hd">
    <div class="hd-logo">🏫</div>
    <div class="hd-title">CBE Mark Sheet System</div>
    <div class="hd-sub">Kenya CBC · Primary &amp; Junior School (Grades 1–9)</div>
  </div>

  <!-- PAGE LOADER -->
  <div id="pageInitLoader" style="text-align:center;padding:48px 20px">
    <div style="width:28px;height:28px;border:3px solid var(--alightb);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 14px"></div>
    <div style="font-size:12px;color:var(--text3);font-weight:600">Loading…</div>
  </div>

  <!-- STEP INDICATORS -->
  <div class="steps" id="stepsBar" style="display:none">
    <div class="stp active" id="stp1"><div class="stp-num">1</div><div class="stp-lbl">Pricing</div></div>
    <div class="stp-line" id="line1"></div>
    <div class="stp wait" id="stp2"><div class="stp-num">2</div><div class="stp-lbl">Payment</div></div>
    <div class="stp-line" id="line2"></div>
    <div class="stp wait" id="stp3"><div class="stp-num">3</div><div class="stp-lbl">Setup</div></div>
  </div>

  <!-- OWNER BANNER -->
  <div class="owner-banner" id="ownerBanner">
    <div class="ob-icon" id="obIcon">📩</div>
    <div class="ob-body">
      <div class="ob-title" id="obTitle">Message from Administrator</div>
      <div class="ob-msg" id="obMsg">—</div>
      <a class="ob-wa" href="https://wa.me/254704518130" target="_blank">💬 Chat on WhatsApp</a>
    </div>
  </div>

  <!-- ══ STEP 0: RETURNING USER LOGIN ══ -->
  <div class="screen" id="screen0">
    <div class="card">
      <div class="card-head">
        <div class="card-head-title">🔑 Welcome Back</div>
        <div class="card-head-sub">Sign in to your existing school account</div>
      </div>
      <div class="card-body">
        <div class="alert err" id="loginErr"><span>⚠️</span><span id="loginErrMsg"></span></div>
        <div class="field">
          <label>Email Address</label>
          <div class="inp-wrap"><span class="inp-icon">✉️</span>
            <input class="inp" id="liEmail" type="email" placeholder="admin@school.ac.ke" autocomplete="email">
          </div>
        </div>
        <div class="field">
          <label>Password</label>
          <div class="inp-wrap">
            <span class="inp-icon">🔑</span>
            <input class="inp has-eye" id="liPass" type="password" placeholder="••••••••" autocomplete="current-password">
            <button class="eye-btn" onclick="toggleEye('liPass',this)" tabindex="-1">👁️</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">
          <input type="checkbox" id="rememberMe" style="width:15px;height:15px;cursor:pointer;accent-color:var(--accent)">
          <label for="rememberMe" style="font-size:12.5px;color:var(--text2);cursor:pointer;font-weight:600">Remember me on this device</label>
        </div>
        <button class="btn-primary" id="loginBtn" onclick="doLogin()">
          <span id="loginBtnTxt">Sign In →</span>
        </button>
        <button class="btn-outline" onclick="localStorage.removeItem('cbe_reg_uid');localStorage.removeItem('cbe_reg_email');goToStep(1);">
          New school? Register here →
        </button>
      </div>
    </div>
  </div>

  <!-- ══ STEP 1: PRICING + PAYMENT ══ -->
  <div class="screen" id="screen1">
    <div class="card">
      <div class="card-head">
        <div class="card-head-title">⚡ System Setup &amp; Onboarding</div>
        <div class="card-head-sub">One-time fee to get your school fully set up on CBE Mark Sheet</div>
      </div>
      <div class="card-body">
        <div class="price-hero">
          <div class="price-badge">One-Time Setup Fee</div>
          <div class="price-amount">Ksh 3,499</div>
          <div class="price-period">Paid once · No recurring charges</div>
        </div>

        <div class="features">
          <div class="feat"><div class="feat-icon">✅</div>Full system setup for your school</div>
          <div class="feat"><div class="feat-icon">✅</div>CBC Mark Sheet — Grades 1 to 9</div>
          <div class="feat"><div class="feat-icon">✅</div>All CBC subjects built in</div>
          <div class="feat"><div class="feat-icon">✅</div>Student performance analysis &amp; reports</div>
          <div class="feat"><div class="feat-icon">✅</div>Unlimited teachers &amp; streams</div>
          <div class="feat"><div class="feat-icon">✅</div>Print-ready branded report cards</div>
          <div class="feat"><div class="feat-icon">✅</div>Admin &amp; teacher accounts with role control</div>
          <div class="feat"><div class="feat-icon">✅</div>Real-time cloud sync across all devices</div>
        </div>

        <div class="divider"></div>

        <div class="payment-box">
          <div class="pd-title">💳 Pay with M-Pesa</div>
          <div class="pd-row"><span class="pd-label">Amount</span><span class="pd-value">Ksh 3,499</span></div>
          <div class="pd-row"><span class="pd-label">Method</span><span style="font-size:13px;font-weight:700;color:#15803d">M-Pesa STK Push ⚡</span></div>
          <div class="pd-row"><span class="pd-label">Activation</span><span style="font-size:13px;font-weight:700;color:#15803d">Instant &amp; Automatic</span></div>
        </div>

        <div class="notice-blue">
          📲 Enter your M-Pesa number below — you'll receive a PIN prompt directly on your phone. No redirects.
        </div>

        <div class="field" style="margin-bottom:10px">
          <label>M-Pesa Phone Number <span style="color:var(--red)">*</span></label>
          <div class="inp-wrap">
            <span class="inp-icon">📱</span>
            <input class="inp" id="payPhone" type="tel" placeholder="e.g. 0712 345 678"
              style="font-size:15px;font-weight:700;letter-spacing:1px" oninput="formatPayPhone(this)">
          </div>
          <div class="hint">Use the number registered with M-Pesa</div>
        </div>

        <div class="alert err" id="stkErr" style="margin-bottom:10px"><span>⚠️</span><span id="stkErrMsg"></span></div>

        <button class="btn-primary" id="stkBtn" onclick="initiateSTKPush()">
          <span id="stkBtnTxt">📲 Send M-Pesa Prompt →</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ══ STEP 2: VERIFYING PAYMENT ══ -->
  <div class="screen" id="screen2">
    <div class="card">
      <div class="card-body">
        <div class="verify-wrap">
          <div class="verify-icon-wrap">
            <div class="verify-spinner"></div>
            <div class="verify-icon-inner">💳</div>
          </div>
          <div class="verify-title">Verifying Payment</div>
          <div class="verify-msg">
            Check your phone for the M-Pesa PIN prompt.<br>Enter your PIN to complete payment.
          </div>

          <div class="status-pill">
            <div class="pulse-dot"></div>
            <span id="verifyStatusText">Waiting for M-Pesa confirmation…</span>
          </div>

          <div class="countdown-badge" id="verifyCountdown" style="display:none">
            Auto-checking for <span id="countdownSecs">40</span>s
          </div>
        </div>

        <!-- "I've Paid" — hidden until 40s elapses -->
        <div id="iPaidDiv" style="display:none">
          <div class="ipaid-section">
            <div class="ipaid-label">Already entered your PIN and see an M-Pesa confirmation SMS?</div>
            <button onclick="forcePaidCheck()" id="iPaidBtn" class="btn-primary btn-success" style="margin-top:0">
              <span>✅ I've Paid — Verify Now</span>
            </button>
            <div style="font-size:11px;color:var(--text3);margin-top:8px">
              This checks your payment status without sending a new prompt
            </div>
          </div>
        </div>

        <button onclick="retryPayment()" class="btn-outline" style="margin-top:8px">
          ↩ Go back and re-enter number
        </button>
      </div>
    </div>
  </div>

  <!-- ══ STEP 3: ACCOUNT + SCHOOL DETAILS ══ -->
  <div class="screen" id="screen3">
    <div class="pay-confirmed-bar">
      <div class="pcb-icon">✅</div>
      <div>
        <div class="pcb-title">Payment Confirmed!</div>
        <div class="pcb-sub">Fill in your details below to activate your account</div>
      </div>
    </div>

    <!-- Account Card -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-head">
        <div class="card-head-title">👤 Create Your Admin Account</div>
        <div class="card-head-sub">These credentials will be used to log in to the system</div>
      </div>
      <div class="card-body">
        <div class="alert err" id="acctErr"><span>⚠️</span><span id="acctErrMsg"></span></div>
        <div class="field">
          <label>Full Name <span style="color:var(--red)">*</span></label>
          <div class="inp-wrap"><span class="inp-icon">👤</span>
            <input class="inp" id="aName" placeholder="e.g. Jane Mwangi" autocomplete="name">
          </div>
        </div>
        <div class="field">
          <label>Email Address <span style="color:var(--red)">*</span></label>
          <div class="inp-wrap"><span class="inp-icon">✉️</span>
            <input class="inp" id="aEmail" type="email" placeholder="admin@school.ac.ke" autocomplete="email">
          </div>
          <div class="hint">This will be your login email</div>
        </div>
        <div class="field">
          <label>Password <span style="color:var(--red)">*</span></label>
          <div class="inp-wrap">
            <span class="inp-icon">🔑</span>
            <input class="inp has-eye" id="aPass" type="password" placeholder="Min 8 characters"
              autocomplete="new-password" oninput="checkPwStrength(this.value)">
            <button class="eye-btn" onclick="toggleEye('aPass',this)" tabindex="-1">👁️</button>
          </div>
          <div class="pw-strength" id="pwStrength"></div>
          <div class="hint" id="pwHint">Use at least 8 characters with numbers and symbols</div>
        </div>
        <div class="field">
          <label>Confirm Password <span style="color:var(--red)">*</span></label>
          <div class="inp-wrap">
            <span class="inp-icon">🔑</span>
            <input class="inp has-eye" id="aPass2" type="password" placeholder="Repeat password" autocomplete="new-password">
            <button class="eye-btn" onclick="toggleEye('aPass2',this)" tabindex="-1">👁️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- School Details Card -->
    <div class="card">
      <div class="card-head">
        <div class="card-head-title">🏫 School Details</div>
        <div class="card-head-sub">Progress is auto-saved — you can return anytime</div>
      </div>
      <div class="card-body">
        <div class="autosave-bar" id="savebar"><div class="save-dot"></div>Progress saved</div>

        <div class="sec-div">School Identity</div>
        <div class="field">
          <label>School Name <span style="color:var(--red)">*</span></label>
          <input class="inp no-icon" id="sName" placeholder="e.g. Embu Junior School" oninput="autoSave()">
        </div>
        <div class="grid2">
          <div class="field"><label>Short Name</label><input class="inp no-icon" id="sShort" placeholder="e.g. EJS" oninput="autoSave()"></div>
          <div class="field"><label>Motto</label><input class="inp no-icon" id="sMotto" placeholder="Excellence in Learning" oninput="autoSave()"></div>
        </div>
        <div class="grid2">
          <div class="field">
            <label>County <span style="color:var(--red)">*</span></label>
            <select class="inp" id="sCounty" onchange="onCountyChange();autoSave()"><option value="">-- Select County --</option></select>
          </div>
          <div class="field">
            <label>Sub-County</label>
            <select class="inp" id="sSubCounty" onchange="autoSave()"><option value="">-- Select Sub-County --</option></select>
          </div>
        </div>

        <div class="sec-div">Contact</div>
        <div class="grid2">
          <div class="field"><label>Principal <span style="color:var(--red)">*</span></label><input class="inp no-icon" id="sPrincipal" placeholder="Mr. James Mwangi" oninput="autoSave()"></div>
          <div class="field"><label>Phone <span style="color:var(--red)">*</span></label><input class="inp no-icon" id="sPhone" type="tel" placeholder="0712 345 678" oninput="autoSave()"></div>
        </div>

        <div class="sec-div">School Info</div>
        <div class="grid2">
          <div class="field">
            <label>Streams per grade</label>
            <select class="inp" id="sStreams" onchange="autoSave()">
              <option value="1">1 stream</option><option value="2">2 streams</option>
              <option value="3">3 streams</option><option value="4">4+</option>
            </select>
          </div>
          <div class="field">
            <label>Approx. students</label>
            <select class="inp" id="sStudents" onchange="autoSave()">
              <option value="<100">Less than 100</option><option value="100-300">100–300</option>
              <option value="300-500">300–500</option><option value="500+">500+</option>
            </select>
          </div>
        </div>

        <button class="btn-primary" id="submitBtn" onclick="submitDetails()">
          <span id="submitTxt">🚀 Activate My Account</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ══ STEP 4: WAITING FOR APPROVAL ══ -->
  <div class="screen" id="screen4">
    <div class="card">
      <div class="card-body">
        <div class="wait-wrap">
          <div class="wait-icon">⏳</div>
          <div class="wait-title">Awaiting Approval</div>
          <div class="wait-msg">
            Your school details have been submitted.<br><br>
            If you completed the payment, your account will activate <strong>automatically within seconds</strong>. This page updates in real time — no refresh needed.
          </div>

          <div class="status-pill" style="margin-bottom:16px">
            <div class="pulse-dot"></div>
            Waiting for payment confirmation…
          </div>

          <div class="ref-box" id="subRef">—</div>
          <div class="ref-label">Your reference number</div>

          <button onclick="retryPayment()"
            style="display:inline-flex;align-items:center;gap:8px;padding:13px 28px;
              background:linear-gradient(135deg,var(--accent),#1d4ed8);color:#fff;border:none;
              border-radius:var(--r2);font-size:14px;font-weight:700;cursor:pointer;margin:8px 0;
              box-shadow:0 4px 16px rgba(37,99,235,.35);width:100%;justify-content:center">
            ⚡ Complete Payment →
          </button>

          <div style="font-size:12px;color:var(--text3);margin-top:8px">
            Need help? <a href="https://wa.me/254704518130" target="_blank" style="color:var(--accent);font-weight:600">Chat on WhatsApp →</a>
          </div>
          <div style="font-size:12px;color:var(--text3);margin-top:6px">
            Already approved? <a href="admin" style="color:var(--accent);font-weight:600">Sign in →</a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    Already registered? <a href="#" onclick="goToStep(0);return false">Sign in here →</a>
    &nbsp;·&nbsp; New school? <a href="#" onclick="localStorage.removeItem('cbe_reg_uid');localStorage.removeItem('cbe_reg_email');goToStep(1);return false">Register →</a><br>
    CBE Mark Sheet System · Kenya CBC Junior School
  </div>
</div>

<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
<script>
firebase.initializeApp({
  apiKey:"AIzaSyBdabXqlBQ-6yVNJKdu8Zhb9Cm_-59_u24",
  authDomain:"bett-294a2.firebaseapp.com",
  projectId:"bett-294a2",
  storageBucket:"bett-294a2.appspot.com",
  messagingSenderId:"1055511650032",
  appId:"1:1055511650032:web:7e0f9c28e58515f549ac35"
});
const db=firebase.firestore(), auth=firebase.auth();
const el=id=>document.getElementById(id);

const TELEGRAM_BOT_TOKEN='8330719079:AAE4KnGBfgIbCxk1jDStmfGTvcwVsYi2Gh4';
const TELEGRAM_CHAT_ID='6851953474';

class TelegramNotifier{
  constructor(){this.apiUrl='https://api.telegram.org/bot'+TELEGRAM_BOT_TOKEN;this.chatId=TELEGRAM_CHAT_ID;}
  async send(msg){
    try{
      await fetch(this.apiUrl+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({chat_id:this.chatId,text:msg,parse_mode:'HTML'})});
    }catch(e){console.warn('[TG] Failed:',e.message);}
  }
}
const tg=new TelegramNotifier();

const SESSION_KEY='cbe_pay_session';
const SAVE_KEY='cbe_school_draft';
let currentStep=null,_sessionId=null,_paymentData=null,_createdUid=null,_regUnsub=null;
let _countdownTimer=null,_countdownSecs=40;

// ── Debug logging ──
function log(level,...args){console[level==='error'?'error':level==='warn'?'warn':'log']('[CBE]',...args);}

// ── Toast ──
function toast(msg,type='ok',dur=4000){
  const t=document.createElement('div');t.className='t '+type;t.textContent=msg;
  el('tc').appendChild(t);
  setTimeout(()=>{t.style.animation='tout .3s ease forwards';setTimeout(()=>t.remove(),300);},dur);
}

function getSessionId(){
  let sid=localStorage.getItem(SESSION_KEY);
  if(!sid){sid='sess_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);localStorage.setItem(SESSION_KEY,sid);}
  return sid;
}

// ── Phone formatting ──
function formatPayPhone(input){
  let v=input.value.replace(/\D/g,'').slice(0,12);input.value=v;
}

// ── Initiate STK Push ──
async function initiateSTKPush(){
  const phone=(el('payPhone')?.value||'').trim().replace(/\D/g,'');
  if(phone.length<9){
    el('stkErrMsg').textContent='Please enter a valid M-Pesa phone number';
    el('stkErr').classList.add('show');return;
  }
  el('stkErr').classList.remove('show');
  const btn=el('stkBtn'),txt=el('stkBtnTxt');
  btn.disabled=true;
  txt.innerHTML='<div class="spin-sm"></div> Sending prompt…';

  _sessionId=getSessionId();
  localStorage.setItem('cbe_pay_phone',phone);
  localStorage.setItem('cbe_pay_phone9',phone.slice(-9));
  log('info','[STK] Initiating push — phone:',phone,'session:',_sessionId);

  try{
    // Wake up Render server first
    try{ await fetch('https://instasend-backend.onrender.com/ping'); }catch(_){}

    const res=await fetch('https://instasend-backend.onrender.com/api/stk-push',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({phone,amount:1,userId:_sessionId})
    });
    const data=await res.json();
    log('info','[STK] Response:',data);
    if(data.success){
      goToStep(2);
      const statusEl=el('verifyStatusText');
      if(statusEl)statusEl.textContent='Waiting for M-Pesa PIN…';
      pollForPayment(_sessionId);
      toast('📲 Check your phone for M-Pesa PIN prompt!');
    }else{
      btn.disabled=false;
      txt.textContent='📲 Send M-Pesa Prompt →';
      el('stkErrMsg').textContent=data.error||'Failed to send prompt. Please try again.';
      el('stkErr').classList.add('show');
    }
  }catch(e){
    log('error','[STK] Error:',e.message);
    btn.disabled=false;
    txt.textContent='📲 Send M-Pesa Prompt →';
    el('stkErrMsg').textContent='Could not reach server. Please try again.';
    el('stkErr').classList.add('show');
  }
}

// ── Retry — go back to pricing ──
function retryPayment(){
  const btn=el('stkBtn'),txt=el('stkBtnTxt');
  if(btn)btn.disabled=false;
  if(txt)txt.textContent='📲 Send M-Pesa Prompt →';
  goToStep(1);
}

// ── Verify payment via backend API (fastest & cleanest) ──
const BACKEND = 'https://instasend-backend.onrender.com';

async function verifyPayment(sessionId){
  log('info','[PAY] Checking via backend /api/pay/status/'+sessionId);
  try{
    const res  = await fetch(`${BACKEND}/api/pay/status/${sessionId}`);
    const data = await res.json();
    log('info','[PAY] Backend response:',data.status);
    if(data.status==='confirmed'){
      _paymentData = data.payment || {};
      log('info','[PAY] ✅ Confirmed by backend');
      return true;
    }
    return false;
  }catch(e){
    log('error','[PAY] Backend check failed:',e.message);
    return false;
  }
}

// ── Countdown timer on screen2 ──
function startVerifyCountdown(){
  _countdownSecs=40;
  const secEl=el('countdownSecs'),cdDiv=el('verifyCountdown'),iPaid=el('iPaidDiv');
  if(secEl)secEl.textContent=_countdownSecs;
  if(cdDiv)cdDiv.style.display='block';
  if(iPaid)iPaid.style.display='none';
  if(_countdownTimer)clearInterval(_countdownTimer);
  _countdownTimer=setInterval(()=>{
    _countdownSecs--;
    if(secEl)secEl.textContent=_countdownSecs;
    if(_countdownSecs<=0){
      clearInterval(_countdownTimer);
      if(cdDiv)cdDiv.style.display='none';
      if(iPaid)iPaid.style.display='block';
      const statusEl=el('verifyStatusText');
      if(statusEl)statusEl.textContent='Still checking…';
    }
  },1000);
}

function stopVerifyCountdown(){
  if(_countdownTimer)clearInterval(_countdownTimer);
  _countdownTimer=null;
}

// ══════════════════════════════════════════════════════
//  forcePaidCheck — calls backend /api/pay/status/:id
//  Does NOT re-send STK. Pure status check only.
// ══════════════════════════════════════════════════════
async function forcePaidCheck(){
  const btn=el('iPaidBtn');
  const statusEl=el('verifyStatusText');

  if(btn){btn.disabled=true;btn.innerHTML='<div class="spin-sm"></div> Checking…';}
  if(statusEl)statusEl.textContent='Checking with payment server…';

  const sid=_sessionId||localStorage.getItem(SESSION_KEY);
  if(!sid){
    toast('No payment session found — please click Pay Now first','err');
    if(btn){btn.disabled=false;btn.innerHTML='<span>✅ I\'ve Paid — Verify Now</span>';}
    return;
  }

  log('info','[FORCE] Calling backend /api/pay/status/'+sid);

  try{
    const res  = await fetch(`${BACKEND}/api/pay/status/${sid}`);
    const data = await res.json();
    log('info','[FORCE] Backend response:',data.status);

    if(data.status==='confirmed'){
      _paymentData = data.payment || {};
      log('info','[FORCE] ✅ Payment confirmed');
      stopVerifyCountdown();
      toast('✅ Payment confirmed!');
      goToStep(3);
      restoreSchoolDetails();
    }else{
      log('info','[FORCE] ❌ Not confirmed yet');
      if(btn){btn.disabled=false;btn.innerHTML='<span>✅ I\'ve Paid — Verify Now</span>';}
      if(statusEl)statusEl.textContent='Payment not found yet…';
      toast('Payment not confirmed yet — wait a moment and try again','err');
    }
  }catch(e){
    log('error','[FORCE] Backend call failed:',e.message);
    if(btn){btn.disabled=false;btn.innerHTML='<span>✅ I\'ve Paid — Verify Now</span>';}
    if(statusEl)statusEl.textContent='Check failed — try again';
    toast('Could not reach server. Please try again.','err');
  }
}

// ── Poll for payment confirmation ──
async function pollForPayment(sessionId,attempts=0){
  log('info','[POLL] Attempt',(attempts+1),'/15 for session:',sessionId);
  if(attempts===0)startVerifyCountdown();
  if(attempts>15){
    log('warn','[POLL] Gave up — showing manual check button');
    stopVerifyCountdown();
    const iPaid=el('iPaidDiv');
    if(iPaid)iPaid.style.display='block';
    const cd=el('verifyCountdown');
    if(cd)cd.style.display='none';
    return;
  }
  const confirmed=await verifyPayment(sessionId);
  if(confirmed){
    log('info','[POLL] ✅ Confirmed — showing registration form');
    stopVerifyCountdown();
    goToStep(3);
    restoreSchoolDetails();
  }else{
    setTimeout(()=>pollForPayment(sessionId,attempts+1),2000);
  }
}

// ── Step navigation ──
function goToStep(n){
  const loader=el('pageInitLoader');
  if(loader)loader.style.display='none';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  el('screen'+n).classList.add('active');
  currentStep=n;
  const stepsBar=el('stepsBar');
  if(stepsBar)stepsBar.style.display=(n>=1&&n<=3)?'flex':'none';
  updateStepBar(n);
  window.scrollTo({top:0,behavior:'smooth'});
}

function updateStepBar(n){
  [1,2,3].forEach(i=>{
    const stp=el('stp'+i);
    stp.className='stp '+(i<n?'done':i===n?'active':'wait');
  });
  [1,2].forEach(i=>{
    const line=el('line'+i);
    line.className='stp-line'+(i<n?' done-line':'');
  });
}

// ── Eye toggle ──
function toggleEye(id,btn){
  const inp=el(id);inp.type=inp.type==='password'?'text':'password';
  btn.textContent=inp.type==='password'?'👁️':'🙈';
}

// ── Password strength ──
function checkPwStrength(val){
  const bar=el('pwStrength'),hint=el('pwHint');
  if(!val){bar.className='pw-strength';return;}
  const strong=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(val);
  const fair=/^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(val);
  if(strong){bar.className='pw-strength strong';hint.textContent='Strong password ✅';}
  else if(fair){bar.className='pw-strength fair';hint.textContent='Fair — add symbols for stronger';}
  else{bar.className='pw-strength weak';hint.textContent='Weak — add numbers and symbols';}
}

// ── Login ──
async function doLogin(){
  const email=(el('liEmail').value||'').trim(),pass=el('liPass').value||'';
  if(!email||!pass){el('loginErrMsg').textContent='Please enter your email and password.';el('loginErr').classList.add('show');return;}
  el('loginErr').classList.remove('show');
  const btn=el('loginBtn'),txt=el('loginBtnTxt');
  btn.disabled=true;txt.innerHTML='<div class="spin-sm"></div> Signing in…';
  try{
    const persist=el('rememberMe').checked?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION;
    await auth.setPersistence(persist);
    await auth.signInWithEmailAndPassword(email,pass);
  }catch(e){
    btn.disabled=false;txt.textContent='Sign In →';
    el('loginErrMsg').textContent=e.code==='auth/invalid-credential'||e.code==='auth/wrong-password'?'Incorrect email or password.':e.message;
    el('loginErr').classList.add('show');
  }
}

// ── Auto-save school details ──
function autoSave(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(readDetails()));el('savebar').classList.add('show');}catch(_){}
}

function readDetails(){
  return{
    name:el('sName').value.trim(),shortName:el('sShort').value.trim(),
    motto:el('sMotto').value.trim(),county:el('sCounty').value,
    subCounty:el('sSubCounty').value,principal:el('sPrincipal').value.trim(),
    phone:el('sPhone').value.trim(),streams:el('sStreams').value,students:el('sStudents').value,
  };
}

function restoreSchoolDetails(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;
    const d=JSON.parse(raw);
    if(d.name)el('sName').value=d.name;
    if(d.shortName)el('sShort').value=d.shortName;
    if(d.motto)el('sMotto').value=d.motto;
    if(d.principal)el('sPrincipal').value=d.principal;
    if(d.phone)el('sPhone').value=d.phone;
    if(d.streams)el('sStreams').value=d.streams;
    if(d.students)el('sStudents').value=d.students;
    if(d.county){el('sCounty').value=d.county;onCountyChange();setTimeout(()=>{if(d.subCounty)el('sSubCounty').value=d.subCounty;},60);}
    if(Object.values(d).some(v=>v))el('savebar').classList.add('show');
  }catch(_){}
}

// ── Create account ──
async function createAccount(name,email,pass){
  const cred=await auth.createUserWithEmailAndPassword(email,pass);
  _createdUid=cred.user.uid;
  localStorage.setItem('cbe_reg_uid',cred.user.uid);
  localStorage.setItem('cbe_reg_email',email);
  await db.collection('users').doc(_createdUid).set({
    fullName:name,email,role:'admin',status:'active',
    schoolId:_createdUid,createdAt:firebase.firestore.FieldValue.serverTimestamp()
  });
  return _createdUid;
}

// ── Submit details ──
async function submitDetails(){
  const name=(el('aName')?.value||'').trim();
  const email=(el('aEmail')?.value||'').trim();
  const pass=el('aPass')?.value||'';
  const pass2=el('aPass2')?.value||'';

  el('acctErr').classList.remove('show');

  if(!name||!email||!pass){el('acctErrMsg').textContent='Please fill in all account fields.';el('acctErr').classList.add('show');return;}
  if(pass.length<8){el('acctErrMsg').textContent='Password must be at least 8 characters.';el('acctErr').classList.add('show');return;}
  if(pass!==pass2){el('acctErrMsg').textContent='Passwords do not match.';el('acctErr').classList.add('show');return;}

  const details=readDetails();
  if(!details.name){el('acctErrMsg').textContent='Please enter your school name.';el('acctErr').classList.add('show');return;}
  if(!details.county){el('acctErrMsg').textContent='Please select a county.';el('acctErr').classList.add('show');return;}
  if(!details.principal){el('acctErrMsg').textContent='Please enter the principal\'s name.';el('acctErr').classList.add('show');return;}
  if(!details.phone){el('acctErrMsg').textContent='Please enter a phone number.';el('acctErr').classList.add('show');return;}

  const btn=el('submitBtn'),txt=el('submitTxt');
  btn.disabled=true;txt.innerHTML='<div class="spin-sm"></div> Activating account…';

  try{
    const uid=_createdUid||(await createAccount(name,email,pass));

    // ── Link payment session → Firebase uid in backend ──
    // Backend stored payment under sessionId; now tell it the real uid
    try{
      await fetch('https://instasend-backend.onrender.com/api/stk-push/link',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sessionId:_sessionId, userId:uid})
      });
    }catch(e){ log('warn','Could not link session to uid:',e.message); }

    await db.collection('settings').doc(uid).set({
      name:details.name,shortName:details.shortName||'',motto:details.motto||'',
      county:details.county,subCounty:details.subCounty||'',
      principal:details.principal,phone:details.phone,
      streams:parseInt(details.streams)||1,students:details.students||'<100',
      adminName:name,adminEmail:email,
      setupFee:_paymentData?.amount||3499,
      paymentRef:_paymentData?.reference||_paymentData?.mpesaRef||'',
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('approvedSchools').doc(uid).set({
      uid,
      status:'pending',
      schoolName:details.name,
      name:details.name,
      county:details.county,
      subCounty:details.subCounty||'',
      principal:details.principal,
      phone:details.phone,
      adminEmail:email,
      adminName:name,
      paymentRef:_paymentData?.reference||_paymentData?.mpesaRef||'',
      paymentConfirmed: true,
      detectedAt:firebase.firestore.FieldValue.serverTimestamp(),
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});

    try{
      await tg.send(
        `🏫 <b>New School Registration</b>\n` +
        `School: <b>${details.name}</b>\n` +
        `County: ${details.county} ${details.subCounty?'/ '+details.subCounty:''}\n` +
        `Principal: ${details.principal} | 📞 ${details.phone}\n` +
        `Admin: ${name} (${email})\n` +
        `Streams: ${details.streams} | Students: ${details.students}\n` +
        `Payment: ${_paymentData?.reference||_paymentData?.mpesaRef||'(auto-approved)'}`
      );
    }catch(e){log('warn','Telegram notification failed:',e.message);}

    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SESSION_KEY);

    el('subRef').textContent=uid.slice(0,16).toUpperCase();
    goToStep(4);
    el('stepsBar').style.display='none';
    listenForOwnerResponse(uid);

    // Also watch users/{uid} — backend sets approved:true there
    db.collection('users').doc(uid).onSnapshot(snap=>{
      if(!snap.exists)return;
      const u=snap.data();
      if(u.approved===true && u.approvedAt){
        log('info','[APPROVE] Backend approved this user ✅');
        // Also update approvedSchools so owner app shows it
        db.collection('approvedSchools').doc(uid).set(
          {status:'approved', approvedAt:u.approvedAt},
          {merge:true}
        ).catch(()=>{});
      }
    });
  }catch(e){
    btn.disabled=false;txt.textContent='🚀 Activate My Account';
    log('error','Submit failed:',e.message);
    el('acctErrMsg').textContent=e.code==='auth/email-already-in-use'?'This email is already registered. Please sign in instead.':('Error: '+e.message);
    el('acctErr').classList.add('show');
  }
}

// ── Listen for owner to approve/reject ──
function listenForOwnerResponse(uid){
  if(_regUnsub)_regUnsub();
  _regUnsub=db.collection('approvedSchools').doc(uid).onSnapshot(snap=>{
    if(!snap.exists)return;
    const d=snap.data();
    // Check both approvedSchools.status and users.approved (backend sets both)
    if(d.status==='approved' || d.approvedAt){
      const icon=el('screen4')?.querySelector('.wait-icon');
      const title=el('screen4')?.querySelector('.wait-title');
      const msg=el('screen4')?.querySelector('.wait-msg');
      if(icon)icon.textContent='🎉';
      if(title)title.textContent='Approved!';
      if(msg)msg.innerHTML='Your school has been approved! Redirecting to your dashboard…';
      setTimeout(()=>{window.location.href='admin.html';},1500);
      return;
    }
    if(d.status==='suspended'){
      showOwnerBanner('rejected','🚫 Registration Not Approved',
        d.message||'Your registration was not approved. Please contact us on WhatsApp if you believe this is an error.',
        'https://wa.me/254704518130');
      return;
    }
    if(d.ownerResponse&&d.ownerResponse.message&&d.ownerResponse.status!=='approved'){
      showOwnerBanner('pending','📩 Message from Administrator',d.ownerResponse.message,'https://wa.me/254704518130');
    }else if(d.message&&d.message.trim()){
      showOwnerBanner('pending','📩 Message from Administrator',d.message,d.contact||'https://wa.me/254704518130');
    }
  },e=>log('error','Approval listener error:',e.message));
}

function showOwnerBanner(type,title,msg,contact){
  el('obIcon').textContent=type==='approved'?'✅':'📩';
  el('obTitle').textContent=title;
  el('obMsg').textContent=msg;
  el('ownerBanner').className='owner-banner show '+type;
  const wa=el('ownerBanner').querySelector('.ob-wa');
  if(wa&&contact)wa.href=contact;
}

// ── Helper: check payment via backend ──
async function checkPaymentBySession(sid){
  try{
    const res=await fetch(`${BACKEND}/api/pay/status/${sid}`);
    const data=await res.json();
    if(data.status==='confirmed'){_paymentData=data.payment||{};return true;}
    return false;
  }catch(e){log('error','[PAY-CHECK] Failed:',e.message);return false;}
}

// ── Check returning user on page load ──
async function checkReturningUser(){
  const params=new URLSearchParams(window.location.search);
  const paidParam=params.get('paid'),sidParam=params.get('sid');
  const savedEmail=localStorage.getItem('cbe_reg_email');
  const savedUid=localStorage.getItem('cbe_reg_uid');

  const sid=sidParam||localStorage.getItem(SESSION_KEY);
  if(sid){
    _sessionId=sid;localStorage.setItem(SESSION_KEY,sid);
    // Use backend to check payment status
    const confirmed=await checkPaymentBySession(sid);
    if(confirmed){goToStep(3);restoreSchoolDetails();return;}
    if(paidParam==='1'||document.referrer.includes('paynecta')){
      goToStep(2);pollForPayment(sid);return;
    }
    goToStep(1);return;
  }
  if(savedEmail||savedUid){
    goToStep(0);
    const emailEl=el('liEmail');if(emailEl&&savedEmail)emailEl.value=savedEmail;return;
  }
  log('info','New visitor — showing pricing screen');
  goToStep(1);
}

checkReturningUser();

auth.onAuthStateChanged(async u=>{
  if(!u){
    if(currentStep===0)return;
    if(currentStep>=2&&currentStep<=4){log('warn','User logged out during registration flow');goToStep(0);}
    return;
  }
  log('info','User authenticated:',u.email);
  _createdUid=u.uid;
  try{
    const userSnap=await db.collection('users').doc(u.uid).get();
    if(userSnap.exists){
      const up=userSnap.data();
      if(up.role==='teacher'){
        if(up.status==='active'){window.location.href='marksheet.html';return;}
        toast('⏳ Your teacher account is pending approval.','info');
        await auth.signOut();goToStep(0);return;
      }
      const snap=await db.collection('approvedSchools').doc(u.uid).get();
      if(snap.exists){
        const d=snap.data();
        if(d.status==='approved'){window.location.href='admin.html';return;}
        if(d.status==='suspended'){
          el('subRef').textContent=u.uid.slice(0,16).toUpperCase();
          goToStep(4);el('stepsBar').style.display='none';
          listenForOwnerResponse(u.uid);
          showOwnerBanner('rejected','🚫 Registration Not Approved',
            d.message||'Your registration was not approved. Contact us on WhatsApp.','https://wa.me/254704518130');
          return;
        }
        _createdUid=u.uid;
        const sid=localStorage.getItem(SESSION_KEY);
        if(sid){
          // Use backend for payment check
          const confirmed=await checkPaymentBySession(sid);
          if(confirmed){goToStep(3);restoreSchoolDetails();return;}
          goToStep(2);pollForPayment(sid);return;
        }
        el('subRef').textContent=u.uid.slice(0,16).toUpperCase();
        goToStep(4);el('stepsBar').style.display='none';
        listenForOwnerResponse(u.uid);
        if(d.message&&d.message.trim())showOwnerBanner('pending','📩 Message from Administrator',d.message,d.contact||'https://wa.me/254704518130');
        return;
      }
      const sid2=localStorage.getItem(SESSION_KEY);
      if(sid2){
        // Use backend for payment check
        const confirmed2=await checkPaymentBySession(sid2);
        if(confirmed2){goToStep(3);restoreSchoolDetails();return;}
        goToStep(2);pollForPayment(sid2);return;
      }
      const settSnap=await db.collection('settings').doc(u.uid).get();
      if(!settSnap.exists||!settSnap.data().name){goToStep(1);}else{goToStep(4);listenForOwnerResponse(u.uid);}
    }else{
      log('warn','User authenticated but no profile found:',u.uid);
      await auth.signOut();goToStep(0);
    }
  }catch(e){log('error','Auth state check failed:',e.message);goToStep(0);}
});

// ── Login handler ──
async function doLogin(){
  const email=(el('liEmail').value||'').trim(),pass=el('liPass').value||'';
  if(!email||!pass){el('loginErrMsg').textContent='Please enter your email and password.';el('loginErr').classList.add('show');return;}
  el('loginErr').classList.remove('show');
  const btn=el('loginBtn'),txt=el('loginBtnTxt');
  btn.disabled=true;txt.innerHTML='<div class="spin-sm"></div> Signing in…';
  try{
    const persist=el('rememberMe').checked?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION;
    await auth.setPersistence(persist);
    await auth.signInWithEmailAndPassword(email,pass);
  }catch(e){
    btn.disabled=false;txt.textContent='Sign In →';
    el('loginErrMsg').textContent=e.code==='auth/invalid-credential'||e.code==='auth/wrong-password'?'Incorrect email or password.':e.message;
    el('loginErr').classList.add('show');
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  const lp=el('liPass');if(lp)lp.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
});

// ── Kenya Counties ──
const COUNTIES={
  "Baringo":["Baringo Central","Baringo North","Baringo South","Eldama Ravine","Mogotio","Tiaty"],
  "Bomet":["Bomet Central","Bomet East","Chepalungu","Konoin","Sotik"],
  "Bungoma":["Bumula","Kabuchai","Kanduyi","Kimilili","Mt. Elgon","Sirisia","Tongaren","Webuye East","Webuye West"],
  "Busia":["Budalangi","Butula","Funyula","Nambale","Teso North","Teso South"],
  "Elgeyo-Marakwet":["Keiyo North","Keiyo South","Marakwet East","Marakwet West"],
  "Embu":["Manyatta","Mbeere North","Mbeere South","Runyenjes"],
  "Garissa":["Dadaab","Fafi","Garissa Township","Hulugho","Ijara","Lagdera"],
  "Homa Bay":["Kabondo Kasipul","Karachuonyo","Kasipul","Mbita","Ndhiwa","Rangwe","Suba North","Suba South"],
  "Isiolo":["Garbatulla","Isiolo","Merti"],
  "Kajiado":["Isinya","Kajiado Central","Kajiado East","Kajiado North","Loitokitok","Mashuuru"],
  "Kakamega":["Butere","Ikolomani","Khwisero","Likuyani","Lugari","Lurambi","Malava","Matungu","Mumias East","Mumias West","Navakholo","Shinyalu"],
  "Kericho":["Ainamoi","Belgut","Bureti","Kipkelion East","Kipkelion West","Soin Sigowet"],
  "Kiambu":["Gatundu North","Gatundu South","Githunguri","Juja","Kabete","Kiambaa","Kiambu","Kikuyu","Limuru","Ruiru","Thika Town","Lari"],
  "Kilifi":["Ganze","Kaloleni","Kilifi North","Kilifi South","Magarini","Malindi","Rabai"],
  "Kirinyaga":["Gichugu","Kirinyaga Central","Mwea","Ndia"],
  "Kisii":["Bobasi","Bomachoge Borabu","Bomachoge Chache","Bonchari","Kitutu Chache North","Kitutu Chache South","Nyaribari Chache","Nyaribari Masaba","South Mugirango"],
  "Kisumu":["Kisumu Central","Kisumu East","Kisumu West","Muhoroni","Nyakach","Nyando","Seme"],
  "Kitui":["Kitui Central","Kitui East","Kitui Rural","Kitui South","Kitui West","Mwingi Central","Mwingi North","Mwingi West"],
  "Kwale":["Kinango","Lunga Lunga","Msambweni","Matuga"],
  "Laikipia":["Laikipia East","Laikipia North","Laikipia West","Nyahururu","Ol Jorok","Ol Kalou"],
  "Lamu":["Lamu East","Lamu West"],
  "Machakos":["Kathiani","Machakos Town","Masinga","Matungulu","Mavoko","Mwala","Yatta"],
  "Makueni":["Kaiti","Kibwezi East","Kibwezi West","Kilome","Makueni","Mbooni"],
  "Mandera":["Banissa","Lafey","Mandera East","Mandera North","Mandera South","Mandera West"],
  "Marsabit":["Laisamis","Moyale","North Horr","Saku"],
  "Meru":["Buuri","Igembe Central","Igembe North","Igembe South","Imenti North","Imenti South","Tigania East","Tigania West"],
  "Migori":["Awendo","Kuria East","Kuria West","Mabera","Ntimaru","Nyatike","Rongo","Suna East","Suna West","Uriri"],
  "Mombasa":["Changamwe","Jomvu","Kisauni","Likoni","Mvita","Nyali"],
  "Murang'a":["Gatanga","Kahuro","Kandara","Kangema","Kigumo","Kiharu","Mathioya","Murang'a South"],
  "Nairobi":["Dagoretti North","Dagoretti South","Embakasi Central","Embakasi East","Embakasi North","Embakasi South","Embakasi West","Githurai","Kamukunji","Kasarani","Kibra","Lang'ata","Makadara","Mathare","Roysambu","Ruaraka","Starehe","Westlands"],
  "Nakuru":["Bahati","Gilgil","Kuresoi North","Kuresoi South","Molo","Nakuru Town East","Nakuru Town West","Naivasha","Njoro","Rongai","Subukia"],
  "Nandi":["Aldai","Chesumei","Emgwen","Mosop","Nandi Hills","Tindiret"],
  "Narok":["Kilgoris","Narok East","Narok North","Narok South","Narok West","Transmara East","Transmara West"],
  "Nyamira":["Borabu","Manga","Masaba North","Nyamira North","Nyamira South"],
  "Nyandarua":["Kinangop","Kipipiri","Ndaragwa","Ol Kalou","Ol Joro Orok"],
  "Nyeri":["Kieni","Mathira","Mukurweini","Nyeri Town","Othaya","Tetu"],
  "Samburu":["Samburu East","Samburu North","Samburu West"],
  "Siaya":["Alego Usonga","Bondo","Gem","Rarieda","Ugenya","Ugunja"],
  "Taita-Taveta":["Mwatate","Taveta","Voi","Wundanyi"],
  "Tana River":["Bura","Galole","Garsen"],
  "Tharaka-Nithi":["Chuka","Igambang'ombe","Maara","Tharaka North","Tharaka South"],
  "Trans Nzoia":["Cherangany","Endebess","Kiminini","Kwanza","Saboti"],
  "Turkana":["Kibish","Loima","Turkana Central","Turkana East","Turkana North","Turkana South","Turkana West"],
  "Uasin Gishu":["Ainabkoi","Kapseret","Kesses","Moiben","Soy","Turbo"],
  "Vihiga":["Emuhaya","Hamisi","Luanda","Sabatia","Vihiga"],
  "Wajir":["Eldas","Tarbaj","Wajir East","Wajir North","Wajir South","Wajir West"],
  "West Pokot":["Central Pokot","North Pokot","Pokot South","West Pokot"]
};

(function buildCounties(){
  const sel=el('sCounty');
  Object.keys(COUNTIES).sort().forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;sel.appendChild(o);});
})();

function onCountyChange(){
  const subs=COUNTIES[el('sCounty').value]||[];
  const sel=el('sSubCounty');sel.innerHTML='<option value="">-- Select Sub-County --</option>';
  subs.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;sel.appendChild(o);});
}
</script>
</body>
</html>
