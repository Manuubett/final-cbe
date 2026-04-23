require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const path    = require('path');
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
  console.warn('⚠️  Firebase env vars not set — schools and webhook routes will not persist data');
}


// ── Telegram Notifier ─────────────────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN) console.warn('⚠️  TELEGRAM_BOT_TOKEN not set — notifications disabled');
if (!TELEGRAM_CHAT_ID)   console.warn('⚠️  TELEGRAM_CHAT_ID not set — notifications disabled');

async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[Telegram] Skipped — BOT_TOKEN or CHAT_ID missing');
    return;
  }
  console.log('[Telegram] Sending message…');
  try {
    const res = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id:                  TELEGRAM_CHAT_ID,
        text,
        parse_mode:               'HTML',
        disable_web_page_preview: true,
      }
    );
    if (res.data?.ok) {
      console.log('[Telegram] ✅ Sent successfully — message_id:', res.data.result?.message_id);
    } else {
      console.warn('[Telegram] ⚠️  API returned not-ok:', JSON.stringify(res.data));
    }
  } catch (err) {
    console.error('[Telegram] ❌ Failed:', err.response?.data || err.message);
  }
}

// ── App setup ────────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Paynecta config ───────────────────────────────────────────────────────────
const API_KEY       = process.env.PAYNECTA_API_KEY;
const USER_EMAIL    = process.env.PAYNECTA_EMAIL;
const MERCHANT_CODE = process.env.PAYNECTA_CODE;
const BASE_URL      = 'https://paynecta.co.ke/api/v1';

const paynectaHeaders = () => ({
  'X-API-Key':    API_KEY,
  'X-User-Email': USER_EMAIL,
  'Content-Type': 'application/json',
});

if (!API_KEY)       console.error('❌ PAYNECTA_API_KEY not set');
if (!USER_EMAIL)    console.warn('⚠️  PAYNECTA_EMAIL not set');
if (!MERCHANT_CODE) console.warn('⚠️  PAYNECTA_CODE not set');

