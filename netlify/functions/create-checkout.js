const Stripe = require('stripe');

exports.handler = async (event) => {
  try {
    const stripe = new Stripe('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');
    const { email, items } = JSON.parse(event.body || '{}');
    const total = items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: "Commande L'Art du Sillage" },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://lartdusillage.netlify.app?payment=success',
      cancel_url: 'https://lartdusillage.netlify.app?payment=cancel',
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
