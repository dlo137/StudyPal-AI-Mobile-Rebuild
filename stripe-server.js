require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY in environment variables.');
  process.exit(1);
}
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
// Custom JSON parser with error handling
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency, planType, email } = req.body;
  // Basic validation
  if (!amount || !currency || !email) {
    return res.status(400).json({ error: 'Missing required fields: amount, currency, or email.' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { planType: planType || '', email },
      automatic_payment_methods: { enabled: true },
    });
    return res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(400).json({ error: error.message });
  }
});

// Catch invalid JSON errors globally
app.use((err, req, res, next) => {
  if (err.message === 'Invalid JSON') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }
  return res.status(500).json({ error: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
