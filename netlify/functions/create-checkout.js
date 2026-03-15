const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parsing défensif du body (string, base64, ou déjà objet)
    let body = event.body;
    if (!body) throw new Error('Body vide');
    if (event.isBase64Encoded) body = Buffer.from(body, 'base64').toString('utf8');
    if (typeof body === 'string') body = JSON.parse(body);

    console.log('[create-checkout] body reçu:', JSON.stringify(body));

    const email = body.email;
    const currency = body.currency || 'eur';
    const description = body.description || "Commande L'Art du Sillage";
    const amount = parseInt(body.amount || body.totalAmount || 0, 10);

    console.log('[create-checkout] amount parsé:', amount);

    if (!amount || amount <= 0 || isNaN(amount)) {
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
            currency: currency,
            unit_amount: amount,
            product_data: { name: description },
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
