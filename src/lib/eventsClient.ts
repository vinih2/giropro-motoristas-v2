export async function sendEvent(event: string, metadata: unknown = null, accessToken?: string) {
  const body = { event, metadata };
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch('/api/events', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to send event: ${res.status} ${text}`);
  }
  return res.json();
}

export async function fetchEvents(limit = 10) {
  const res = await fetch(`/api/events?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}
