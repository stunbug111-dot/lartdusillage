const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, items, totalAmount } = JSON.parse(event.body);

    // totalAmount est envoyé en centimes depuis le site (ex: 3289 pour 32.89€)
    // On l'utilise directement pour garantir que Stripe affiche exactement le même montant
    const amountInCents = totalAmount;

    if (!amountInCents || amountInCents <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Montant invalide' })
      };
    }

    // Construire la description du récapitulatif pour Stripe
    const description = items
      .map(i => `${i.name} × ${i.quantity}`)
      .join(', ');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountInCents, // Montant exact du site, en centimes
            product_data: {
              name: 'Commande L\'Art du Sillage',
              description: description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.URL}/index.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/index.html?payment=cancel`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