function normalisePhone(phone) {
  let p = phone.toString().replace(/\D/g, '');
  if (p.startsWith('0'))    p = '254' + p.slice(1);
  if (!p.startsWith('254')) p = '254' + p;
  return p;
}

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// ── Test API Key ──────────────────────────────────────────────────────────────
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

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not set in environment' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 130,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'OpenAI API error' });
    }

    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return res.status(500).json({ error: 'OpenAI returned no text' });
    }

    res.json({ text });

  } catch (err) {
    console.error('OpenAI endpoint error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// ── M-Pesa STK Push ───────────────────────────────────────────────────────────
app.post('/api/stk-push', async (req, res) => {
  const { amount, phone, userId } = req.body;

  if (!amount || !phone) {
    return res.status(400).json({ success: false, message: 'amount and phone are required' });
  }
  if (!API_KEY || !USER_EMAIL || !MERCHANT_CODE) {
    return res.status(500).json({
      success: false,
      message: 'Server misconfigured — set PAYNECTA_API_KEY, PAYNECTA_EMAIL, PAYNECTA_CODE in Render env vars',
    });
  }

  try {
    const mobile = normalisePhone(phone);

    const payload = {
      code:          MERCHANT_CODE,
      mobile_number: mobile,
      amount:        Number(amount),
    };

    console.log('[STK] Sending:', { mobile, amount, code: MERCHANT_CODE });

    const response = await axios.post(`${BASE_URL}/payment/initialize`, payload, {
      headers: paynectaHeaders(),
    });

    const txRef = response.data?.data?.transaction_reference
               || response.data?.data?.CheckoutRequestID;

    if (db && txRef) {
      await db.collection('payments').doc(txRef).set({
        userId: userId || null,
        phone: mobile,
        amount: Number(amount),
        status: 'pending',
        txRef,
        createdAt: new Date().toISOString(),
      });
    }

    console.log('[STK] ✅ Success txRef:', txRef);

    // Notify Telegram — STK push initiated
    sendTelegram(
      `📱 <b>STK PUSH SENT</b>\n\n` +
      `📞 Phone: <code>${mobile}</code>\n` +
      `💰 Amount: Ksh ${amount}\n` +
      `🆔 txRef: <code>${txRef}</code>\n` +
      `👤 userId: <code>${userId || 'unknown'}</code>\n` +
      `⏰ ${new Date().toLocaleString('en-KE')}`
    );

    res.json({ success: true, message: '✅ STK Push sent! Check your phone.', txRef, data: response.data });

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('[STK] Error:', errData);
    res.status(400).json({ success: false, message: 'STK Push failed', error: errData });
  }
});

// ── Webhook ───────────────────────────────────────────────────────────────────
// Paynecta payload structure (confirmed from live log):
// {
//   event_type: "payment.completed",
//   data: {
//     transaction: { reference: "CBET...", status: "completed" },
//     MpesaReceiptNumber: "UCULOAXIKR",
//     Amount: 1,
//     customer: { mobile_number: "254..." }
//   }
// }
app.post('/api/webhook', async (req, res) => {
  res.json({ received: true });
  try {
    const payload    = req.body;
    const data       = payload.data || {};
    const tx         = data.transaction || {};

    const txRef      = tx.reference;
    const rawStatus  = tx.status;
    const eventType  = payload.event_type;
    const mpesaCode  = data.MpesaReceiptNumber || null;

    console.log('[Webhook]', { eventType, txRef, rawStatus, mpesaCode });

    if (!db || !txRef) {
      console.warn('[Webhook] Skipping — missing db or txRef');
      return;
    }

    // Treat "payment.completed" event OR status "completed" as confirmed
    const isConfirmed = eventType === 'payment.completed' || rawStatus === 'completed';
    const normStatus  = isConfirmed ? 'confirmed' : (rawStatus || eventType || 'unknown');

    // Update the payment doc (keyed by txRef)
    await db.collection('payments').doc(txRef).set(
      { status: normStatus, mpesaCode, updatedAt: new Date().toISOString() },
      { merge: true }
    );

    if (isConfirmed) {
      // Also look up the payment doc to find the userId saved during STK push
      const paySnap = await db.collection('payments').doc(txRef).get();
      const userId  = paySnap.exists ? paySnap.data().userId : null;

      if (userId) {
        await db.collection('users').doc(userId).set(
          { paid: true, paidAt: new Date().toISOString(), mpesaCode, txRef },
          { merge: true }
        );
        console.log(`✅ Payment confirmed — user:${userId} mpesa:${mpesaCode}`);

        // Notify Telegram — payment confirmed
        const payData = paySnap.data();
        sendTelegram(
          `💚 <b>PAYMENT CONFIRMED</b> 💚\n\n` +
          `📱 Phone: <code>${payData.phone || 'unknown'}</code>\n` +
          `💰 Amount: Ksh ${payData.amount || 'unknown'}\n` +
          `🧾 M-Pesa Code: <b>${mpesaCode || '—'}</b>\n` +
          `👤 userId: <code>${userId}</code>\n` +
          `🆔 txRef: <code>${txRef}</code>\n` +
          `⏰ ${new Date().toLocaleString('en-KE')}`
        );
      } else {
        console.warn('[Webhook] ✅ Payment confirmed but no userId on payment doc — txRef:', txRef);

        sendTelegram(
          `⚠️ <b>PAYMENT CONFIRMED — NO USER</b>\n\n` +
          `🧾 M-Pesa Code: <b>${mpesaCode || '—'}</b>\n` +
          `🆔 txRef: <code>${txRef}</code>\n` +
          `⏰ ${new Date().toLocaleString('en-KE')}\n\n` +
          `<i>No userId linked to this payment. Manual check needed.</i>`
        );
      }
    }

  } catch (err) {
    console.error('[Webhook] Error:', err.message);
  }
});

// ── Payment status ────────────────────────────────────────────────────────────
app.get('/api/pay/status/:txRef', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  console.log('[STATUS] Hit — txRef:', req.params.txRef);
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const snap = await db.collection('payments').doc(req.params.txRef).get();
    if (!snap.exists) return res.json({ status: 'pending' });
    const data   = snap.data();
    // Normalise any legacy "completed" docs
    const status = data.status === 'completed' ? 'confirmed' : data.status;
    console.log('[STATUS] Returning status:', status, 'for txRef:', req.params.txRef);
    return res.json({ status, payment: data });
  } catch (err) {
    console.error('[STATUS] Error:', err.message);
    res.status(500).json({ error: 'Could not check status' });
  }
});

