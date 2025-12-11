import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2022-11-15' });

export async function POST(request: Request) {
  const buf = await request.arrayBuffer();
  const rawBody = Buffer.from(buf);
  const sig = request.headers.get('stripe-signature') || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string | undefined;
        // find user by customer_id and set is_pro true
        if (customerId) {
          const { data: profile } = await supabaseAdmin.from('user_profiles').select('user_id').eq('customer_id', customerId).limit(1).single();
          const userId = (profile as any)?.user_id ?? null;
          if (userId) {
            await supabaseAdmin.from('user_profiles').upsert({ user_id: userId, is_pro: true }, { onConflict: 'user_id' });
          }
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | undefined;
        const customerId = invoice.customer as string | undefined;
        if (customerId) {
          const { data: profile } = await supabaseAdmin.from('user_profiles').select('user_id').eq('customer_id', customerId).limit(1).single();
          const userId = (profile as any)?.user_id ?? null;
          if (userId) {
            // mark pro and store subscription id
            await supabaseAdmin.from('user_profiles').upsert({ user_id: userId, is_pro: true, subscription_id: subscriptionId }, { onConflict: 'user_id' });
          }
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string | undefined;
        const status = subscription.status;
        if (customerId) {
          const { data: profile } = await supabaseAdmin.from('user_profiles').select('user_id').eq('customer_id', customerId).limit(1).single();
          const userId = (profile as any)?.user_id ?? null;
          if (userId) {
            const isPro = status === 'active' || status === 'trialing';
            await supabaseAdmin.from('user_profiles').upsert({ user_id: userId, is_pro: isPro, subscription_id: subscription.id }, { onConflict: 'user_id' });
          }
        }
        break;
      }
      default:
        // ignore
        break;
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook handling error', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
