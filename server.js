require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const admin   = require('firebase-admin');

// ── Firebase init ────────────────────────────────────────────────────────────
let db;
if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  db = admin.firestore();
  console.log('✅ Firebase connected');
} else {
  console.warn('⚠️  Firebase env vars not set — wallet routes will not work');
}

// ── Your central AT credentials (set in Render env vars) ────────────────────
const AT_API_KEY  = process.env.AT_API_KEY;
const AT_USERNAME = process.env.AT_USERNAME;

if (!AT_API_KEY)  console.warn('⚠️  AT_API_KEY not set — central SMS will not work');
if (!AT_USERNAME) console.warn('⚠️  AT_USERNAME not set — central SMS will not work');

// Masked diagnostic — lets you confirm in Render's logs exactly what got
// loaded (catches trailing newlines/spaces/quotes pasted into env vars,
// or accidentally pointing at the wrong app's key) without leaking the
// full secret. Compare username/length/prefix/suffix against the AT
// dashboard for the "bett254" app.
if (AT_API_KEY && AT_USERNAME) {
  console.log(
    `[AT Config] username:"${AT_USERNAME}" (len:${AT_USERNAME.length}) ` +
    `apiKey:${AT_API_KEY.slice(0, 6)}…${AT_API_KEY.slice(-4)} (len:${AT_API_KEY.length})`
  );
}

// ── SMS cost per message (KES) ───────────────────────────────────────────────
const SMS_COST_PER_MSG = 1; // KES 1 per SMS, you pay ~0.80 → 0.20 margin

// ── Telegram Notifier ────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }
    );
  } catch (err) {
    console.error('[Telegram] Failed:', err.response?.data || err.message);
  }
}

// ════════════════════════════════════════════════════════════════
//  REQUEST DEDUPE GUARD — protects against double-submits / races
//  (in-memory; fine for a single Render instance. If this service
//   ever runs on multiple instances/dynos, swap this for a
//   Firestore- or Redis-backed check instead.)
// ════════════════════════════════════════════════════════════════
const _recentRequests  = new Map(); // dedupeKey -> timestamp
const DEDUPE_WINDOW_MS = 30_000;    // ignore exact repeats within 30s

function isDuplicateRequest(key) {
  const now = Date.now();
  for (const [k, ts] of _recentRequests) {
    if (now - ts > DEDUPE_WINDOW_MS) _recentRequests.delete(k);
  }
  if (_recentRequests.has(key)) return true;
  _recentRequests.set(key, now);
  return false;
}

// ── App setup ────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Paynecta config ──────────────────────────────────────────────────────────
const API_KEY       = process.env.PAYNECTA_API_KEY;
const USER_EMAIL    = process.env.PAYNECTA_EMAIL;
const MERCHANT_CODE = process.env.PAYNECTA_CODE;
const BASE_URL      = 'https://paynecta.co.ke/api/v1';

const paynectaHeaders = () => ({
  'X-API-Key':    API_KEY,
  'X-User-Email': USER_EMAIL,
  'Content-Type': 'application/json',
});

function normalisePhone(phone) {
  let p = phone.toString().replace(/\D/g, '');
  if (p.startsWith('0'))    p = '254' + p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

// ════════════════════════════════════════════════════════════════
//  WALLET HELPERS
// ════════════════════════════════════════════════════════════════

/**
 * Get wallet balance for a school.
 * Returns 0 if wallet doc doesn't exist yet.
 */
async function getWalletBalance(schoolId) {
  const snap = await db.collection('wallets').doc(schoolId).get();
  return snap.exists ? (snap.data().balance || 0) : 0;
}

/**
 * Deduct SMS cost from wallet atomically.
 * Returns new balance, or throws if insufficient.
 */
async function deductWallet(schoolId, cost = SMS_COST_PER_MSG) {
  const ref = db.collection('wallets').doc(schoolId);
  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data().balance || 0) : 0;
    if (current < cost) throw new Error('INSUFFICIENT_BALANCE');
    const newBalance = parseFloat((current - cost).toFixed(2));
    tx.set(ref, {
      balance:    newBalance,
      totalSpent: admin.firestore.FieldValue.increment(cost),
      updatedAt:  new Date().toISOString(),
    }, { merge: true });
    return newBalance;
  });
}