// ── Register school ───────────────────────────────────────────────────────────
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
    // Notify Telegram — new school registered
    sendTelegram(
      `🏫 <b>NEW SCHOOL REGISTERED</b>\n\n` +
      `🏫 School: <b>${name}</b>\n` +
      `📍 County: ${county}${subCounty ? ' (' + subCounty + ')' : ''}\n` +
      `👤 Principal: ${principalName || '—'}\n` +
      `📞 Phone: ${phone || '—'}\n` +
      `✉️ Email: ${email || '—'}\n` +
      `🆔 userId: <code>${userId}</code>\n` +
      `⏰ ${new Date().toLocaleString('en-KE')}`
    );

    res.json({ success: true, message: 'School registered. Awaiting approval.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register school' });
  }
});

// ── Pending schools ───────────────────────────────────────────────────────────
app.get('/api/schools/pending', async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Firebase not configured' });
  try {
    const snap = await db.collection('schools').where('status', '==', 'pending').get();
    res.json({ count: snap.size, schools: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// ── Get one school ────────────────────────────────────────────────────────────
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

// ── Approve / reject school ───────────────────────────────────────────────────
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
      // Notify Telegram — school approved
      const approvedData = s.data() || {};
      sendTelegram(
        `✅ <b>SCHOOL APPROVED</b>\n\n` +
        `🏫 School: <b>${approvedData.name || userId}</b>\n` +
        `📍 County: ${approvedData.county || '—'}\n` +
        `🆔 userId: <code>${userId}</code>\n` +
        `⏰ ${new Date().toLocaleString('en-KE')}`
      );

      res.json({ success: true, message: 'School approved.' });
    } else {
      await db.collection('schools').doc(userId).set({ status: 'rejected', rejectedAt: now, rejectionNote: note||'' }, { merge: true });
      await db.collection('users').doc(userId).set({ approved: false, rejected: true, rejectedAt: now, rejectionNote: note||'' }, { merge: true });
      // Notify Telegram — school rejected
      sendTelegram(
        `🚫 <b>SCHOOL REJECTED</b>\n\n` +
        `🆔 userId: <code>${userId}</code>\n` +
        `📝 Note: ${note || '—'}\n` +
        `⏰ ${new Date().toLocaleString('en-KE')}`
      );

      res.json({ success: true, message: 'School rejected.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update school' });
  }
});

// ── Telegram notify (called directly from frontend) ──────────────────────────
app.post('/api/notify', async (req, res) => {
  console.log('[Notify] Hit — apiKey present:', !!req.body.apiKey, '| text length:', (req.body.text||'').length);
  const { text, apiKey } = req.body;
  if (apiKey !== process.env.NOTIFY_API_KEY) {
    console.warn('[Notify] ❌ Unauthorized — key mismatch');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  if (!text) return res.status(400).json({ success: false, error: 'text required' });
  await sendTelegram(text);
  res.json({ success: true });
});

// ── Static files + SPA catch-all (MUST be last) ───────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));// NEW - Express 5 compatible
app.get('*splat', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 https://instasend-backend.onrender.com`);
});
