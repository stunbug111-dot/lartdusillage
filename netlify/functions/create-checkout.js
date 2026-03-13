const Stripe = require('stripe');

exports.handler = async (event) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { email, items, total } = JSON.parse(event.body || '{}');

    // Use total directly if available, otherwise compute from items
    let amount;
    if (total && !isNaN(total)) {
      amount = Math.round(parseFloat(total) * 100);
    } else {
      amount = items.reduce((sum, i) => {
        const price = parseFloat(String(i.price).replace(/[^0-9.]/g, '')) || 0;
        const qty = parseInt(i.quantity) || 1;
        return sum + price * qty;
      }, 0);
      amount = Math.round(amount * 100);
    }

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
