import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment');
if (!SERVICE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment');

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Simple in-memory rate limiter (per IP). For production, use a shared store (Redis).
const RATE_LIMIT_REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS || '60');
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const rateMap: Map<string, number[]> = new Map();

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = rateMap.get(ip) || [];
  const recent = timestamps.filter((t) => t > windowStart);
  recent.push(now);
  rateMap.set(ip, recent);
  return recent.length > RATE_LIMIT_REQUESTS;
}

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get('x-forwarded-for') || '';
    const ip = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();

    // Basic validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const event = String(body.event ?? 'unknown_event');
    const metadata = body.metadata ?? null;
    let user_id = body.user_id ?? null;

    // Optional: require authentication for writes if env var set
    const requireAuth = String(process.env.REQUIRE_AUTH_FOR_EVENTS || 'false').toLowerCase() === 'true';
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const parts = authHeader.split(' ');
      const token = parts.length === 2 ? parts[1] : null;
      if (token) {
        try {
          const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token as string);
          if (!userErr && userData?.user) {
            user_id = userData.user.id;
          } else if (requireAuth) {
            return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
          }
        } catch (e) {
          if (requireAuth) return NextResponse.json({ error: 'Auth verification failed' }, { status: 401 });
        }
      }
    } else if (requireAuth) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const payload = {
      user_id,
      event,
      metadata,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from('analytics_events').insert(payload).select().limit(1).single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit') || '10';
    const limit = Math.min(100, Math.max(1, Number(limitParam) || 10));

    const { data, error } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Allow deletion by id or by event name (or delete test events)
    const id = body?.id ?? null;
    const eventName = body?.event ?? null;

    if (!id && !eventName) {
      return NextResponse.json({ error: 'Provide `id` or `event` in body to delete' }, { status: 400 });
    }

    let query = supabaseAdmin.from('analytics_events').delete();
    if (id) query = query.eq('id', id);
    if (eventName) query = query.eq('event', eventName);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // `data` may be an array or a single object depending on the query/driver.
    const deletedCount = Array.isArray(data as any) ? (data as any).length : data ? 1 : 0;
    return NextResponse.json({ deleted: deletedCount }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
