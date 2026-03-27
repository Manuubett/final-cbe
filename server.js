require('dotenv').config();
const express    = require('express');
const axios      = require('axios');
const bodyParser = require('body-parser');
const cors       = require('cors');

const app  = express();
app.use(cors());
app.use(bodyParser.json());

const PORT             = process.env.PORT || 5000;
const INSTASEND_BASE   = process.env.INSTASEND_BASE_URL;  // https://api.intasend.com/v1
const API_KEY          = process.env.INSTASEND_API_KEY;
const CALLBACK_URL     = process.env.CALLBACK_URL;

// In-memory store for payment statuses (callback updates this)
const paymentStore = {};

// ── Health check ──
app.get('/', (req, res) => res.send('CBE IntaSend Backend Running ✅'));

// ── Initiate STK Push ──
app.post('/api/payment/pay', async (req, res) => {
  const { phone, amount } = req.body;

  if(!phone || !amount){
    return res.status(400).json({ error: 'phone and amount are required' });
  }

  try {
    const payload = {
      phone_number:   phone,
      amount:         amount,
      currency:       'KES',
      api_ref:        'CBE-' + Date.now(),
      callback_url:   CALLBACK_URL,
      narrative:      'CBE Mark Sheet Setup Fee'
    };

    const response = await axios.post(
      `${INSTASEND_BASE}/payment/mpesa-stk-push/`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type':  'application/json'
        }
      }
    );

    // Store initial status
    const invoiceId = response.data?.invoice?.invoice_id;
    if(invoiceId) paymentStore[invoiceId] = { state: 'PENDING', data: response.data };

    console.log('STK push initiated:', invoiceId);
    res.json(response.data);

  } catch (error) {
    console.error('STK push error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ── Check payment status ──
app.get('/api/payment/status/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;

  // First check local store (updated by callback)
  if(paymentStore[invoiceId]){
    const stored = paymentStore[invoiceId];
    if(stored.state === 'COMPLETE' || stored.state === 'FAILED'){
      return res.json(stored.data || { state: stored.state });
    }
  }

  // Otherwise query IntaSend directly
  try {
    const response = await axios.get(
      `${INSTASEND_BASE}/payment/invoices/${invoiceId}/`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type':  'application/json'
        }
      }
    );
    // Update store
    const state = response.data?.invoice?.state || response.data?.state;
    if(state) paymentStore[invoiceId] = { state, data: response.data };

    res.json(response.data);
  } catch (error) {
    console.error('Status check error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// ── IntaSend Callback (payment confirmed) ──
app.post('/api/payment/callback', (req, res) => {
  console.log('IntaSend callback received:', JSON.stringify(req.body, null, 2));

  const invoiceId = req.body?.invoice?.invoice_id || req.body?.invoice_id;
  const state     = req.body?.invoice?.state || req.body?.state;

  if(invoiceId && state){
    paymentStore[invoiceId] = { state: state.toUpperCase(), data: req.body };
    console.log(`Payment ${invoiceId} → ${state}`);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`CBE Payment Server running on port ${PORT}`));
