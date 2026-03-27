require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const INSTASEND_BASE_URL = process.env.INSTASEND_BASE_URL;
const API_KEY = process.env.INSTASEND_API_KEY;

// Test route
app.get('/', (req, res) => res.send('InstaSend Payment Backend Running'));

// Endpoint to initiate payment
app.post('/api/payment/pay', async (req, res) => {
  const { phone, amount } = req.body;

  try {
    const payload = {
      phone,
      amount,
      callback_url: process.env.CALLBACK_URL,
      description: "Payment for service"
    };

    const response = await axios.post(`${INSTASEND_BASE_URL}/payments`, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Callback endpoint to receive payment status
app.post('/api/payment/callback', (req, res) => {
  console.log('InstaSend callback:', req.body);

  // TODO: save payment status to database
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
