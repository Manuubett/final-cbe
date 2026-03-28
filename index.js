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
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
}));

const PORT = process.env.PORT || 5000;

// ✅ Correct base URL
const PAYNECTA_URL = 'https://paynecta.co.ke/api/v1';

const API_KEY = process.env.PAYNECTA_API_KEY;

// Temporary store
const paymentStore = {};

// ── Helpers ──
function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`, // ⚠️ If fails, change to: Token ${API_KEY}
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
    service: 'Paynecta Backend FINAL',
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
      phone_number: normalizedPhone,
      amount: Number(amount),
      reference: 'PAY-' + Date.now(),
      description: 'Test Payment',
    };

    console.log("➡️ URL:", `${PAYNECTA_URL}/payment/initialize`);
    console.log("➡️ Payload:", payload);

    const response = await axios.post(
      `${PAYNECTA_URL}/payment/initialize`,
      payload,
      { headers: headers() }
    );

    const data = response.data;

    console.log("✅ Paynecta Response:", data);

    const ref =
      data?.transaction_reference ||
      data?.reference ||
      payload.reference;

    paymentStore[ref] = {
      status: 'PENDING',
      raw: data,
    };

    res.json({ ...data, reference: ref });

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

    console.log("🔍 Checking status:", reference);

    const response = await axios.get(
      `${PAYNECTA_URL}/payment/status/${reference}`,
      { headers: headers() }
    );

    const data = response.data;

    console.log("📊 Status Response:", data);

    const status = (
      data?.status ||
      data?.payment_status ||
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

// ── CALLBACK (optional) ──
app.post('/api/payment/callback', (req, res) => {
  console.log('[CALLBACK]', req.body);
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
