require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(express.json());

app.use(cors({
  origin: [
    'https://bett.website',
    'https://www.bett.website',
    'https://manuubett.github.io',
  ],
}));

const PORT = process.env.PORT || 5000;
const PAYNECTA_URL = 'https://paynecta.co.ke/api/v1';
const API_KEY = process.env.PAYNECTA_API_KEY;
const API_EMAIL = process.env.PAYNECTA_EMAIL;
const LINK_CODE = process.env.PAYNECTA_LINK_CODE;
const CALLBACK_URL = process.env.CALLBACK_URL;

// ⚠️ still temporary
const paymentStore = {};

// ── Helpers ──
function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function normalizePhone(phone) {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = '254' + p.slice(1);

  if (!/^2547\d{8}$/.test(p)) {
    throw new Error('Invalid Safaricom number');
  }

  return p;
}

// ── Health ──
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Paynecta Backend',
    time: new Date().toISOString(),
  });
});

// ── PAY ──
app.post('/api/payment/pay', async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: 'phone and amount required' });
    }

    const normalizedPhone = normalizePhone(phone);

    const payload = {
      link_code: LINK_CODE,
      phone_number: normalizedPhone,
      amount: Number(amount),
      email: API_EMAIL || 'admin@bett.website',
      callback_url: CALLBACK_URL,
      reference: 'PAY-' + Date.now(),
      description: 'Payment',
    };

    const response = await axios.post(
      `${PAYNECTA_URL}/payments/initialize`,
      payload,
      { headers: headers() }
    );

    const data = response.data;

    const ref =
      data?.transaction_reference ||
      data?.data?.transaction_reference ||
      data?.reference ||
      data?.id;

    if (ref) {
      paymentStore[ref] = {
        status: 'PENDING',
        raw: data,
      };
    }

    res.json(data);

  } catch (error) {
    const err = error.response?.data || error.message;
    console.error('[PAY ERROR]', err);
    res.status(500).json({ error: err });
  }
});

// ── STATUS ──
app.get('/api/payment/status/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const cached = paymentStore[reference];
    if (cached && ['SUCCESS','FAILED','COMPLETED'].includes(cached.status)) {
      return res.json(cached.raw);
    }

    const response = await axios.get(
      `${PAYNECTA_URL}/payments/status/${reference}`,
      { headers: headers() }
    );

    const data = response.data;

    const status = (
      data?.status ||
      data?.data?.status ||
      'PENDING'
    ).toUpperCase();

    paymentStore[reference] = { status, raw: data };

    res.json(data);

  } catch (error) {
    const err = error.response?.data || error.message;
    console.error('[STATUS ERROR]', err);
    res.status(500).json({ error: err });
  }
});

// ── CALLBACK ──
app.post('/api/payment/callback', (req, res) => {
  try {
    const body = req.body;

    const reference =
      body?.transaction_reference ||
      body?.reference ||
      body?.data?.transaction_reference;

    const status = (
      body?.status ||
      body?.payment_status ||
      body?.data?.status ||
      ''
    ).toUpperCase();

    if (reference) {
      paymentStore[reference] = {
        status,
        raw: body,
      };
    }

    console.log('[CALLBACK]', reference, status);

    res.sendStatus(200);

  } catch (err) {
    console.error('[CALLBACK ERROR]', err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Running on port ${PORT}`);
});
