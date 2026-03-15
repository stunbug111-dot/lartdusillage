const Stripe = require('stripe');

exports.handler = async (event) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { email, items } = JSON.parse(event.body || '{}');

    // Les prix arrivent déjà en centimes depuis le HTML
    const amount = items.reduce((sum, i) => {
      return sum + (parseInt(i.price) || 0) * (parseInt(i.quantity) || 1);
    }, 0);

    if (!amount || amount <= 0) {
      throw new Error('Montant invalide: ' + amount);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: "Commande L'Art du Sillage" },
          unit_amount: amount,
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
