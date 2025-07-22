const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Load Stripe secret key from environment variables
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  console.log("Vercel Stripe Key:", stripeSecretKey);
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in environment variables.' });
  }
  const stripe = Stripe(stripeSecretKey);

  let body;
  try {
    body = req.body;
    // Vercel automatically parses JSON, but fallback for raw body
    if (!body || typeof body !== 'object') {
      body = JSON.parse(req.body);
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  const { amount, currency, planType, email } = body;
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
    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