/**
 * Credit wallet — called from webhook on confirmed payment.
 */
async function creditWallet(schoolId, amount, meta = {}) {
  const ref = db.collection('wallets').doc(schoolId);
  await db.runTransaction(async (tx) => {
    const snap    = await tx.get(ref);
    const current = snap.exists ? (snap.data().balance || 0) : 0;
    tx.set(ref, {
      balance:      parseFloat((current + amount).toFixed(2)),
      totalTopups:  admin.firestore.FieldValue.increment(amount),
      lastTopup:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
      ...meta,
    }, { merge: true });
  });
  // Log the top-up
  await db.collection('wallets').doc(schoolId)
    .collection('topups').add({
      amount,
      ...meta,
      creditedAt: new Date().toISOString(),
    });
}

// ════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ════════════════════════════════════════════════════════════════
//  WALLET ROUTES
// ════════════════════════════════════════════════════════════════

/**
 * GET /api/wallet/balance/:schoolId
 * Returns current SMS wallet balance for a school.
 */
app.get('/api/wallet/balance/:schoolId', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const snap = await db.collection('wallets').doc(req.params.schoolId).get();
    const data  = snap.exists ? snap.data() : {};
    res.json({
      balance:     data.balance     || 0,
      totalTopups: data.totalTopups || 0,
      totalSpent:  data.totalSpent  || 0,
      lastTopup:   data.lastTopup   || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/wallet/topup
 * Body: { schoolId, amount, phone, requestId? }
 * Triggers STK push. On webhook confirm → wallet is credited.
 */
app.post('/api/wallet/topup', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  const { schoolId, amount, phone, requestId } = req.body;

  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });
  if (!amount || isNaN(amount) || Number(amount) < 10) {
    return res.status(400).json({ error: 'Minimum top-up is KES 10' });
  }
  if (!phone) return res.status(400).json({ error: 'phone required' });

  // Guard against double STK pushes (double-click, accidental resubmit, etc.)
  const dedupeKey = `topup:${requestId || `${schoolId}:${amount}:${phone}`}`;
  if (isDuplicateRequest(dedupeKey)) {
    return res.status(409).json({
      error:   'DUPLICATE_REQUEST',
      message: 'A top-up for this amount/phone was already initiated moments ago — check your M-Pesa messages before retrying.',
    });
  }

  if (!API_KEY || !USER_EMAIL || !MERCHANT_CODE) {
    return res.status(500).json({ error: 'Payment gateway not configured on server' });
  }

  try {
    const mobile  = normalisePhone(phone);
    const payload = {
      code:          MERCHANT_CODE,
      mobile_number: mobile,
      amount:        Number(amount),
    };

    const response = await axios.post(`${BASE_URL}/payment/initialize`, payload, {
      headers: paynectaHeaders(),
    });

    const txRef = response.data?.data?.transaction_reference
               || response.data?.data?.CheckoutRequestID;

    // Save payment doc — type: 'wallet_topup' so webhook knows to credit wallet
    if (txRef) {
      await db.collection('payments').doc(txRef).set({
        type:      'wallet_topup',   // ← tells webhook what to do
        schoolId,
        userId:    schoolId,
        phone:     mobile,
        amount:    Number(amount),
        status:    'pending',
        txRef,
        createdAt: new Date().toISOString(),
      });
    }

    console.log(`[Wallet Topup] schoolId:${schoolId} amount:${amount} txRef:${txRef}`);

    sendTelegram(
      `💳 <b>WALLET TOP-UP INITIATED</b>\n\n` +
      `🏫 schoolId: <code>${schoolId}</code>\n` +
      `📞 Phone: <code>${mobile}</code>\n` +
      `💰 Amount: Ksh ${amount}\n` +
      `🆔 txRef: <code>${txRef}</code>\n` +
      `⏰ ${new Date().toLocaleString('en-KE')}`
    );

    res.json({ success: true, message: '✅ STK Push sent! Check your phone.', txRef });

  } catch (err) {
    console.error('[Wallet Topup] Error:', err.response?.data || err.message);
    res.status(400).json({ success: false, error: err.response?.data || err.message });
  }
});

