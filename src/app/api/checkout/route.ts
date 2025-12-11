import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const PRICE_ID = process.env.STRIPE_PRICE_ID!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SERVICE_KEY || !STRIPE_KEY || !PRICE_ID) {
  // fail early in dev if missing
  console.warn('Checkout route: missing env vars (SUPABASE_URL,SERVICE_KEY,STRIPE_KEY,PRICE_ID)');
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2022-11-15' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Expect Authorization: Bearer <access_token> from client to link user
    const auth = req.headers.get('authorization');
    let userId: string | null = null;
    let email: string | null = null;

    if (auth?.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr) {
        // allow anonymous creation (optional) but better to require auth
        console.warn('Checkout: auth.getUser error', userErr.message);
      }
      if (userData?.user) {
        userId = userData.user.id;
        email = userData.user.email ?? null;
      }
    }

    // find or create stripe customer linked to user_profiles
    let customerId: string | null = null;
    if (userId) {
      const { data: profile } = await supabaseAdmin.from('user_profiles').select('customer_id').eq('user_id', userId).single();
      customerId = (profile as any)?.customer_id ?? null;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({ email: email ?? null, metadata: { app_user_id: userId ?? undefined } } as any);
      customerId = customer.id;
      // store customer id if we have a user
      if (userId) {
        await supabaseAdmin.from('user_profiles').upsert({ user_id: userId, customer_id: customerId }, { onConflict: 'user_id' });
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${BASE_URL}/?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/?checkout_canceled=true`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error('Checkout POST error', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
