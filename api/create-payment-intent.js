const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Load Stripe secret key from environment variables
  let stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (stripeSecretKey) {
    stripeSecretKey = stripeSecretKey.trim();
  }
  
  // Enhanced debugging
  console.log("Environment variables available:", Object.keys(process.env).filter(key => key.includes('STRIPE')));
  console.log("Stripe key exists:", !!stripeSecretKey);
  console.log("Stripe key length:", stripeSecretKey ? stripeSecretKey.length : 0);
  console.log("Stripe key starts with sk_:", stripeSecretKey ? stripeSecretKey.startsWith('sk_') : false);
  
  if (!stripeSecretKey) {
    return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY in environment variables.' });
  }

  // Initialize Stripe instance fresh each time
  const stripe = Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16', // Use a specific API version
  });

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
    console.log("Creating payment intent with amount:", amount, "currency:", currency);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { planType: planType || '', email },
      automatic_payment_methods: { enabled: true },
    });
    
    console.log("Payment intent created successfully:", paymentIntent.id);
    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe error:", error.type, error.message);
    return res.status(400).json({ error: error.message });
  }
};

// ...existing code...