/**
 * GET /api/wallet/topup-status/:txRef
 * Poll from frontend to confirm top-up completed.
 */
app.get('/api/wallet/topup-status/:txRef', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const snap = await db.collection('payments').doc(req.params.txRef).get();
    if (!snap.exists) return res.json({ status: 'pending' });
    const d = snap.data();
    res.json({ status: d.status, amount: d.amount, schoolId: d.schoolId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
//  CENTRAL SMS — uses YOUR AT key, deducts from school wallet
// ════════════════════════════════════════════════════════════════

/**
 * POST /api/sms/send-school
 * Body: { schoolId, to, message, from?, requestId? }
 *
 * 1. Checks school wallet has enough balance
 * 2. Sends SMS via YOUR AT account
 * 3. Deducts KES 1 from wallet
 * 4. Logs the transaction
 */
app.post('/api/sms/send-school', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });

  const { schoolId, to, message, from, requestId } = req.body;

  if (!schoolId) return res.status(400).json({ error: 'schoolId required' });
  if (!to)       return res.status(400).json({ error: 'to (phone) required' });
  if (!message)  return res.status(400).json({ error: 'message required' });

  // Guard against the same SMS being submitted twice in quick succession
  const dedupeKey = `single:${requestId || `${schoolId}:${to}:${message}`}`;
  if (isDuplicateRequest(dedupeKey)) {
    return res.status(409).json({
      error:   'DUPLICATE_REQUEST',
      message: 'This SMS was already submitted moments ago — ignoring the repeat.',
    });
  }

  if (!AT_API_KEY || !AT_USERNAME) {
    return res.status(500).json({ error: 'Central AT credentials not configured on server (set AT_API_KEY, AT_USERNAME)' });
  }

  // ── 1. Check balance ────────────────────────────────────────
  let balance;
  try {
    balance = await getWalletBalance(schoolId);
  } catch (err) {
    return res.status(500).json({ error: 'Could not read wallet: ' + err.message });
  }

  if (balance < SMS_COST_PER_MSG) {
    return res.status(402).json({
      error:          'INSUFFICIENT_BALANCE',
      message:        `Your SMS wallet is empty. Top up to continue sending.`,
      balance,
      required:       SMS_COST_PER_MSG,
    });
  }

  // ── 2. Send via YOUR AT account ─────────────────────────────
  let atData;
  try {
    const params = new URLSearchParams({ username: AT_USERNAME, to, message });
    if (from) params.append('from', from);

    const response = await axios.post(
      'https://api.africastalking.com/version1/messaging',
      params.toString(),
      {
        headers: {
          apiKey:         AT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept:         'application/json',
        },
        validateStatus: () => true,
      }
    );

    atData = response.data;
    console.log(`[SMS School] AT status:${response.status} schoolId:${schoolId} to:${to}`);

    if (response.status >= 500) {
      return res.status(502).json({ error: 'AT gateway error', detail: atData });
    }
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach AT: ' + err.message });
  }

  // ── 3. Deduct from wallet (only if AT accepted) ─────────────
  const recipient  = atData?.SMSMessageData?.Recipients?.[0];
  const atStatus   = (recipient?.status || '').toLowerCase();
  const wasAccepted = atStatus.includes('success') || atStatus.includes('sent') ||
                      atStatus.includes('queued')   || atStatus.includes('submitted');

  let newBalance = balance;
  if (wasAccepted) {
    try {
      newBalance = await deductWallet(schoolId, SMS_COST_PER_MSG);
    } catch (deductErr) {
      // Log but don't block — SMS already sent
      console.error('[Wallet] Deduct failed after send:', deductErr.message);
    }
  }

  // ── 4. Log SMS ──────────────────────────────────────────────
  try {
    await db.collection('smsLogs').doc(schoolId).collection('logs').add({
      to,
      message,
      from:       from || '',
      status:     wasAccepted ? 'sent' : 'failed',
      atStatus:   recipient?.status || '',
      cost:       wasAccepted ? SMS_COST_PER_MSG : 0,
      balance:    newBalance,
      messageId:  recipient?.messageId || '',
      sentAt:     new Date().toISOString(),
    });
  } catch (_) { /* non-critical */ }

  return res.json({
    success:    wasAccepted,
    atResponse: atData,
    balance:    newBalance,
    deducted:   wasAccepted ? SMS_COST_PER_MSG : 0,
  });
});

