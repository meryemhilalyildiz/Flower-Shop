import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { buyer, basketItems, orderId } = await req.json();

    console.log('Received request:', { buyer, basketItems, orderId });

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe API key bulunamadı');
    }

    console.log('Stripe key found');

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Stripe Checkout Session oluştur
    const lineItems = basketItems.map(item => ({
      price_data: {
        currency: 'try',
        product_data: {
          name: item.name,
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

    console.log('Line Items:', JSON.stringify(lineItems, null, 2));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:5173/#/siparis-tamamlandi/' + orderId,
      cancel_url: 'http://localhost:5173/#/odeme',
      customer_email: buyer.email,
      metadata: {
        buyer_id: buyer.id,
        buyer_name: buyer.name,
        buyer_phone: buyer.phone,
        order_id: orderId
      }
    });

    console.log('Stripe Session:', session);

    return new Response(
      JSON.stringify({ paymentPageUrl: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});