require('dotenv').config();
const express    = require('express');
const axios      = require('axios');
const bodyParser = require('body-parser');
const cors       = require('cors');

const app = express();

app.use(cors({
  origin: [
    'https://bett.website',
    'https://www.bett.website',
    'https://manuubett.github.io',
  ],
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(bodyParser.json());

const PORT         = process.env.PORT || 5000;
const PAYNECTA_URL = 'https://paynecta.co.ke/api/v1';
const API_KEY      = process.env.PAYNECTA_API_KEY;      // from Paynecta dashboard
const API_EMAIL    = process.env.PAYNECTA_EMAIL;         // your Paynecta account email
const LINK_CODE    = process.env.PAYNECTA_LINK_CODE;     // payment link code from dashboard
const CALLBACK_URL = process.env.CALLBACK_URL;

// In-memory store (callback updates this)
const paymentStore = {};

// ── Auth headers ──
function headers() {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
  };
}

// ── Health check ──
app.get('/', (req, res) => {
  res.json({
    status:  'ok',
    service: 'CBE Mark Sheet — Paynecta Backend',
    time:    new Date().toISOString(),
    configured: {
      api_key:   !!API_KEY,
      email:     !!API_EMAIL,
      link_code: !!LINK_CODE,
      callback:  !!CALLBACK_URL,
    }
  });
});

// ── Initiate M-Pesa STK Push via Paynecta ──
app.post('/api/payment/pay', async (req, res) => {
  const { phone, amount } = req.body;
  console.log('[pay] Request:', { phone, amount });

  if (!phone || !amount) {
    return res.status(400).json({ error: 'phone and amount are required' });
  }

  // Accept 07XX or 2547XX format
  let normalised = String(phone).replace(/\D/g, '');
  if (normalised.startsWith('0')) normalised = '254' + normalised.slice(1);
  if (!/^2547\d{8}$/.test(normalised)) {
    return res.status(400).json({ error: 'Phone must be a valid Safaricom number e.g. 0712345678' });
  }

  if (!API_KEY || !LINK_CODE) {
    console.error('[pay] Missing PAYNECTA_API_KEY or PAYNECTA_LINK_CODE env vars');
    return res.status(500).json({ error: 'Payment gateway not configured on server' });
  }

  try {
    // Paynecta STK push endpoint
    const payload = {
      link_code:    LINK_CODE,
      phone_number: normalised,
      amount:       Number(amount),
      email:        API_EMAIL || 'admin@bett.website',
      callback_url: CALLBACK_URL,
      reference:    'CBE-' + Date.now(),
      description:  'CBE Mark Sheet Setup Fee',
    };

    console.log('[pay] Payload to Paynecta:', payload);

    const response = await axios.post(
      `${PAYNECTA_URL}/payments/initialize`,
      payload,
      { headers: headers() }
    );

    console.log('[pay] Paynecta response:', JSON.stringify(response.data, null, 2));

    // Extract transaction reference for polling
    const ref = response.data?.transaction_reference
      || response.data?.data?.transaction_reference
      || response.data?.reference
      || response.data?.id;

    if (ref) {
      paymentStore[ref] = { status: 'PENDING', raw: response.data };
      console.log('[pay] Stored reference:', ref);
    } else {
      console.warn('[pay] No reference found in response keys:', Object.keys(response.data || {}));
    }

    res.json(response.data);

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('[pay] Paynecta error:', JSON.stringify(errData));
    res.status(error.response?.status || 500).json({ error: errData });
  }
});

// ── Check payment status ──
app.get('/api/payment/status/:reference', async (req, res) => {
  const { reference } = req.params;
  console.log('[status] Checking:', reference);

  // Return cached if already resolved
  const stored = paymentStore[reference];
  if (stored) {
    const s = (stored.status || '').toUpperCase();
    if (['COMPLETE','COMPLETED','SUCCESS','SUCCESSFUL','PAID','FAILED','CANCELLED','EXPIRED'].includes(s)) {
      console.log('[status] Cached:', s);
      return res.json(stored.raw || { status: stored.status });
    }
  }

  try {
    const response = await axios.get(
      `${PAYNECTA_URL}/payments/status/${reference}`,
      { headers: headers() }
    );

    console.log('[status] Live:', JSON.stringify(response.data, null, 2));

    const status = (
      response.data?.status ||
      response.data?.data?.status ||
      response.data?.payment_status ||
      'PENDING'
    ).toUpperCase();

    paymentStore[reference] = { status, raw: response.data };
    res.json(response.data);

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('[status] Error:', JSON.stringify(errData));
    res.status(error.response?.status || 500).json({ error: errData });
  }
});

// ── Paynecta Webhook Callback ──
app.post('/api/payment/callback', (req, res) => {
  console.log('[callback]:', JSON.stringify(req.body, null, 2));

  const reference = req.body?.transaction_reference
    || req.body?.reference
    || req.body?.data?.transaction_reference;

  const status = (
    req.body?.status ||
    req.body?.payment_status ||
    req.body?.data?.status ||
    ''
  ).toUpperCase();

  if (reference) {
    paymentStore[reference] = { status, raw: req.body };
    console.log('[callback] Payment', reference, '→', status);
  } else {
    console.warn('[callback] No reference in body:', Object.keys(req.body || {}));
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log('CBE Paynecta Server on port', PORT);
  console.log('API key set:', !!API_KEY, '| Link code set:', !!LINK_CODE);
  console.log('Callback URL:', CALLBACK_URL);
});