/**
 * POST /api/sms/send-bulk-school
 * Body: { schoolId, recipients: [{to, message, from?}], requestId? }
 *
 * Checks balance covers ALL recipients upfront.
 * Sends one by one, deducting per success.
 */
app.post('/api/sms/send-bulk-school', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });

  const { schoolId, recipients, requestId } = req.body;
  if (!schoolId)              return res.status(400).json({ error: 'schoolId required' });
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'recipients array required' });
  }

  // Guard against the same batch being submitted twice in quick succession
  // (double-click, two tabs, slow network causing a client-side retry, etc.)
  const dedupeKey = `bulk:${requestId || `${schoolId}:${JSON.stringify(recipients)}`}`;
  if (isDuplicateRequest(dedupeKey)) {
    console.warn(`[Bulk SMS] Ignored duplicate batch — schoolId:${schoolId} recipients:${recipients.length}`);
    return res.status(409).json({
      error:   'DUPLICATE_REQUEST',
      message: 'This batch was already submitted moments ago — ignoring the repeat to avoid double-sending and double-charging.',
    });
  }

  if (!AT_API_KEY || !AT_USERNAME) {
    return res.status(500).json({ error: 'Central AT credentials not configured' });
  }

  // ── Pre-flight balance check ─────────────────────────────────
  const balance = await getWalletBalance(schoolId);
  const maxSend = Math.floor(balance / SMS_COST_PER_MSG);

  if (maxSend === 0) {
    return res.status(402).json({
      error:    'INSUFFICIENT_BALANCE',
      message:  `Wallet empty. Top up to send SMS. Current balance: KES ${balance}`,
      balance,
    });
  }

  const canSend  = recipients.slice(0, maxSend);
  const willSkip = recipients.slice(maxSend);

  console.log(`[Bulk SMS] schoolId:${schoolId} balance:${balance} sending:${canSend.length} skipping:${willSkip.length}`);

  // ── Send loop ────────────────────────────────────────────────
  const results = [];
  for (const r of canSend) {
    try {
      const params = new URLSearchParams({ username: AT_USERNAME, to: r.to, message: r.message });
      if (r.from) params.append('from', r.from);

      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        params.toString(),
        {
          headers: {
            apiKey:         AT_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept:         'application/json',
          },
          validateStatus: () => true,
        }
      );

      const recipient  = response.data?.SMSMessageData?.Recipients?.[0];
      const atStatus   = (recipient?.status || '').toLowerCase();
      const wasAccepted = atStatus.includes('success') || atStatus.includes('sent') ||
                          atStatus.includes('queued')   || atStatus.includes('submitted');

      // Per-recipient diagnostic log — without this, a "failed" entry in the
      // UI gives no clue why AT rejected it (wrong sender ID, AT account out
      // of credit, invalid number, blacklisted, etc.) and you'd have to dig
      // through Firestore smsLogs to find out.
      console.log(
        `[Bulk SMS] to:${r.to} httpStatus:${response.status} ` +
        `atStatus:${recipient?.status || 'none'} ` +
        `cost:${recipient?.cost || '-'} messageId:${recipient?.messageId || '-'} ` +
        `→ ${wasAccepted ? 'ACCEPTED' : 'REJECTED'}`
      );
      if (!wasAccepted) {
        console.log(`[Bulk SMS] Full AT response for ${r.to}:`, JSON.stringify(response.data));
      }

      if (wasAccepted) {
        try { await deductWallet(schoolId, SMS_COST_PER_MSG); } catch (_) {}
      }

      results.push({
        to:       r.to,
        status:   wasAccepted ? 'sent' : 'failed',
        atStatus: recipient?.status || '',
        meta:     r.meta || {},
      });

      // Log
      try {
        await db.collection('smsLogs').doc(schoolId).collection('logs').add({
          to:        r.to,
          message:   r.message,
          status:    wasAccepted ? 'sent' : 'failed',
          atStatus:  recipient?.status || '',
          cost:      wasAccepted ? SMS_COST_PER_MSG : 0,
          messageId: recipient?.messageId || '',
          meta:      r.meta || {},
          sentAt:    new Date().toISOString(),
        });
      } catch (_) {}

      // 120ms between messages (AT rate limit)
      await new Promise(r => setTimeout(r, 120));

    } catch (err) {
      console.log(`[Bulk SMS] to:${r.to} → THREW: ${err.message}`);
      results.push({ to: r.to, status: 'error', reason: err.message, meta: r.meta || {} });
    }
  }

  // Mark skipped (balance ran out)
  for (const r of willSkip) {
    results.push({ to: r.to, status: 'skipped', reason: 'Insufficient balance', meta: r.meta || {} });
  }

  const finalBalance = await getWalletBalance(schoolId);
  const sent    = results.filter(r => r.status === 'sent').length;
  const failed  = results.filter(r => r.status === 'failed' || r.status === 'error').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  return res.json({
    success: true,
    summary: { sent, failed, skipped, balance: finalBalance },
    results,
  });
});

