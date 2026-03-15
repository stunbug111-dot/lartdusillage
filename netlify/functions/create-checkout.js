const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, currency, description } = body;

    // Compatible avec les deux versions du frontend
    const amount = body.amount || body.totalAmount;

    console.log('[create-checkout] amount reçu:', amount, '| email:', email);

    if (!amount || amount <= 0 || isNaN(amount)) {
      console.error('[create-checkout] Montant invalide:', amount);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Montant invalide: ' + amount })
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
            unit_amount: amount, // Montant exact en centimes depuis le site
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
    console.error('[create-checkout] Erreur:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
