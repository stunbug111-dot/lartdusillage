const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, amount, currency, description } = JSON.parse(event.body);

    // `amount` est le total exact du site, en centimes (ex: 3289 = 32.89€)
    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Montant invalide' })
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: currency || 'eur',
            unit_amount: amount, // Montant exact en centimes, identique au site
            product_data: {
              name: description || "Commande L'Art du Sillage",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}?payment=cancel`,
    });

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