// ════════════════════════════════════════════════════════════════
//  WEBHOOK — updated to credit wallet for topup payments
// ════════════════════════════════════════════════════════════════
app.post('/api/webhook', async (req, res) => {
  res.json({ received: true });
  try {
    const payload   = req.body;
    const data      = payload.data || {};
    const tx        = data.transaction || {};

    const txRef     = tx.reference;
    const rawStatus = tx.status;
    const eventType = payload.event_type;
    const mpesaCode = data.MpesaReceiptNumber || null;
    const paidAmount = data.Amount || null;

    console.log('[Webhook]', { eventType, txRef, rawStatus, mpesaCode });

    if (!db || !txRef) return;

    const isConfirmed = eventType === 'payment.completed' || rawStatus === 'completed';
    const normStatus  = isConfirmed ? 'confirmed' : (rawStatus || eventType || 'unknown');

    await db.collection('payments').doc(txRef).set(
      { status: normStatus, mpesaCode, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    if (!isConfirmed) return;

    // ── Fetch payment doc to check type ─────────────────────────
    const paySnap = await db.collection('payments').doc(txRef).get();
    const payData = paySnap.exists ? paySnap.data() : {};
    const { type, schoolId, userId, amount, phone } = payData;

    // ── WALLET TOP-UP ────────────────────────────────────────────
    if (type === 'wallet_topup' && schoolId) {
      const creditAmount = paidAmount || amount || 0;
      await creditWallet(schoolId, Number(creditAmount), {
        txRef,
        mpesaCode,
        phone: phone || '',
      });

      console.log(`✅ Wallet credited — schoolId:${schoolId} amount:${creditAmount} mpesa:${mpesaCode}`);

      sendTelegram(
        `💚 <b>WALLET TOP-UP CONFIRMED</b> 💚\n\n` +
        `🏫 schoolId: <code>${schoolId}</code>\n` +
        `📱 Phone: <code>${phone || '—'}</code>\n` +
        `💰 Amount: Ksh ${creditAmount}\n` +
        `🧾 M-Pesa: <b>${mpesaCode || '—'}</b>\n` +
        `🆔 txRef: <code>${txRef}</code>\n` +
        `⏰ ${new Date().toLocaleString('en-KE')}`
      );
      return;
    }

    // ── ORIGINAL SUBSCRIPTION PAYMENT ────────────────────────────
    if (userId) {
      await db.collection('users').doc(userId).set(
        { paid: true, paidAt: new Date().toISOString(), mpesaCode, txRef },
        { merge: true }
      );
      console.log(`✅ Subscription confirmed — user:${userId} mpesa:${mpesaCode}`);

      sendTelegram(
        `💚 <b>PAYMENT CONFIRMED</b> 💚\n\n` +
        `📱 Phone: <code>${payData.phone || 'unknown'}</code>\n` +
        `💰 Amount: Ksh ${payData.amount || 'unknown'}\n` +
        `🧾 M-Pesa Code: <b>${mpesaCode || '—'}</b>\n` +
        `👤 userId: <code>${userId}</code>\n` +
        `🆔 txRef: <code>${txRef}</code>\n` +
        `⏰ ${new Date().toLocaleString('en-KE')}`
      );
    }

  } catch (err) {
    console.error('[Webhook] Error:', err.message);
  }
});

// ════════════════════════════════════════════════════════════════
//  ORIGINAL ROUTES (unchanged)
// ════════════════════════════════════════════════════════════════

app.get('/api/test', async (req, res) => {
  if (!API_KEY) return res.status(500).json({ success: false, message: 'PAYNECTA_API_KEY not set' });
  try {
    const response = await axios.get(`${BASE_URL}/me`, {
      headers: paynectaHeaders(),
      validateStatus: () => true,
    });
    const ok = response.status < 400;
    res.status(ok ? 200 : 400).json({
      success: ok,
      status:  response.status,
      message: ok ? 'API Key is valid ✅' : 'API Key rejected ❌',
      data:    response.data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/ai-remark', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not set' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 150,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message || 'Groq API error' });
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return res.status(500).json({ error: 'Groq returned no text' });
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stk-push', async (req, res) => {
  const { amount, phone, userId } = req.body;
  if (!amount || !phone) return res.status(400).json({ success: false, message: 'amount and phone are required' });
  if (!API_KEY || !USER_EMAIL || !MERCHANT_CODE) {
    return res.status(500).json({ success: false, message: 'Server misconfigured — set Paynecta env vars' });
  }
  try {
    const mobile  = normalisePhone(phone);
    const payload = { code: MERCHANT_CODE, mobile_number: mobile, amount: Number(amount) };
    const response = await axios.post(`${BASE_URL}/payment/initialize`, payload, { headers: paynectaHeaders() });
    const txRef = response.data?.data?.transaction_reference || response.data?.data?.CheckoutRequestID;
    if (db && txRef) {
      await db.collection('payments').doc(txRef).set({
        type: 'subscription',
        userId: userId || null,
        phone: mobile,
        amount: Number(amount),
        status: 'pending',
        txRef,
        createdAt: new Date().toISOString(),
      });
    }
    sendTelegram(
      `📱 <b>STK PUSH SENT</b>\n\n📞 Phone: <code>${mobile}</code>\n💰 Amount: Ksh ${amount}\n` +
      `🆔 txRef: <code>${txRef}</code>\n👤 userId: <code>${userId || 'unknown'}</code>\n` +
      `⏰ ${new Date().toLocaleString('en-KE')}`
    );
    res.json({ success: true, message: '✅ STK Push sent! Check your phone.', txRef, data: response.data });
  } catch (error) {
    res.status(400).json({ success: false, message: 'STK Push failed', error: error.response?.data || error.message });
  }
});

// Legacy per-school SMS proxy (kept for backward compat — settings page test button)
app.post('/api/sms/send', async (req, res) => {
  const { apiKey, username, to, message, from } = req.body;
  if (!apiKey || !username || !to || !message) {
    return res.status(400).json({ error: 'apiKey, username, to and message are all required' });
  }
  try {
    const params = new URLSearchParams({ username: username.trim(), to, message });
    if (from) params.append('from', from);
    const response = await axios.post(
      'https://api.africastalking.com/version1/messaging',
      params.toString(),
      {
        headers: { apiKey, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        validateStatus: () => true,
      }
    );
    return res.status(response.status).json(response.data);
  } catch (err) {
    return res.status(500).json(err.response?.data || { error: err.message });
  }
});

app.get('/api/pay/status/:txRef', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const snap = await db.collection('payments').doc(req.params.txRef).get();
    if (!snap.exists) return res.json({ status: 'pending' });
    const data   = snap.data();
    const status = data.status === 'completed' ? 'confirmed' : data.status;
    return res.json({ status, payment: data });
  } catch (err) {
    res.status(500).json({ error: 'Could not check status' });
  }
});

app.post('/api/schools/register', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  const { userId, name, county, subCounty, phone, email, principalName } = req.body;
  if (!userId || !name || !county) return res.status(400).json({ error: 'userId, name, county required' });
  try {
    const userSnap = await db.collection('users').doc(userId).get();
    if (!userSnap.exists || !userSnap.data().paid) {
      return res.status(403).json({ error: 'Payment required before registering' });
    }
    await db.collection('schools').doc(userId).set(
      { userId, name, county, subCounty: subCounty||'', phone: phone||'', email: email||'',
        principalName: principalName||'', status: 'pending', submittedAt: new Date().toISOString() },
      { merge: true }
    );
    await db.collection('settings').doc(userId).set(
      { name, county, subCounty, phone, email, principalName, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    sendTelegram(
      `🏫 <b>NEW SCHOOL REGISTERED</b>\n\n🏫 School: <b>${name}</b>\n📍 County: ${county}\n` +
      `👤 Principal: ${principalName || '—'}\n📞 Phone: ${phone || '—'}\n` +
      `🆔 userId: <code>${userId}</code>\n⏰ ${new Date().toLocaleString('en-KE')}`
    );
    res.json({ success: true, message: 'School registered. Awaiting approval.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register school' });
  }
});

app.get('/api/schools/pending', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const snap = await db.collection('schools').where('status', '==', 'pending').get();
    res.json({ count: snap.size, schools: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

app.get('/api/schools/:userId', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const snap = await db.collection('schools').doc(req.params.userId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

app.post('/api/schools/approve', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  const { userId, action, note } = req.body;
  if (!userId || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'userId and action (approve|reject) required' });
  }
  try {
    const now = new Date().toISOString();
    if (action === 'approve') {
      const s = await db.collection('schools').doc(userId).get();
      await db.collection('schools').doc(userId).set({ status: 'approved', approvedAt: now }, { merge: true });
      await db.collection('approvedSchools').doc(userId).set({ ...s.data(), status: 'approved', approvedAt: now });
      await db.collection('users').doc(userId).set({ approved: true, approvedAt: now }, { merge: true });
      sendTelegram(`✅ <b>SCHOOL APPROVED</b>\n\n🏫 School: <b>${s.data()?.name || userId}</b>\n🆔 userId: <code>${userId}</code>\n⏰ ${new Date().toLocaleString('en-KE')}`);
      res.json({ success: true, message: 'School approved.' });
    } else {
      await db.collection('schools').doc(userId).set({ status: 'rejected', rejectedAt: now, rejectionNote: note||'' }, { merge: true });
      await db.collection('users').doc(userId).set({ approved: false, rejected: true, rejectedAt: now, rejectionNote: note||'' }, { merge: true });
      sendTelegram(`🚫 <b>SCHOOL REJECTED</b>\n\n🆔 userId: <code>${userId}</code>\n📝 Note: ${note || '—'}\n⏰ ${new Date().toLocaleString('en-KE')}`);
      res.json({ success: true, message: 'School rejected.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update school' });
  }
});

app.post('/api/notify', async (req, res) => {
  const { text, apiKey } = req.body;
  if (apiKey !== process.env.NOTIFY_API_KEY) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!text) return res.status(400).json({ success: false, error: 'text required' });
  await sendTelegram(text);
  res.json({ success: true });
});

// ── Root + 404 ────────────────────────────────────────────────────────────────
// This service has no bundled frontend, so there is nothing to serve for
// non-API routes. Previously this fell through to express.static + a
// sendFile('public/index.html') catch-all, which threw ENOENT on every
// non-API hit (Render's own health pings, stray browser visits to "/",
// favicon requests, etc.) because that file/folder was never built or
// committed for this service.
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'instasend-backend', ts: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 https://instasend-backend.onrender.com`);
});
